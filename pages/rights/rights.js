const app = getApp()
Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    userinfo : null,
    isIOS: false
  },

  onLoad: function (options) {
    this.setData({
      isIOS: app.globalData.IOS
    })
  }
})