// pages/newbee/newbee.js
const app = getApp()
const log = require('./../../utils/log')
Page({
  data: {
    vipInfo: null
  },

  onLoad: function (options) {
    log.info('进入newbee的onLoad')

    this.setData({
      vipInfo : app.globalData.userinfo
    })
    if(options['tab'] != undefined && options['tab'] != '') {
      let tab = options['tab']
      // 来自分享
      wx.navigateTo({
        url: `/pages/${tab}/${tab}`,
      })
    }
  },

  // 导航至某个页面
  goTo(e) {
    let page = e.currentTarget.dataset.page
    let url = `/pages/${page}/${page}`
    wx.navigateTo({
      url: url,
    })
  },

  // Bottom Bar的方法
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'newbee') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/newbee/newbee'
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