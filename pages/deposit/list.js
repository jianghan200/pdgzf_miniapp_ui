const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.getDepositList().then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data || [] })
      this.setData({ loading: false })
    })
  },
  applyRefund(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '申请退还', content: '确定要申请退还保证金吗？',
      success: (r) => {
        if (r.confirm) {
          market.applyDepositRefund(id).then((res) => {
            if (res && res.status === 0) { wx.showToast({ title: '已申请', icon: 'success' }); this.loadList() }
          })
        }
      }
    })
  }
})
