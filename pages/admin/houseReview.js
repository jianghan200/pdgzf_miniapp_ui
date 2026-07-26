const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false, page: 1 },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.adminGetPendingHouses(this.data.page).then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data.list || [] })
      this.setData({ loading: false })
    })
  },
  openDetail(e) { wx.navigateTo({ url: `/pages/admin/houseDetail?id=${e.currentTarget.dataset.id}` }) },
  approve(e) {
    const id = e.currentTarget.dataset.id
    market.adminApproveHouse(id).then((res) => { if (res && res.status === 0) { wx.showToast({ title: '已通过', icon: 'success' }); this.loadList() } })
  },
  goReports() { wx.redirectTo({ url: '/pages/admin/reportReview' }) },
  goDeposits() { wx.redirectTo({ url: '/pages/admin/depositRefund' }) },
  goAuths() { wx.redirectTo({ url: '/pages/admin/authReview' }) }
})
