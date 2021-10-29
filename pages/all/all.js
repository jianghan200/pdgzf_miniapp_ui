// pages/all/all.js
const util = require('../../utils/util')
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const dataHelper = require('../../utils/data')
const subHelper = require('../../utils/subscripton')
let app = getApp()
const log = require('./../../utils/log')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    // tabBar显示相关的变量
    MainCur: 0,
    TabCur: 0,
    VerticalNavTop: 0,
    load: true,
    list : [{
      id: -1,
      areaName: '',
      projects: [{ pId: 0, pName: '', updateTime: '', rentableCount: '', isSubscribed: false }]
    }],
    // 跟请求是否成功相关的flag
    reqSuccessful : false
  },

  onLoad: function (options) {
    log.info('onLoad all')

    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects && allProjects.length > 0) {
      log.info('allProjects 获取成功')
      // 说明请求成功了
      this.setData({
        list : allProjects,
        reqSuccessful : true
      })
    } else {
      log.error('allProjects 获取失败')
      // 请求失败了，需要特殊处理，立一个flag
      console.log('all 失败')
      this.setData({
        reqSuccessful : false
      })
    }
  },

  // 在地图上查看所有房源
  openMap(e) {
    wx.navigateTo({
      url: '/pages/map/map?mode=all',
    })
  },

  // 重新请求全部房源的数据。
  refresh() {
    log.info('重新请求全部房源的数据')

    let self = this
    dataHelper
      .loadAllProjectsData()
      .then((res) => {
        log.info('loadAllProjectsData 成功')

        wx.showToast({
          title: '数据读取成功！',
          icon: 'success'
        })
        // 跟onload一样
        let allProjects = wx.getStorageSync('allProjects')
        if (allProjects && allProjects.length > 0) {
          self.setData({
            list : allProjects,
            reqSuccessful : true
          })
        }
      })
      .catch((err) => {
        log.error('loadAllProjectsData 失败')
        log.error(err)
        console.log(err) 
        wx.showToast({
          title: '数据获取失败',
          icon: 'error'
        })
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
      url: `/pages/map/map?mode=single&id=${id}&pid=${pid}&aid=${aid}&pname=${theProject.pName}`,
    })
  },

  // 判断这个用户是否需要授权我们获得ta的昵称
  // 这个用户是一般用户，我们后端没有这个用户的name信息
  needToGetUserProfile() {
    return app.globalData.userinfo.type == 0 && app.globalData.userinfo.name == null
  },

  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    log.info('用户点击订阅')
    // 从event中获取定位数据
    let pid = e.currentTarget.dataset.pid
    let pname = e.currentTarget.dataset.pname
    let aid = e.currentTarget.dataset.aid
    // 如果这个用户是初次使用【订阅】功能的普通用户，需要授权我们使用他的昵称
    let self = this
    if (self.needToGetUserProfile()) {
      log.info('未找到用户的昵称，需要ask用户提供昵称权限')

      wx.getUserProfile({
        desc: '需要您的昵称，才能使用订阅功能',
        success: (res) => {
          log.info('用户同意提供昵称')
          // 从微信的接口中获得用户的昵称作为标识，主要是为了后端管理方便
          let newUsername = res.userInfo.nickName
          requests
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
          log.error('用户拒绝提供昵称')
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
    log.info(`用户subscribe: pid: ${pid}, pname: ${pname}, aid: ${aid}`)

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

  // 在navBar上选中某一个item
  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id,
      MainCur: e.currentTarget.dataset.id,
      VerticalNavTop: (e.currentTarget.dataset.id - 1) * 50
    })
  },

  // 当在主页面滑动时，tabBar需要跟着一起滑动。
  VerticalMain(e) {
    let that = this;
    let list = this.data.list;
    let tabHeight = 0;
    if (this.data.load) {
      for (let i = 0; i < list.length; i++) {
        let view = wx.createSelectorQuery().select("#main-" + list[i].id);
        view.fields({
          size: true
        }, data => {
          list[i].top = tabHeight;
          tabHeight = tabHeight + data.height;
          list[i].bottom = tabHeight;     
        }).exec();
      }
      that.setData({
        load: false,
        list: list
      })
    }
    let scrollTop = e.detail.scrollTop + 20;
    for (let i = 0; i < list.length; i++) {
      if (scrollTop > list[i].top && scrollTop < list[i].bottom) {
        that.setData({
          VerticalNavTop: (list[i].id - 1) * 50,
          TabCur: list[i].id
        })
        return false
      }
    }
  },

  navToHouses(e) {
    let pId = e.currentTarget.dataset.pid
    let url = '../project/project?pid=' + pId
    wx.navigateTo({
      url: url,
    })
  },

  // 转发
  onShareAppMessage: function(options) {
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
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'all') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  }
})