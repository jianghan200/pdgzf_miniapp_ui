// pages/subscribe/subscribe.js
const app = getApp()
const constants = require('../../utils/constants')
const dataHelper = require('../../utils/data')
const requests = require('../../utils/request')
const subHelper = require('../../utils/subscripton')
Page({
  data: {
    list: [],
    showModal: false,
    selectedRule: null,
    // 跟请求是否成功相关的flag
    reqSuccessful : false
  },

  onLoad: function (options) {
    // 最新的订阅数据
    this.loadRules()
  },

  // 捕捉最新的订阅数据
  loadRules() {
    let self = this
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects && allProjects.length > 0) {
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

  // 重试请求
  refresh() {
    let self = this
    dataHelper
      .loadAllProjectsData()
      .then((res) => {
        wx.showToast({
          title: '数据读取成功！',
          icon: 'success'
        })
        // 跟onload一样
        let allProjects = wx.getStorageSync('allProjects')
        if (allProjects && allProjects.length > 0) {
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
        }
      })
      .catch((err) => {
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
    let ruleId = e.currentTarget.dataset.rid
    let selectedRule = this.data.list.find(rule => rule.subInfo.id == ruleId)
    // 将所有相关信息储存，供订阅详情页使用
    wx.setStorageSync('editingRule', selectedRule)
    // 导航到订阅详情页
    wx.navigateTo({
      url: '/pages/subdetail/subdetail',
    })
  },

  // 解除订阅
  removeSubscription() {
    let ruleId = this.data.selectedRule.subInfo.id
    let areaId = this.data.selectedRule.aid
    let projectId = this.data.selectedRule.pid

    let self = this
    subHelper
      .unsubscribeThenSyncUp(ruleId, areaId, projectId)
      .then((res) => {
        self.loadRules()
        self.hideModal()
      })
      .catch((err) => {
        console.log(err)
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