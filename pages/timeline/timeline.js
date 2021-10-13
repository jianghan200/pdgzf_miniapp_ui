// pages/timeline/timeline.js
Page({
  data: {

  },

  onLoad: function (options) {

  },

  goTo(e) {
    let page = e.currentTarget.dataset.page
    let url = `/pages/${page}/${page}`
    wx.navigateTo({
      url: url,
    })
  },

  onShareAppMessage: function () {

  }
})