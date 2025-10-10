// pages/today/today.js
const dataHelper = require('../../utils/data')
const util = require('../../utils/util')
let app = getApp()
const subHelper = require('../../utils/subscripton')
const constants = require('../../utils/constants')
const log = require('./../../utils/log')
const userHelper = require('./../../utils/user')
const wpHelper = require('../../utils/wp')

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
    isVip: false,
    hasStartDate: false,
    // 公告
    broadcastMsgs: []
  },

  onLoad: function (options) {
    log.info('onLoad today')
    // 获取公告
    this.getBroadcastMsgs()
    // 根据当前的时间设置“今日页”的状态
    const date = new Date()
    // 9:30 am ~ 10:03 am期间禁选
    if ((date.getHours() == 9 && date.getMinutes() >= 30) || (date.getHours() == 10 && date.getMinutes() <= 3)) {
      log.info('选房期，不显示今日房源')

      this.setData({
        disable : true,
        isVip : app.globalData.userinfo.type == 2,
        // 用户是否输入了自己的startDated
        hasStartDate : this.hasStartDate()
      })
    } else {
      log.info('正常情况')
      // 正常情况
      this.setData({ disable : false }, () => { this.useTodayProjectsInStorage() })
    }
    if (options['pid'] != undefined && options['pid'] != '') {
      // 来自分享, 需要redirect到community页面, 由于耦合度高, 因此要先跳转到today页面, 再跳转到community
      let forum = ''
      if(options['forum'] != undefined && options['forum'] != '') {
        forum = `&forum=${options['forum']}`
      }
      let aid = ''
      if(options['aid'] != undefined && options['aid'] != '') {
        aid = `&aid=${options['aid']}`
      }
      let discussionType = ''
      if(options['discussionType'] != undefined && options['discussionType'] != '') {
        discussionType = `&discussionType=${options['discussionType']}`
      }
      wx.navigateTo({ url: '../community/community?pid=' + options['pid'] + forum + aid + discussionType})
    } else if (options['mode'] != undefined && options['mode'] != '') {
      wx.navigateTo({ url: '../map/map?mode=' + options['mode']})
    }
  },

  // 活动公告
  getBroadcastMsgs() {
    const self = this
    wpHelper
      .getBroadcastMsgs()
      .then((res) => {
        log.info(`获得${res.length}条公告`)

        self.setData({ broadcastMsgs : res })
      })
      .catch((err) => {
        log.error(err)
        console.log(err)
        
        wx.showToast({ title: '未获取公告', icon: 'error' })
      })
  },

  // 刷新今日的数据
  refresh() {
    log.info('刷新房源')

    dataHelper.loadTodayData().then((res) => {
      log.info('loadTodayData 成功')
      // 读取最新的今日数据
      this.useTodayProjectsInStorage()
      // 展示Modal
      this.refreshSuccessModal()
    }).catch(err => { console.log(err) })
  },

  // 显示刷新数据成功后的Modal
  refreshSuccessModal() {
    this.setData({ showModal: true })
  },

  // 隐藏Modal
  hideModal() {
    this.setData({ showModal: false })
  },

  // 读取
  useTodayProjectsInStorage() {
    log.info('从缓存中读取今日房源的信息')

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

      // 计算每个项目的热度指标（所有房屋队列长度的总和）
      todayProjects.forEach(area => {
        area.projects.forEach(project => {
          let hotness = 0
          if (project.houses && project.houses.length > 0) {
            project.houses.forEach(house => {
              if (house.queue && house.queue.length) {
                hotness += house.queue.length
              }
            })
          }
          project.hotness = hotness
        })
      })

      this.setData({
        list : todayProjects,
        milestone : milestone,
        timeStamp : util.formatTime(new Date()),
        projectCount : allProjects.length,
        houseCount : allHouses.length,
        isVip : app.globalData.userinfo.type == 2,
        // 用户是否输入了自己的startDated
        hasStartDate : this.hasStartDate()
      })
    }
  },

  // 判断用户的资格日：
  hasStartDate() {
    const startDateCode = userHelper.hasStartDate()
    if (startDateCode >= 0) { return true } else { return false }
  },

  // 用户点击【在地图上查看】
  openMap(e) {
    wx.navigateTo({ url: '/pages/map/map?mode=today' })
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    const id = e.currentTarget.dataset.id
    const aid = e.currentTarget.dataset.aid
    const pid = e.currentTarget.dataset.pid
    const theArea = this.data.list.find(area => area.id == id && area.areaId == aid)
    const theProject = theArea.projects.find(p => p.pId == pid)
    wx.navigateTo({ url: `/pages/map/map?mode=singleToday&id=${id}&pid=${pid}&aid=${aid}&pname=${theProject.pName}` })
  },

  // 用户点击进入【房屋详情】
  navToProject(e) {
    const pId = e.currentTarget.dataset.pid
    wx.navigateTo({ url: '../community/community?pid=' + pId })
  },

  // 普通用户点击VIP范例
  vipSample(e) {
    log.info('普通用户点击vip范例')

    wx.navigateTo({ url: '../community/community?pid=' + constants.vipPid + '&mock=true' })
  },

  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    // 从event中获取定位数据
    const pid = e.currentTarget.dataset.pid
    const pname = e.currentTarget.dataset.pname
    const aid = e.currentTarget.dataset.areaid
    // 如果这个用户是初次使用【订阅】功能的普通用户，需要授权我们使用他的昵称
    const self = this
    self.doSubscribe(pid, pname, aid)
  },

  // 专注于订阅的业务逻辑代码
  doSubscribe(pid, pname, aid) {
    log.info(`用户点击subscribe: pid: ${pid}, pname: ${pname}, aid: ${aid}`)

    const self = this
    // 找所属到街道
    const area = 
      self.data.list.find(area => {
        // 数据可能出现areaId为空的情况或者小区Id为空的情况
        const projectOpt = area.projects.find(p => p.pId == pid)
        return projectOpt && area.areaId == aid
      })
    const indexOfThisArea = self.data.list.indexOf(area)

    // 找到小区
    let projectsOfThisArea = area.projects
    let projectOnChange = projectsOfThisArea.find(p => p.pId == pid)
    const indexOfProjectOnChange = projectsOfThisArea.indexOf(projectOnChange)
    
    if (!projectOnChange.isSubscribed) {
      log.info('开启订阅')
      // 开启订阅
      subHelper
        .subscribeThenSyncUp(aid, pid, pname)
        .then((rid) => {
          log.info('subscribeThenSyncUp 成功')
          // 替换
          projectOnChange.isSubscribed = true
          projectOnChange.ruleId = rid
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          const updatedArea = { id: area.id, areaId: aid, areaName: area.areaName, projects: projectsOfThisArea }
          // 更新list
          self.setData({ ['list[' + indexOfThisArea + ']'] : updatedArea })
        })
        .catch((err) => {
          log.error('subscribeThenSyncUp 失败')
          log.error(err)
          console.log(err)
        })
    } else {
      log.info('关闭订阅')
      // 关闭订阅
      subHelper
        .unsubscribeThenSyncUp(projectOnChange.ruleId, aid, pid)
        .then(() => {
          log.info('unsubscribeThenSyncUp 成功')
          // 替换
          projectOnChange.isSubscribed = false
          projectOnChange.ruleId = ''
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          const updatedArea = { id: area.id, areaId: aid, areaName: area.areaName, projects: projectsOfThisArea }
          // 更新list
          self.setData({ ['list[' + indexOfThisArea + ']'] : updatedArea })
        })
        .catch((err) => {
          log.error('unsubscribeThenSyncUp 失败')
          log.error(err)
          console.log(err)
        })
    }
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'today') {
      wx.redirectTo({ url: `/pages/${newTab}/${newTab}` })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    return {
      title : '今日房源',
      path : '/pages/login/login',
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({ title: '转发成功', icon: 'success' })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({ title: '转发已取消' })
        } else {
          wx.showToast({ title: '转发失败' })
        }
      }
    }
  }
})