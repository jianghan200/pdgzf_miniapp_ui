const app = getApp()
const log = require('./../../utils/log')
Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    userinfo : null,
    isIOS: false
  },

  onLoad: function (options) {
    log.info('onLoad right')

    this.setData({
      isIOS: app.globalData.IOS
    })
  }
})