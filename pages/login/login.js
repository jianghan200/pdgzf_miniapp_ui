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
        if(userinfo.wxNickName == "微信用户"){

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
    // 基于 unionId 生成确定性的昵称，并生成一个 0~99 的确定性数字
    const names = constants.randomNikName || []
    let pickedName = ''
    let suffixNum = 0
    if (userinfo.unionId && names.length > 0) {
      // 简单 hash 算法，将 unionId 映射到 names 的索引
      let hash = 0
      for (let i = 0; i < userinfo.unionId.length; i++) {
        hash = ((hash << 5) - hash) + userinfo.unionId.charCodeAt(i)
        hash |= 0 // 转为32位整数
      }
      const idx = Math.abs(hash) % names.length

      // 生成第二个 hash，用于 0~99 的数字
      let hash2 = 5381
      for (let i = 0; i < userinfo.unionId.length; i++) {
        hash2 = ((hash2 << 5) + hash2) + userinfo.unionId.charCodeAt(i)
        hash2 |= 0
      }
      suffixNum = Math.abs(hash2) % 100

      console.log(userinfo.unionId, idx, suffixNum)
      pickedName = names[idx] + suffixNum
    } else {
      // 没有 unionId 或 names 为空，退回随机
      pickedName = names.length > 0 ? names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100) : constants.randomUserName()
    }
    userinfo.wxNickName = pickedName

    if(userinfo.wxAvatarUrl === null || userinfo.wxAvatarUrl.trim() === '' || userinfo.wxAvatarUrl.trim() === 'undefined'){
      const defaultAvatar = 'https://cdn.vencloud.cn/yzzz/default/cat.jpeg-detail_img'
      userinfo.wxAvatarUrl = defaultAvatar
    }
    
  },

  has_weixin_nickNameAndAvatar: function(userinfo) {
    const hasNick = userinfo.wxNickName && userinfo.wxNickName !== null && ('' + userinfo.wxNickName).trim() !== '' && ('' + userinfo.wxNickName).trim() !== 'undefined' && ('' + userinfo.wxNickName).trim() !== '微信用户'
    const hasAvatar = userinfo.wxAvatarUrl && userinfo.wxAvatarUrl !== null && ('' + userinfo.wxAvatarUrl).trim() !== '' && ('' + userinfo.wxAvatarUrl).trim() !== 'undefined'
    return hasNick && hasAvatar
  }
})