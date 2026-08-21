const market = require('../../utils/market')
const pay = require('../../utils/pay')
Page({
  data: {
    StatusBar: 0,
    vipInfo: null,
    orders: [],
    loading: true,
    supportVp: true,
    activeTab: 'tenant',
  },
  onLoad() {
    const s = wx.getSystemInfoSync()
    this.setData({
      StatusBar: s.statusBarHeight,
      supportVp: !!wx.canIUse('requestVirtualPayment')
    })
  },
  onShow() { this.loadAll() },
  loadAll() {
    Promise.all([market.getVipInfo(), market.getVipOrders()]).then(([vRes, oRes]) => {
      if (vRes && vRes.status === 0) this.setData({ vipInfo: vRes.data })
      if (oRes && oRes.status === 0) this.setData({ orders: oRes.data || [] })
      this.setData({ loading: false })
    })
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab !== this.data.activeTab) {
      this.setData({ activeTab: tab })
    }
  },
  buyTenant(e) {
    if (!this.data.supportVp) {
      wx.showModal({ title: '版本过低', content: '请将微信升级至最新版本后重试' })
      return
    }
    const period = parseInt(e.currentTarget.dataset.period)
    wx.showLoading({ title: '创建订单...' })
    pay.payVip(11, period).then(() => {
      wx.hideLoading(); wx.showToast({ title: '开通成功', icon: 'success' }); this.loadAll()
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '支付失败', icon: 'none' }) })
  },
  buyLandlord(e) {
    if (!this.data.supportVp) {
      wx.showModal({ title: '版本过低', content: '请将微信升级至最新版本后重试' })
      return
    }
    const period = parseInt(e.currentTarget.dataset.period)
    wx.showLoading({ title: '创建订单...' })
    pay.payVip(12, period).then(() => {
      wx.hideLoading(); wx.showToast({ title: '开通成功', icon: 'success' }); this.loadAll()
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '支付失败', icon: 'none' }) })
  }
})
