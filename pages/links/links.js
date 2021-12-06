// pages/links/links.js
const log = require('./../../utils/log')
Page({

  data: {

  },

  onLoad: function (options) {

  },

  navTo(e) {
    log.info(`用户点击一个文章链接`)
    console.log(e)

    if (e.currentTarget.dataset.url) {
      log.info(`文章链接是: ${e.currentTarget.dataset.url}`)

      wx.navigateTo({
        url: '/pages/article/article?url=' + e.currentTarget.dataset.url,
      })
    }
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})