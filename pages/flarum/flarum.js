const app = getApp()
const requestHelper = require('../../utils/request')
Page({

  data: {
    unreadCount: 0,
    url: ''
  },

  onLoad: function (options) {
    requestHelper.getAvatarAndNickname().then(() => {
      const url = 'https://pdbbs.vencloud.cn/api/wechatl?unionId=' + 
                  app.globalData.userinfo.unionId + 
                  '&nickname=' + app.globalData.nickname + 
                  '&avatarUrl=' + app.globalData.avatarUrl +
                  '&url=' + 'https://pdbbs.vencloud.cn'
      this.setData({ 
        unreadCount: app.globalData.unread,
        url: url
      })
    })
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'flarum') {
      const url = `/pages/${newTab}/${newTab}`
      wx.redirectTo({ url: url })
    }
  },

  onShareAppMessage: function () {

  }
})