const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, list: [], loading: false, page: 1 },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadList() },
  onPullDownRefresh() { this.loadList().then(() => wx.stopPullDownRefresh()) },
  loadList() {
    this.setData({ loading: true })
    return market.adminGetPendingComments(this.data.page).then((res) => {
      if (res && res.status === 0) this.setData({ list: res.data.list || [] })
      this.setData({ loading: false })
    })
  },
  approve(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认通过',
      content: '通过后该评论将公开展示',
      success: (r) => {
        if (!r.confirm) return
        market.adminApproveComment(id).then((res) => {
          if (res && res.status === 0) {
            wx.showToast({ title: '已通过', icon: 'success' })
            this.loadList()
          } else {
            wx.showToast({ title: (res && res.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },
  reject(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '拒绝原因',
      editable: true,
      placeholderText: '请输入拒绝原因（可选）',
      success: (r) => {
        if (!r.confirm) return
        market.adminRejectComment(id, r.content || '').then((res) => {
          if (res && res.status === 0) {
            wx.showToast({ title: '已拒绝', icon: 'success' })
            this.loadList()
          } else {
            wx.showToast({ title: (res && res.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },
  previewImage(e) {
    const urls = e.currentTarget.dataset.urls
    const current = e.currentTarget.dataset.current
    wx.previewImage({ urls, current })
  },
  goHouses() { wx.redirectTo({ url: '/pages/admin/houseReview' }) },
  goReports() { wx.redirectTo({ url: '/pages/admin/reportReview' }) },
  goDeposits() { wx.redirectTo({ url: '/pages/admin/depositRefund' }) },
  goAuths() { wx.redirectTo({ url: '/pages/admin/authReview' }) }
})
