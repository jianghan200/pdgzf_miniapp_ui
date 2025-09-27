// pages/home/home.js
const app = getApp()
const requests = require('../../utils/request')
const dataHelper = require('../../utils/data')
const log = require('./../../utils/log')
const constants = require('./../../utils/constants')

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
    let self = this
    requests
      .login(jscode)
      .then((userinfo) => {
        log.info('登陆成功')
        log.info(userinfo)

        if(!this.has_weixin_nickNameAndAvatar(userinfo)){
          console.log("生成随机昵称头像");
          this.getRandomNameAndAvatar(userinfo)
        }
        app.globalData.userinfo = userinfo
        // 几乎全部的初始请求
        dataHelper.loadAllData(self.options)
      })
      .catch((err) => {
        log.error(err)
        console.log(err)
        wx.showToast({ title: '服务器错误', icon: 'error' })
      })
  },

  getRandomNameAndAvatar: function(userinfo) {
    
    const names = constants.randomNikName || []
    const pickedName = names.length > 0 ? names[Math.floor(Math.random() * names.length)] : constants.randomUserName()
    const defaultAvatar = 'https://cdn.vencloud.cn/yzzz/default/cat.jpeg-detail_img'
    userinfo.wxNickName = pickedName;
    userinfo.wxAvatarUrl = defaultAvatar;
    // this.globalData.userinfo = userinfo || {}
    // this.globalData.userinfo.wxNickName = pickedName
    // this.globalData.userinfo.wxAvatarUrl = defaultAvatar
  },

  has_weixin_nickNameAndAvatar: function(userinfo) {
    const hasNick = userinfo.wxNickName && userinfo.wxNickName !== null && ('' + userinfo.wxNickName).trim() !== '' && ('' + userinfo.wxNickName).trim() !== 'undefined'
    const hasAvatar = userinfo.wxAvatarUrl && userinfo.wxAvatarUrl !== null && ('' + userinfo.wxAvatarUrl).trim() !== '' && ('' + userinfo.wxAvatarUrl).trim() !== 'undefined'
    return hasNick && hasAvatar
  }
})