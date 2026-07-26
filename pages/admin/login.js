const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, userName: '', password: '' },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  login() {
    if (!this.data.userName || !this.data.password) { wx.showToast({ title: '请输入', icon: 'none' }); return }
    market.adminLogin(this.data.userName, this.data.password).then((res) => {
      if (res && res.status === 0 && res.data && res.data.token) {
        const app = getApp()
        if (!app.globalData) app.globalData = {}
        if (!app.globalData.userinfo) app.globalData.userinfo = {}
        app.globalData.userinfo.adminToken = res.data.token
        wx.setStorageSync('adminToken', res.data.token)
        wx.redirectTo({ url: '/pages/admin/houseReview' })
      } else {
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  }
})
