// pages/home/home.js
const app = getApp()
const requests = require('../../utils/request')
const dataHelper = require('../../utils/data')
const log = require('./../../utils/log')

Page({
  data: {
    loaderSize: 120
  },
  
  onLoad(options) {
    log.info('进入login页，调用wx.login接口')

    // 从 redirect 参数中提取 inviter_uid（分享链接的邀请人参数编码在 redirect 内）
    if (options.redirect) {
      try {
        const decoded = decodeURIComponent(options.redirect)
        const match = decoded.match(/inviter_uid=(\d+)/)
        if (match) {
          const inviterUid = parseInt(match[1])
          if (inviterUid > 0) {
            app.globalData.inviterUid = inviterUid
            log.info('从 redirect 中提取 inviter_uid: ' + inviterUid)
          }
        }
      } catch (e) {
        log.error('解析 redirect 中的 inviter_uid 失败', e)
      }
    }

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
    let self = this
    requests
      .login(jscode)
      .then((userinfo) => {
        app.globalData.userinfo = userinfo
        log.info('登陆成功')
        log.info(userinfo)

        // 登录成功后，如果有待处理的邀请人，上报分享打开
        if (app.globalData.inviterUid > 0) {
          var credit = require('../../utils/credit')
          credit.reportShareOpen(app.globalData.inviterUid)
        }

        // 几乎全部的初始请求
        dataHelper.loadAllData(self.options)
      })
      .catch((err) => {
        log.error(err)
        console.log(err)
        wx.showToast({ title: '服务器错误', icon: 'error' })
      })
  }
})