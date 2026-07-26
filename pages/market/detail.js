const market = require('../../utils/market')
const pay = require('../../utils/pay')

Page({
  data: {
    StatusBar: 0,
    id: 0,
    detail: null,
    mediaList: [],
    currentMedia: 0,
    loading: true,
    showContact: false,
    contactMessage: '',
    isOwner: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight, id: options.id })
    this.loadDetail()
  },

  loadDetail() {
    this.setData({ loading: true })
    market.getMarketDetail(this.data.id).then((res) => {
      if (res.status === 0) {
        const d = res.data
        // 解析 facilities JSON
        try { d.facilities_arr = JSON.parse(d.facilities || '[]') } catch(e) { d.facilities_arr = [] }
        try { d.nearby_arr = JSON.parse(d.nearby_facilities || '[]') } catch(e) { d.nearby_arr = [] }
        this.setData({
          detail: d,
          mediaList: (d.medias || []).map(m => m.url),
          isOwner: d.is_owner || false
        })
      }
      this.setData({ loading: false })
    })
  },

  onSwiperChange(e) {
    this.setData({ currentMedia: e.detail.current })
  },

  previewMedia(e) {
    const idx = e.currentTarget.dataset.idx
    wx.previewImage({
      current: this.data.mediaList[idx],
      urls: this.data.mediaList
    })
  },

  toggleContact() {
    this.setData({ showContact: !this.data.showContact })
  },

  onContactInput(e) {
    this.setData({ contactMessage: e.detail.value })
  },

  doContact() {
    if (!this.data.contactMessage.trim()) {
      wx.showToast({ title: '请输入留言', icon: 'none' })
      return
    }
    wx.showLoading({ title: '创建订单...' })
    pay.payContact(this.data.id, 1, this.data.contactMessage).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.setData({ showContact: false, contactMessage: '' })
      this.loadDetail()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付失败', icon: 'none' })
    })
  },

  callPhone() {
    if (!this.data.detail || !this.data.detail.contact_phone) {
      wx.showToast({ title: '联系方式不可见', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: this.data.detail.contact_phone })
  },

  goReport() {
    wx.navigateTo({ url: `/pages/report/create?house_id=${this.data.id}` })
  },

  editHouse() {
    wx.navigateTo({ url: `/pages/market/publish?id=${this.data.id}` })
  },

  offlineHouse() {
    wx.showModal({
      title: '下架确认',
      content: '确定要下架此房源吗？',
      success: (res) => {
        if (res.confirm) {
          market.offlineMarketHouse(this.data.id).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已下架', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            }
          })
        }
      }
    })
  }
})
