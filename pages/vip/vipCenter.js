const market = require('../../utils/market')
const pay = require('../../utils/pay')
Page({
  data: { StatusBar: 0, vipInfo: null, orders: [], loading: true },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }) },
  onShow() { this.loadAll() },
  loadAll() {
    Promise.all([market.getVipInfo(), market.getVipOrders()]).then(([vRes, oRes]) => {
      if (vRes && vRes.status === 0) this.setData({ vipInfo: vRes.data })
      if (oRes && oRes.status === 0) this.setData({ orders: oRes.data || [] })
      this.setData({ loading: false })
    })
  },
  buyTenant(e) {
    const period = parseInt(e.currentTarget.dataset.period)
    wx.showLoading({ title: '创建订单...' })
    pay.payVip(1, period).then(() => {
      wx.hideLoading(); wx.showToast({ title: '开通成功', icon: 'success' }); this.loadAll()
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '支付失败', icon: 'none' }) })
  },
  buyLandlord(e) {
    const period = parseInt(e.currentTarget.dataset.period)
    wx.showLoading({ title: '创建订单...' })
    pay.payVip(2, period).then(() => {
      wx.hideLoading(); wx.showToast({ title: '开通成功', icon: 'success' }); this.loadAll()
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '支付失败', icon: 'none' }) })
  }
})
