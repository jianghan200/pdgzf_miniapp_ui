const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, id: 0, detail: null, rejectComment: '', loading: true },
  onLoad(options) { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight, id: options.id }); this.loadDetail() },
  loadDetail() {
    market.getMarketDetail(this.data.id).then((res) => {
      if (res && res.status === 0) {
        const d = res.data
        try { d.facilities_arr = JSON.parse(d.facilities || '[]') } catch(e) { d.facilities_arr = [] }
        this.setData({ detail: d })
      }
      this.setData({ loading: false })
    })
  },
  onRejectInput(e) { this.setData({ rejectComment: e.detail.value }) },
  approve() {
    market.adminApproveHouse(this.data.id).then((res) => {
      if (res && res.status === 0) { wx.showToast({ title: '已通过', icon: 'success' }); setTimeout(() => wx.navigateBack(), 1500) }
    })
  },
  reject() {
    if (!this.data.rejectComment.trim()) { wx.showToast({ title: '请输入驳回原因', icon: 'none' }); return }
    market.adminRejectHouse(this.data.id, this.data.rejectComment).then((res) => {
      if (res && res.status === 0) { wx.showToast({ title: '已驳回', icon: 'success' }); setTimeout(() => wx.navigateBack(), 1500) }
    })
  }
})
