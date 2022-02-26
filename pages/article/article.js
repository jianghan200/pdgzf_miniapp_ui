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
    let self = this
    var path = '/pages/newbee/newbee?tab=links&articleUrl=' + self.data.url
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