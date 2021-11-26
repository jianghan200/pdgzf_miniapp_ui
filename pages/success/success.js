// pages/success/success.js
const app = getApp()
Page({
  data: {
    CustomBar : app.globalData.CustomBar
  },

  onLoad: function (options) {

  },

  redirectToUser(e) {
    wx.redirectTo({
      url: '/pages/user/user',
    })
  }
})