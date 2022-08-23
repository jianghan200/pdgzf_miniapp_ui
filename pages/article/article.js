// pages/article/article.js
const log = require('./../../utils/log')
const app = getApp()
Page({
  data: {
    url : ''
  },

  onLoad: function (options) {
    log.info('onLoad文章')

    if (options.url) {
      log.info(options)

      // WP的域名需要将用户的unionId添加到url中
      if (options.url.indexOf('pd.vencloud.cn') === -1) {
        this.setData({ url: options.url + '?mode=mini' })
      } else {
        this.setData({ url: options.url + '?weixin_user_id=' + app.globalData.userinfo.unionId + '&mode=mini' })
      }
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