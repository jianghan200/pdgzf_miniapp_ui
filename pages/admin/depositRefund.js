const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.adminGetPendingDeposits().then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data.list || [] })
      this.setData({ loading: false })
    })
  },
  approve(e) {
    const id = e.currentTarget.dataset.id
    market.adminApproveDepositRefund(id).then((res) => { if (res && res.status === 0) { wx.showToast({ title: '已批准', icon: 'success' }); this.loadList() } })
  },
  goHouses() { wx.redirectTo({ url: '/pages/admin/houseReview' }) },
  goReports() { wx.redirectTo({ url: '/pages/admin/reportReview' }) },
  goAuths() { wx.redirectTo({ url: '/pages/admin/authReview' }) }
})
