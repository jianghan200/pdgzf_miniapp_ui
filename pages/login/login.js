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
        console.log("wx.login", res)
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
        log.info("userinfo", userinfo)
        console.log("userinfo", userinfo)

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
    // 基于 unionId 生成确定性的昵称
    const names = constants.randomNikName || []
    let pickedName = ''
    if (userinfo.unionId && names.length > 0) {
      // 简单 hash 算法，将 unionId 映射到 names 的索引
      let hash = 0
      for (let i = 0; i < userinfo.unionId.length; i++) {
        hash = ((hash << 5) - hash) + userinfo.unionId.charCodeAt(i)
        hash |= 0 // 转为32位整数
      }
      const idx = Math.abs(hash) % names.length
      console.log(userinfo.unionId, idx)
      pickedName = names[idx]
    } else {
      // 没有 unionId 或 names 为空，退回随机
      pickedName = names.length > 0 ? names[Math.floor(Math.random() * names.length)] : constants.randomUserName()
    }
    const defaultAvatar = 'https://cdn.vencloud.cn/yzzz/default/cat.jpeg-detail_img'
    userinfo.wxNickName = pickedName
    userinfo.wxAvatarUrl = defaultAvatar
  },

  has_weixin_nickNameAndAvatar: function(userinfo) {
    const hasNick = userinfo.wxNickName && userinfo.wxNickName !== null && ('' + userinfo.wxNickName).trim() !== '' && ('' + userinfo.wxNickName).trim() !== 'undefined'
    const hasAvatar = userinfo.wxAvatarUrl && userinfo.wxAvatarUrl !== null && ('' + userinfo.wxAvatarUrl).trim() !== '' && ('' + userinfo.wxAvatarUrl).trim() !== 'undefined'
    return hasNick && hasAvatar
  }
})