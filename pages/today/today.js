// pages/today/today.js
const dataHelper = require('../../utils/data')
const util = require('../../utils/util')
let app = getApp()
const subHelper = require('../../utils/subscripton')
const requestsUtil = require('../../utils/request')
const constants = require('../../utils/constants')
const today = util.formatDate(new Date())
const log = require('./../../utils/log')

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
    // 是否打开manualStartDate的Dialog
    openManualStartDateDialog : false,
    manualStartDate : '',
    today: today
  },

  onLoad: function (options) {
    log.info('onLoad today')
    // 将manualStartDate填好
    if (app.globalData.userinfo.type != 2) {
      log.info('非vip用户')
      // 普通用户没有startDate
      let manualStartDate = app.globalData.userinfo.manualStartDate 
      if (!manualStartDate || manualStartDate == null) {
        // 总之manualStartDate各种不存在
        manualStartDate = ''
      }
      this.setData({
        manualStartDate : manualStartDate
      })
    }

    // 根据当前的时间设置“今日页”的状态
    const date = new Date()
    // 9:30 am ~ 10:03 am期间禁选
    if ((date.getHours() == 9 && date.getMinutes() >= 30) || (date.getHours() == 10 && date.getMinutes() <= 3)) {
      log.info('选房期，不显示今日房源')

      this.setData({
        disable : true,
        isVip : app.globalData.userinfo.type == 2,
        // 用户是否输入了自己的startDated
        hasStartDate : (app.globalData.userinfo.startDate == null || !app.globalData.userinfo.startDate) ? false : true
      })
    } else {
      log.info('正常情况')
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
    log.info('刷新房源')

    dataHelper.loadTodayData().then((res) => {
      log.info('loadTodayData 成功')
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

      this.setData({
        list : todayProjects,
        milestone : milestone,
        timeStamp : util.formatTime(new Date()),
        projectCount : allProjects.length,
        houseCount : allHouses.length,
        isVip : app.globalData.userinfo.type == 2,
        // 用户是否输入了自己的startDated
        hasStartDate : (app.globalData.userinfo.startDate == null || !app.globalData.userinfo.startDate) ? false : true
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

  // 普通用户点击VIP范例
  vipSample(e) {
    log.info('普通用户点击vip范例')

    let url = '../project/project?pid=' + constants.vipPid + '&mock=true'
    wx.navigateTo({
      url: url,
    })
  },

  // 普通用户输入自己的资格日
  manualStartDate(e) {
    log.info('普通用户输入自己的资格日')

    let self = this
    if (self.needToGetUserProfile()) {
      // 需要先获取用户的昵称
      wx.getUserProfile({
        desc: '需要您的昵称，绑定您输入的资格日期',
        success: (res) => {
          log.info('用户同意提供昵称')
          // 从微信的接口中获得用户的昵称作为标识，主要是为了后端管理方便
          let newUsername = res.userInfo.nickName
          // 向后端递交昵称
          requestsUtil.updateUsername(newUsername).then((res) => {
            log.info('updateUsername 成功')
            // 本地更新一下用户名
            app.globalData.userinfo.name = newUsername
            self.openMaunalStartDateDialog()
          }).catch((err) => {
            // 更新用户昵称失败
            log.error('updateUsername 失败')
            log.error(err)
            console.log(err)
  
            wx.showToast({
              title: '更新用户昵称失败',
              icon: 'error'
            })
          })
        },
        fail: (err) => {
          log.error('用户未提供昵称')
          log.error(err)
          console.log(err)
          
          wx.showToast({
            title: '没有昵称，无法自定义资格日',
            icon: 'error'
          })
        }
      })
    } else {
      // 已经获取了用户的昵称，直接打开dialog。
      self.openMaunalStartDateDialog()
    }
  },

  // 向后端更新自定义的资格日
  addManualStartDate(e) {
    let self = this
    let selectedDate = e.detail.value
    requestsUtil.updateManualStartDate(selectedDate).then((res) => {
      log.info('updateManualStartDate 成功')

      wx.showToast({
        title: '成功更新',
        icon: 'success'
      })
      // 更新本地的数据
      app.globalData.userinfo.manualStartDate = selectedDate
      self.setData({
        manualStartDate : selectedDate
      })
      self.closeManualStartDateDialog()
      self.refresh()
    }).catch((err) => {
      log.error('updateManualStartDate 失败')
      log.error(err)

      wx.showToast({
        title: '未能成功更新',
        icon: 'error'
      })
      self.closeManualStartDateDialog()
    })
  },
  
  // 打开自定义资格日的Dialog
  openMaunalStartDateDialog() {
    this.setData({
      openManualStartDateDialog : true
    })
  },

  // 关闭自定义资格日的Dialog
  closeManualStartDateDialog() {
    this.setData({
      openManualStartDateDialog : false
    })
  },

  // 判断这个用户是否需要授权我们获得ta的昵称
  // 这个用户是普通用户，我们后端没有这个用户的真实姓名，所以需要询问‘昵称’来表识
  needToGetUserProfile() {
    return app.globalData.userinfo.type == 0 && app.globalData.userinfo.name == null
  },
  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    // 从event中获取定位数据
    let pid = e.currentTarget.dataset.pid
    let pname = e.currentTarget.dataset.pname
    let aid = e.currentTarget.dataset.areaid
    // 如果这个用户是初次使用【订阅】功能的普通用户，需要授权我们使用他的昵称
    let self = this
    if (self.needToGetUserProfile()) {
      log.info('尚未找到这个用户的昵称')

      wx.getUserProfile({
        desc: '需要您的昵称，才能使用订阅功能',
        success: (res) => {
          log.info('用户同意提供昵称')
          // 从微信的接口中获得用户的昵称作为标识，主要是为了后端管理方便
          let newUsername = res.userInfo.nickName
          requestsUtil
            .updateUsername(newUsername)
            .then((r) => {
              log.info('updateUsername 成功')
              // 本地更新一下用户名
              app.globalData.userinfo.name = newUsername
              self.doSubscribe(pid, pname, aid)
            }).catch((err) => {
              log.error('updateUsername 失败')
              log.error(err)
              console.log(err)

              wx.showToast({
                title: '未能成功录入昵称',
                icon: 'error'
              })
            })
        },
        fail: (err) => {
          log.error('用户不同意提供昵称')
          log.error(err)
          console.log(err)
          
          wx.showToast({
            title: '没有昵称，无法收藏',
            icon: 'error'
          })
        }
      })
    } else {
      // 无需授权昵称，执行订阅的业务逻辑
      self.doSubscribe(pid, pname, aid)
    }
  },

  // 专注于订阅的业务逻辑代码
  doSubscribe(pid, pname, aid) {
    log.info(`用户点击subscribe: pid: ${pid}, pname: ${pname}, aid: ${aid}`)

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
          log.error('subscribeThenSyncUp 失败')
          log.error(err)
          console.log(err)
        })
    } else {
      log.info('关闭订阅')
      // 关闭订阅
      subHelper
        .unsubscribeThenSyncUp(projectOnChange.ruleId, aid, pid)
        .then((res) => {
          log.info('unsubscribeThenSyncUp 成功')
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