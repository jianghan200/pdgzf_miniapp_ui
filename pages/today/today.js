// pages/today/today.js
const dataHelper = require('../../utils/data')
const util = require('../../utils/util')
let app = getApp()
const subHelper = require('../../utils/subscripton')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    // 要展示的数据
    list: [],
    // dateStamp
    milestone: '',
    timeStamp: '',
    // 小区、房源数量
    projectCount: 0,
    houseCount: 0,
    // Modal相关
    showModal: false,
    // 每天早9:30 ～ 10:03之间要关闭选房
    disable: false,
    // vip的身份flag
    isVip: false
  },

  onLoad: function (options) {
    const date = new Date()
    // 9:30 am ~ 10:03 am期间禁选
    if ((date.getHours() == 9 && date.getMinutes() >= 30) || (date.getHours() == 10 && date.getMinutes() <= 3)) {
      this.setData({
        disable : true,
        isVip : app.globalData.userinfo.type == 2
      })
    } else {
      // 正常情况
      this.setData({
        disable : false
      }, () => {
        this.useTodayProjectsInStorage()
      })
    }
  },

  // 刷新今日的数据
  refresh() {
    dataHelper.loadTodayData().then((res) => {
      // 读取最新的今日数据
      this.useTodayProjectsInStorage()
      // 展示Modal
      this.refreshSuccessModal()
    }).catch((err) => {
      console.log(err)
    })
  },

  // 显示刷新数据成功后的Modal
  refreshSuccessModal() {
    this.setData({
      showModal: true
    })
  },

  // 隐藏Modal
  hideModal() {
    this.setData({
      showModal: false
    })
  },

  // 读取
  useTodayProjectsInStorage() {
    let todayProjects = wx.getStorageSync('todayProjects')
    if (todayProjects) {
      // 计算当前的周期，每天早9:30之前属于前一天的选房周期
      let now = new Date()
      let milestone = util.formatDate(new Date())
      if (now.getHours() < 9 || (now.getHours() == 9 && now.getMinutes() <= 29)) {
        milestone = util.formatDate(util.yesterday())
      }
      // 计算小区和房源的数量
      let allProjects = []
      let allHouses = []
      todayProjects.forEach(area => { allProjects = allProjects.concat(area.projects) })
      allProjects.forEach(p => { allHouses = allHouses.concat(p.houses) })
      this.setData({
        list : todayProjects,
        milestone : milestone,
        timeStamp : util.formatTime(new Date()),
        projectCount : allProjects.length,
        houseCount : allHouses.length,
        isVip : app.globalData.userinfo.type == 2
      })
    }
  },

  // 用户点击【在地图上查看】
  openMap(e) {
    wx.navigateTo({
      url: '/pages/map/map?mode=today',
    })
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    let id = e.currentTarget.dataset.id
    let aid = e.currentTarget.dataset.aid
    let pid = e.currentTarget.dataset.pid
    let theArea = this.data.list.find(area => area.id == id && area.areaId == aid)
    let theProject = theArea.projects.find(p => p.pId == pid)
    wx.navigateTo({
      url: `/pages/map/map?mode=singleToday&id=${id}&pid=${pid}&aid=${aid}&pname=${theProject.pName}`,
    })
  },

  // 用户点击【房屋详情】
  navToHouses(e) {
    let pId = e.currentTarget.dataset.pid
    let url = '../project/project?pid=' + pId
    wx.navigateTo({
      url: url,
    })
  },

  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    // 从event中获取定位数据
    let pid = e.currentTarget.dataset.pid
    let pname = e.currentTarget.dataset.pname
    let aid = e.currentTarget.dataset.areaid

    let self = this
    // 找所属到街道
    let area = 
      self.data.list.find(area => {
        // 数据可能出现areaId为空的情况或者小区Id为空的情况
        let projectOpt = area.projects.find(p => p.pId == pid)
        return projectOpt && area.areaId == aid
      })
    let indexOfThisArea = self.data.list.indexOf(area)

    // 找到小区
    let projectsOfThisArea = area.projects
    let projectOnChange = projectsOfThisArea.find(p => p.pId == pid)
    let indexOfProjectOnChange = projectsOfThisArea.indexOf(projectOnChange)
    
    if (!projectOnChange.isSubscribed) {
      // 开启订阅
      subHelper
        .subscribeThenSyncUp(aid, pid, pname)
        .then((rid) => {
          // 替换
          projectOnChange.isSubscribed = true
          projectOnChange.ruleId = rid
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          let updatedArea = {
            id: area.id,
            areaId: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea
          }
          // 更新list
          self.setData({
            ['list[' + indexOfThisArea + ']'] : updatedArea
          })
        })
        .catch((err) => {
          console.log(err)
        })
    } else {
      // 关闭订阅
      subHelper
        .unsubscribeThenSyncUp(projectOnChange.ruleId, aid, pid)
        .then((res) => {
          // 替换
          projectOnChange.isSubscribed = false
          projectOnChange.ruleId = ''
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          let updatedArea = {
            id: area.id,
            areaId: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea
          }
          // 更新list
          self.setData({
            ['list[' + indexOfThisArea + ']'] : updatedArea
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'today') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    let self = this
    return {
      title : 'PD公租房',
      path : '/pages/login/login',
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({
            title: '转发成功',
            icon: 'success'
          })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({
            title: '转发已取消',
          })
        } else {
          wx.showToast({
            title: '转发失败',
          })
        }
      }
    }
  }
})