const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.getContactList().then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data || [] })
      this.setData({ loading: false })
    })
  },
  openDetail(e) { wx.navigateTo({ url: `/pages/contact/detail?id=${e.currentTarget.dataset.id}` }) }
})
