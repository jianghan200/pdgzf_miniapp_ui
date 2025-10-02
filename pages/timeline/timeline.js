// pages/timeline/timeline.js
const log = require('./../../utils/log')
Page({
  data: {
    curComponentId: 0
  },

  onLoad: function (options) {
    log.info('onLoad timeline')
    if(options.curComponentId) {
      this.setData({curComponentId: options.curComponentId})
    }
  },

  goTo(e) {
    let page = e.currentTarget.dataset.page
    let url = `/pages/${page}/${page}`
    wx.navigateTo({
      url: url,
    })
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/user/user?tab=timeline&curComponentId=' + this.data.curComponentId
    let self = this
    return {
      title : '流程时间线',
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