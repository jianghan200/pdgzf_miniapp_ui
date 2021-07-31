const app = getApp()
const constants = require('../../utils/constants')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    CustomBar: app.globalData.CustomBar,
    userinfo: null
  },
  
  onLoad: function (options) {
    this.setData({
      userinfo: app.globalData.userinfo
    })
  },

  // Bottom Bar的方法
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'user') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  },

  // Go to VIP页
  gotoVipPage(e) {
    wx.navigateTo({
      url: `/pages/vip/vip`,
    })
  },

  gotoEmailPage(e) {
    wx.navigateTo({
      url: '/pages/email/email',
    })
  }
})