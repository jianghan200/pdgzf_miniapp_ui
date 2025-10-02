// pages/article/article.js
const log = require('./../../utils/log')
const app = getApp()
Page({
  data: {
    url : '',
    curComponentId: 0
  },

  onLoad: function (options) {
    log.info('onLoad文章')

    if (options.url) {
      log.info(options)

      // WP的域名需要将用户的unionId添加到url中
      if (options.url.indexOf('pdgzf.cn') === -1) {
        this.setData({ url: options.url + '?mode=mini' })
      } else {
        this.setData({ url: options.url + '?weixin_user_id=' + app.globalData.userinfo.unionId + '&mode=mini' })
      }
    } else if (options['articleUrl'] && options['articleUrl'] != '') {
      let url = options['articleUrl']
      log.info(`分享文章链接是: ${url}`)
      this.setData({ url: url + '?mode=mini'})
    }

    if(options.curComponentId) {
      this.setData({curComponentId: options.curComponentId})
    }
  },

  extractUrl: function(url) {
    var urlAndParam = url.split('?');
    return urlAndParam[0]
  },
  onShareAppMessage: function () {
    let self = this
    var path = '/pages/user/user?tab=article&articleUrl=' + self.extractUrl(self.data.url) + '&curComponentId=' + self.data.curComponentId
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