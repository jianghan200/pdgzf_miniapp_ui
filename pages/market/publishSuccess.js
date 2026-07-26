Page({
  data: { StatusBar: 0 },
  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
  },
  goList() {
    wx.redirectTo({ url: '/pages/market/list' })
  },
  goPublish() {
    wx.redirectTo({ url: '/pages/market/publish' })
  },
  goMy() {
    wx.switchTab({ url: '/pages/user/user' })
  }
})
