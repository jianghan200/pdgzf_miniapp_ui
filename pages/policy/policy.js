// pages/policy/policy.js
const log = require('./../../utils/log')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关
    curTab : 0,
    scrollLeft : 0
  },

  onLoad: function (options) {
    log.info('onLoad policy页')
  },

  // 导航栏上选择不同的tab
  tabSelect(e) {
    this.setData({
      curTab: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1 )* 60
    })
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

  // 转发
  onShareAppMessage: function(options) {
    let self = this
    return {
      title : 'PD公租房',
      path : '/pages/login/login',
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