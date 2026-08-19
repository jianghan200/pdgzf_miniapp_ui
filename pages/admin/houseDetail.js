const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, id: 0, detail: null, rejectComment: '', loading: true },
  onLoad(options) {
    const s = wx.getSystemInfoSync()
    this.setData({ StatusBar: s.statusBarHeight, id: options.id })
    this.loadDetail()
  },
  onPullDownRefresh() {
    this.setData({ loading: true })
    this.loadDetail()
    wx.stopPullDownRefresh()
  },
  loadDetail() {
    market.getMarketDetail(this.data.id).then((res) => {
      if (res && res.status === 0) {
        const d = res.data
        // 解析 JSON 数组字段
        try { d.facilities_arr = JSON.parse(d.facilities || '[]') } catch (e) { d.facilities_arr = [] }
        try { d.nearby_arr = JSON.parse(d.nearby_facilities || '[]') } catch (e) { d.nearby_arr = [] }
        // 确保 medias 数组存在
        if (!d.medias) d.medias = []
        this.setData({ detail: d })
      }
      this.setData({ loading: false })
    }).catch(() => { this.setData({ loading: false }) })
  },
  onRejectInput(e) { this.setData({ rejectComment: e.detail.value }) },
  approve() {
    wx.showModal({
      title: '确认通过',
      content: '确定审核通过该房源？通过后将立即上架。',
      success: (res) => {
        if (res.confirm) {
          market.adminApproveHouse(this.data.id).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已通过', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            }
          })
        }
      }
    })
  },
  reject() {
    if (!this.data.rejectComment.trim()) {
      wx.showToast({ title: '请输入驳回原因', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认驳回',
      content: `驳回原因：${this.data.rejectComment}`,
      success: (res) => {
        if (res.confirm) {
          market.adminRejectHouse(this.data.id, this.data.rejectComment).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已驳回', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            }
          })
        }
      }
    })
  }
})
