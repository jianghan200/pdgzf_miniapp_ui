// pages/home/home.js
const app = getApp()
const requests = require('../../utils/request')
const dataHelper = require('../../utils/data')
Page({
  data: {
  },
  
  onLoad(options) {
    let self = this
    // 调用微信登陆接口获得用户信息
    wx.login({
      success: function(res) {
        console.log(res)
        self.login(res.code)
      }
    })
  },

  // 用jscode登陆
  login(jscode) {
    requests
      .login(jscode)
      .then((userinfo) => {
        app.globalData.userinfo = userinfo
        dataHelper.loadAllData()
      })
      .catch((err) => {
        console.log(err)
      })
  }
})