// pages/today/today.js
const dataHelper = require('../../utils/data')
const util = require('../../utils/util')
let app = getApp()

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    // tabBar显示相关的变量
    MainCur: 0,
    TabCur: 0,
    VerticalNavTop: 0,
    load: true,
    // 要展示的数据
    list: [],
    // timestamp
    timestamp: ''
  },

  onLoad: function (options) {
    this.useTodayProjectsInStorage()
  },

  // 刷新今日的数据
  refresh() {
    dataHelper.loadTodayData().then((res) => {
      this.useTodayProjectsInStorage()
    }).catch((err) => {
      console.log(err)
    })
  },

  useTodayProjectsInStorage() {
    let todayProjects = wx.getStorageSync('todayProjects')
    if (todayProjects) {
      this.setData({
        list : todayProjects,
        timestamp : util.formatTime(new Date())
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
    let pId = e.target.dataset.pid
    let url = '../houses/houses?pid=' + pId
    wx.navigateTo({
      url: url,
    })
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
    if (newTab != 'today') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  },
})