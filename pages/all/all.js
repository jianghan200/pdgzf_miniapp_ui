// pages/all/all.js
const util = require('../../utils/util')
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
let app = getApp()

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
  },

  onLoad: function (options) {
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects) {
      this.setData({
        list : allProjects
      })
    }
  },

  // 在地图上查看所有房源
  openMap(e) {
    wx.navigateTo({
      url: '/pages/map/map?mode=all',
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

  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    let pid = e.currentTarget.dataset.pid
    let pname = e.currentTarget.dataset.pname
    let aid = e.currentTarget.dataset.aid
    let afterChangeValue = e.detail.value

    let self = this
    // 找所属到街道
    let area = self.data.list.find(elem => elem.id == aid)
    let indexOfThisArea = self.data.list.indexOf(area)

    // 找到小区
    let projectsOfThisArea = area.projects
    let projectOnChange = projectsOfThisArea.find(p => p.pId == pid)
    let indexOfProjectOnChange = projectsOfThisArea.indexOf(projectOnChange)
    
    if (afterChangeValue) {
      // 开启订阅
      requests
        .subscribeProject(pid, pname)
        .then((res) => {
          // 替换
          projectOnChange.isSubscribed = true
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          let updatedArea = {
            id: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea
          }

          // 更新缓存
          let oldAllProjects = self.data.list
          oldAllProjects[indexOfThisArea] = updatedArea
          wx.setStorageSync('allProjects', oldAllProjects)

          self.setData({
            ['list[' + indexOfThisArea + ']'] : updatedArea
          })
        }).catch((err) => {
          // 请求失败，不能update data
        })
    } else {
      // 关闭订阅
      requests
        .unsubscribe(projectOnChange.ruleId)
        .then((res) => {
          // 替换
          projectOnChange.isSubscribed = false
          projectOnChange.ruleId = ''
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          let updatedArea = {
            id: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea
          }

          // 更新缓存
          let oldAllProjects = self.data.list
          oldAllProjects[indexOfThisArea] = updatedArea
          wx.setStorageSync('allProjects', oldAllProjects)
          
          self.setData({
            ['list[' + indexOfThisArea + ']'] : updatedArea
          })
        })
        .catch((err) => {
          // 请求失败，不能update data
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