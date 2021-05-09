// pages/home/home.js
Page({
  data: {
  },
  
  onLoad(options) {
    wx.login({
      success: function(res) {
        console.log(res)
        wx.navigateTo({
          url: '/pages/projects/projects',
        })
      }
    })
  }
})