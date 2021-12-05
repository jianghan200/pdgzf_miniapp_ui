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
    // 用户必须提供自己的昵称和头像才能进入小程序。
    // 先看是否云端已经存储过用户的昵称和头像。
    requests
      .login(jscode)
      .then((userinfo) => {
        app.globalData.userinfo = userinfo

        log.info('登陆成功')
        log.info(userinfo)

        dataHelper.loadAllData()
      })
      .catch((err) => {
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '微信有bug',
          icon: 'error'
        })
      })

    // Promise
    //   .all([requests.login(jscode), requests.getAvatarAndNickname()])
    //   .then((res) => {
    //     let userinfo = res[0]
    //     app.globalData.userinfo = userinfo

    //     log.info('登陆成功')
    //     log.info(userinfo)

    //     if (res[1]) {
    //       // 向后端上传昵称（仅仅为了同步）
    //       requests.updateUsername(app.globalData.nickname)
    //       log.info('云函数调用成功（both get and post），新用户同意提供头像和昵称')
    //       // 云函数调用成功（both get and post），新用户同意提供头像和昵称
    //       dataHelper.loadAllData()
    //     } else {
    //       log.warn('云函数调用失败（both get and post）或新用户不同意提供头像和昵称')

    //       wx.showToast({
    //         title: '很遗憾',
    //         icon: 'error'
    //       })
    //     }
    //   })
    //   .catch((err) => {
    //     log.error(err)
    //     console.log(err)

    //     wx.showToast({
    //       title: '微信有bug',
    //       icon: 'error'
    //     })
    //   })
  }
})