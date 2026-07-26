const market = require('../../utils/market')
const pay = require('../../utils/pay')
Page({
  data: { StatusBar: 0, houseId: 0, reason: '', submitting: false },
  onLoad(options) { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight, houseId: options.house_id || 0 }) },
  onInput(e) { this.setData({ reason: e.detail.value }) },
  submit() {
    if (!this.data.reason.trim()) { wx.showToast({ title: '请填写举报原因', icon: 'none' }); return }
    if (!this.data.houseId) { wx.showToast({ title: '参数错误', icon: 'none' }); return }
    this.setData({ submitting: true })
    wx.showLoading({ title: '创建订单...' })
    pay.payReportFee(this.data.houseId, this.data.reason).then(() => {
      wx.hideLoading(); this.setData({ submitting: false })
      wx.showToast({ title: '举报成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(() => {
      wx.hideLoading(); this.setData({ submitting: false })
      wx.showToast({ title: '支付失败', icon: 'none' })
    })
  }
})
