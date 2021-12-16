// pages/article/article.js
const log = require('./../../utils/log')
Page({
  data: {
    url : ''
  },

  onLoad: function (options) {
    log.info('onLoad文章')

    if (options.url) {
      log.info(options)

      this.setData({
        url : options.url + '?mode=mini'
      })
    }
  },

  
  onShareAppMessage: function () {

  }
})