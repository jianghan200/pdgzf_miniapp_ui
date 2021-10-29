// pages/home/home.js
const app = getApp()
const requests = require('../../utils/request')
const dataHelper = require('../../utils/data')
const log = require('./../../utils/log')
Page({
  data: {
  },
  
  onLoad(options) {
    log.info('进入login页，调用wx.login接口')

    let self = this
    // 调用微信登陆接口获得用户信息
    wx.login({
      success: function(res) {
        log.info(res)
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
        log.info('登陆成功')
        log.info(userinfo)

        app.globalData.userinfo = userinfo
        dataHelper.loadAllData()
      })
      .catch((err) => {
        log.error('用户login接口调用失败')
        log.error(err)
        console.log(err)
      })
  }
})