const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.adminGetPendingAuths().then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data.list || [] })
      this.setData({ loading: false })
    })
  },
  approve(e) {
    const id = e.currentTarget.dataset.id
    market.adminApproveAuth(id).then((res) => { if (res && res.status === 0) { wx.showToast({ title: '已通过', icon: 'success' }); this.loadList() } })
  },
  reject(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '驳回原因', editable: true, success: (r) => {
      if (r.confirm && r.content) market.adminRejectAuth(id, r.content).then((res) => { if (res && res.status === 0) { wx.showToast({ title: '已驳回', icon: 'success' }); this.loadList() } })
    }})
  },
  previewImage(e) { wx.previewImage({ urls: [e.currentTarget.dataset.url] }) },
  goHouses() { wx.redirectTo({ url: '/pages/admin/houseReview' }) },
  goComments() { wx.redirectTo({ url: '/pages/admin/commentReview' }) },
  goReports() { wx.redirectTo({ url: '/pages/admin/reportReview' }) },
  goDeposits() { wx.redirectTo({ url: '/pages/admin/depositRefund' }) }
})
