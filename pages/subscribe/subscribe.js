// pages/subscribe/subscribe.js
const app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
Page({
  data: {
    list: [],
    showModal: false,
    selectedRule: null
  },

  onLoad: function (options) {
    // 最新的订阅数据
    this.loadRules()
  },

  // 捕捉最新的订阅数据
  loadRules() {
    let self = this
    let allProjects = wx.getStorageSync('allProjects')
    // flatMap
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
          list : list
        })
      })
      .catch((err) => {
        // 请求失败
        console.log(err)
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
    let self = this
    requests
      .unsubscribe(ruleId)
      .then((res) => {
        // 手动更新缓存中
        let oldAllProjects = wx.getStorageSync('allProjects')
        let toBeUpdatedProjectId = self.data.selectedRule.pid
        // 锁定要更新的社区
        let areaToBeUpdated = oldAllProjects.find(area => area.areaId == self.data.selectedRule.aid)
        let indexOfAreaToBeUpdated = oldAllProjects.indexOf(areaToBeUpdated)
        // 锁定要更新的小区
        let projectToBeUpdated = areaToBeUpdated.projects.find(p => p.pId == toBeUpdatedProjectId)
        let indexOfProjectToBeUpdated = areaToBeUpdated.projects.indexOf(projectToBeUpdated)
        // 开始更新缓存
        projectToBeUpdated.isSubscribed = false
        areaToBeUpdated.projects[indexOfProjectToBeUpdated] = projectToBeUpdated
        oldAllProjects[indexOfAreaToBeUpdated] = areaToBeUpdated

        wx.setStorageSync('allProjects', oldAllProjects)

        self.loadRules()
        self.hideModal()
      })
      .catch((err) => {
        // 请求失败，不能update data
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
  }
})