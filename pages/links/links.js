// pages/links/links.js
const log = require('./../../utils/log')
Page({

  data: {

  },

  onLoad: function (options) {
    if (options['articleUrl'] && options['articleUrl'] != '') {
      let url = options['articleUrl']
      log.info(`文章链接是: ${url}`)
      wx.navigateTo({
        url: '/pages/article/article?url=' + url,
      })
    }
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
    var path = '/pages/newbee/newbee?tab=links'
    let self = this
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