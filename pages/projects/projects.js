// pages/map/map.js
const util = require('../../utils/util')
const constants = require('../../utils/constants')
let app = getApp()

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    list: [
      {
        areaName: '',
        projects: [
          {
            pId: 0,
            pName: '',
            updateTime: '',
            rentableCount: ''
          }
        ]
      }
    ]
  },

  onLoad: function (options) {
    this.loadProjects(false)
    this.loadHouses(false)
  },

  onPullDownRefresh: function() {
    console.log('pull down')
  },

  // tabBar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'projects') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  },

  // 从后端拽取最新的小区信息（project）
  loadProjects(realtime) {
    let self = this
    let path = ''
    
    if (realtime) {
      path = '/gzf/project'
    } else {
      path = '/project'
    }

    let url = constants.server + path
    let header = {
      'content-type': 'application/json'
    }
  
    wx.request({
      url: url,
      header: header,
      success: function(res) {
        if (res.statusCode != 200) {
          console.log('project请求出现异常')
          console.log(res)

          wx.redirectTo({
            url: '/pages/error/error',
          })
        } else {
          console.log(`成功从后台fetch到小区的信息，共${res.data.length}条`)
  
          let rawData = res.data
          const groups = util.groupBy(rawData, function(item) {
            return item.township
          })
  
          if (rawData) {
            // 缓存request的结果
            wx.setStorageSync('projects', rawData)
          }
  
          let list = groups.map(group => {
            let sampleElem = group[0]
            let areaName = sampleElem.townshipName
            
            let projects = group.map(elem => {
              let project = {
                pId: elem.id,
                pName: elem.name,
                updateTime: elem.updateTime,
                rentableCount: elem.rentableCount
              }
              return project
            })
      
            return {
              areaName: areaName,
              projects: projects
            }
          })
  
          self.setData({
            list: list
          })
        }
      },
      fail: function(res) {
        console.log(res)
        console.log('project请求失败！')

        wx.redirectTo({
          url: '/pages/error/error',
        })
      },
      timeout: 5000 // ms
    })
  },

  // 从后端拽去最新的房屋信息（house）
  loadHouses(realtime) {
    let path = ''
    
    if (realtime) {
      path = '/gzf/house'
    } else {
      path = '/house'
    }

    const url = constants.server + path
    const header = {
      'content-type': 'application/json'
    }

    wx.request({
      url: url,
      header: header,
      success: function(res) {
        if (res.statusCode != 200) {
          console.log('house请求出现异常')
          console.log(res)

          wx.redirectTo({
            url: '/pages/error/error',
          })
        } else {
          console.log(`成功从后台fetch到小区的信息，共${res.data.length}条`)        
  
          let rawData = res.data
          const groups = util.groupBy(rawData, function(item) {
            return item.projectId
          })
          const list = groups.map(group => {
            const sample = group[0]
            let projectAndHouses = {
              pId: sample.projectId,
              pName: sample.propertyName,
              houses: group
            }
            return projectAndHouses
          })
  
          console.log(list)
  
          if (list) {
            wx.setStorageSync('houses', list)
          }
        }
      },
      fail: function(res) {
        console.log(res)
        console.log('house请求失败！')
        
        wx.redirectTo({
          url: '/pages/error/error',
        })
      },
      timeout: 5000 // ms
    })
  },

  // 用户点击【在地图上查看】
  openMap(e) {
    wx.navigateTo({
      url: '/pages/map/map',
    })
  },

  // 用户点击【房屋详情】
  navToHouses(e) {
    console.log(e)

    let pId = e.target.dataset.pid
    let url = '../houses/houses?pid=' + pId
    wx.navigateTo({
      url: url,
    })
  }
})