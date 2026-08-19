const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false, page: 1, total: 0 },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  loadList() {
    this.setData({ loading: true })
    market.adminGetPendingHouses(this.data.page).then((res) => {
      if (res && res.status === 0) {
        const d = res.data || {}
        this.setData({ list: d.list || [], total: d.total || 0 })
      }
      this.setData({ loading: false })
    }).catch(() => { this.setData({ loading: false }) })
  },
  openDetail(e) { wx.navigateTo({ url: `/pages/admin/houseDetail?id=${e.currentTarget.dataset.id}` }) },
  approve(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认通过',
      content: '确定审核通过该房源？',
      success: (res) => {
        if (res.confirm) {
          market.adminApproveHouse(id).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已通过', icon: 'success' })
              this.loadList()
            }
          })
        }
      }
    })
  },
  goComments() { wx.redirectTo({ url: '/pages/admin/commentReview' }) },
  goReports() { wx.redirectTo({ url: '/pages/admin/reportReview' }) },
  goDeposits() { wx.redirectTo({ url: '/pages/admin/depositRefund' }) },
  goAuths() { wx.redirectTo({ url: '/pages/admin/authReview' }) }
})
