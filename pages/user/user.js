// pages/user/user.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  onLoad: function (options) {
    console.log('user on load')
  },

  onShow: function () {
    console.log('user on show')
  },

  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'user') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  }
})