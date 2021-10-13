// pages/newbee/newbee.js
const app = getApp()
Page({
  data: {
    vipInfo: null
  },

  onLoad: function (options) {
    this.setData({
      vipInfo : app.globalData.userinfo
    })
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