const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.adminGetPendingReports().then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data.list || [] })
      this.setData({ loading: false })
    })
  },
  approve(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认', content: '举报成立将退还举报费、扣保证金、下架房源', success: (r) => {
      if (r.confirm) market.adminApproveReport(id).then((res) => { if (res && res.status === 0) { wx.showToast({ title: '已处理', icon: 'success' }); this.loadList() } })
    }})
  },
  reject(e) {
    const id = e.currentTarget.dataset.id
    market.adminRejectReport(id).then((res) => { if (res && res.status === 0) { wx.showToast({ title: '已驳回', icon: 'success' }); this.loadList() } })
  },
  goHouses() { wx.redirectTo({ url: '/pages/admin/houseReview' }) },
  goDeposits() { wx.redirectTo({ url: '/pages/admin/depositRefund' }) },
  goAuths() { wx.redirectTo({ url: '/pages/admin/authReview' }) }
})
