// pages/newbee/newbee.js
const app = getApp()
const log = require('./../../utils/log')
const userInfoHelper = require('../../utils/user')

Page({
  data: {
    vipInfo: null,
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad: function (options) {
    log.info('进入newbee的onLoad')

    this.setData({ vipInfo : app.globalData.userinfo })

    if (options['tab'] && options['tab'] != '') {
      let tab = options['tab']
      let articleUrl = ''
      if (options['articleUrl'] && options['articleUrl'] != '') {
        articleUrl = '?articleUrl=' + options['articleUrl']
      }
      // 来自分享
      wx.navigateTo({
        url: `/pages/${tab}/${tab}` + articleUrl,
      })
    }

    // open-id被禁用，只能向用户请求权限
    const self = this
    // userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
    //   if (res !== null) {
    //     self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
    //   }
    // })
    if (userInfoHelper.has_weixin_nickNameAndAvatar()) {
      self.setData({ 
        nickname: app.globalData.userinfo.wxNickName, 
        avatarUrl: app.globalData.userinfo.wxAvatarUrl 
      })
    } else {
      // 使用默认值
      self.setData({ 
        nickname: '游客', 
        avatarUrl: 'https://cdn.vencloud.cn/yzzz/default/cat.jpeg-detail_img' 
      })
    }
  },

  // 导航至某个页面
  goTo(e) {
    const page = e.currentTarget.dataset.page
    const url = `/pages/${page}/${page}`
    wx.navigateTo({ url: url })
  },

  // Top Bar的重定向方法
  topBarRedirect(e) {
    const newTab = e.detail
    if (newTab != 'newbee') {
      wx.redirectTo({ url: `/pages/${newTab}/${newTab}` })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/newbee/newbee'
    return {
      title : 'PD公租房',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({
            title: '转发成功',
            icon: 'success'
          })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({
            title: '转发已取消',
          })
        } else {
          wx.showToast({
            title: '转发失败',
          })
        }
      }
    }
  }
})