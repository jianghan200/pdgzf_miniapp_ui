// pages/home/home.js
const app = getApp()
Page({
  data: {
  },
  
  onLoad(options) {
    wx.login({
      success: function(res) {
        console.log(res)

        app.globalData.jscode = res.code

        wx.redirectTo({
          url: '/pages/projects/projects',
        })
      }
    })
  }
})