// pages/subscribe/subscribe.js
const app = getApp()
const constants = require('../../utils/constants')
const dataHelper = require('../../utils/data')
const requests = require('../../utils/request')
const subHelper = require('../../utils/subscripton')
const log = require('./../../utils/log')
Page({
  data: {
    list: [],
    showModal: false,
    selectedRule: null,
    // 跟请求是否成功相关的flag
    reqSuccessful : false,
    isVip: false,
    // 是否开启自动选房（全局）
    openAutoSelection : false
  },

  onLoad: function (options) {
    log.info('onLoad subscribe')
    // 只有vip涉及到是否开启“自动选房”的问题
    if (app.globalData.userinfo.type == 2) {
      log.info('用户为vip，涉及到自动选房')

      this.setData({
        isVip : true,
        openAutoSelection : app.globalData.userinfo.autoChoose == 0 ? false : true
      })
    }
    // 最新的订阅数据
    this.loadRules()
  },

  // 捕捉最新的订阅数据
  loadRules() {
    log.info('读取最新的订阅数据')

    let self = this
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects && allProjects.length > 0) {
      log.info('成功获得 allProjects')
      // flatMap将社区这一层“摊平”
      let projects = []
      allProjects.forEach(area => {
        let enrichedProjects = area.projects.map(p => {
          return {
            id : area.id,
            aid : area.areaId,
            project : p
          }
        })
        projects = projects.concat(enrichedProjects)
      })

      // 请求订阅信息
      requests
        .getSubscriptions()
        .then((res) => {
          log.info('getSubscriptions 成功')

          let list = 
            res.map(s => {
              let pid = s.projectId
              let projectInfo = projects.find(p => p.project.pId == pid)
              return {
                id : projectInfo.id,
                aid : projectInfo.aid,
                pid : pid,
                info : projectInfo.project,
                subInfo : s
              }
            })
          // 成功
          self.setData({
            list : list,
            reqSuccessful : true
          })
        })
        .catch((err) => {
          log.error('getSubscriptions 失败')
          log.error(err)
          // 请求失败
          console.log(err)

          wx.showToast({
            title: '订阅数据获取失败',
            icon: 'error'
          })

          self.setData({
            reqSuccessful : false
          })
        })
    } else {
      log.error('未能获得 allProjects')
      // 说明allProjects请求失败
      wx.showToast({
        title: '数据获取失败',
        icon: 'error'
      })

      self.setData({
        reqSuccessful : false
      })
    }
  },

  // 控制是否开启自动选房
  changeAutoSelectionStatus(e) {
    log.info('改变自动选房的开关')
    log.info(e)

    let self = this
    let afterChangeStatus = e.detail.value ? 1 : 0
    requests.updateAutoSelectionStatus(afterChangeStatus).then((res) => {
      self.setData({
        openAutoSelection : e.detail.value
      })
      // 更新本地的缓存
      app.globalData.userinfo.autoChoose = afterChangeStatus
    }).catch((err) => {
      console.log(err)
    })
  },

  // 重试请求
  refresh() {
    log.info('重新请求数据')

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
          log.info('成功获得 allProjects')
          // flatMap将社区这一层“摊平”
          let projects = []
          allProjects.forEach(area => {
            let enrichedProjects = area.projects.map(p => {
              return {
                id : area.id,
                aid : area.areaId,
                project : p
              }
            })
            projects = projects.concat(enrichedProjects)
          })

          // 请求订阅信息
          requests
            .getSubscriptions()
            .then((res) => {
              log.info('getSubscriptions 成功')

              let list = 
                res.map(s => {
                  let pid = s.projectId
                  let projectInfo = projects.find(p => p.project.pId == pid)
                  return {
                    id : projectInfo.id,
                    aid : projectInfo.aid,
                    pid : pid,
                    info : projectInfo.project,
                    subInfo : s
                  }
                })
              // 成功
              self.setData({
                list : list,
                reqSuccessful : true
              })
            }).catch((err) => {
              log.error('getSubscriptions 失败')
              log.error(err)
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
        self.setData({
          reqSuccessful : false
        })
      })
  },

  // 修改订阅
  editSubscription(e) {
    log.info('修改订阅')
    log.info(e)

    let ruleId = e.currentTarget.dataset.rid
    let selectedRule = this.data.list.find(rule => rule.subInfo.id == ruleId)
    // 将所有相关信息储存，供订阅详情页使用
    wx.setStorageSync('editingRule', selectedRule)
    // 导航到订阅详情页
    wx.navigateTo({
      url: '/pages/subdetail/subdetail',
    })
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    let id = e.currentTarget.dataset.id
    let aid = e.currentTarget.dataset.aid
    let pid = e.currentTarget.dataset.pid
    let chosenSubscription = this.data.list.find(sub => sub.pid == pid)
    let pname = chosenSubscription.info.pName
    wx.navigateTo({
      url: `/pages/map/map?mode=single&id=${id}&pid=${pid}&aid=${aid}&pname=${pname}`,
    })
  },

  // Dialog相关
  openWarningDialog(e) {
    let ruleId = e.currentTarget.dataset.rid
    let selectedRule = this.data.list.find(rule => rule.subInfo.id == ruleId)
    this.setData({
      selectedRule : selectedRule,
      showModal : true
    })
  },

  hideModal() {
    this.setData({
      showModal : false,
      selectedRule : null
    })
  },

  // Bottom Bar的方法
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'subscribe') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
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
  }
})