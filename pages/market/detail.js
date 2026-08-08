const market = require('../../utils/market')
const pay = require('../../utils/pay')

const app = getApp()

const HOUSE_TYPE_MARKET = 3
const CONTACT_AD_UNIT_ID = 'adunit-1b2c81cb8c5f8b73'  // 广告位 ID，上线前替换为真实值

Page({
  data: {
    StatusBar: 0,
    id: 0,
    detail: null,
    mediaList: [],
    currentMedia: 0,
    loading: true,
    isOwner: false,
    favorited: false,
    contactMethod: 'pay',  // 'pay' | 'ad'
    adUnlocked: false,
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight, id: options.id })
    this.loadContactConfig()
    this.loadDetail()
  },

  loadContactConfig() {
    market.getContactConfig().then((res) => {
      if (res && res.status === 0 && res.data) {
        this.setData({ contactMethod: res.data.method || 'pay' })
      }
    })
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
        this.loadFavoriteStatus()
      }
      this.setData({ loading: false })
    })
  },

  _isLogin() {
    const u = app.globalData.userinfo
    return !!(u && u.tokenStr)
  },

  _requireLogin() {
    if (this._isLogin()) return true
    wx.showModal({
      title: '请先登录',
      content: '登录后才能收藏房源',
      confirmText: '去登录',
      success: (r) => { if (r.confirm) wx.navigateTo({ url: '/pages/login/login' }) }
    })
    return false
  },

  loadFavoriteStatus() {
    if (!this._isLogin()) return
    market.getFavoriteStatus(HOUSE_TYPE_MARKET, this.data.id).then((res) => {
      if (res && res.status === 0) this.setData({ favorited: !!res.data.favorited })
    })
  },

  toggleFavorite() {
    if (!this._requireLogin()) return
    const fav = this.data.favorited
    const req = fav ? market.removeFavorite(HOUSE_TYPE_MARKET, this.data.id) : market.addFavorite(HOUSE_TYPE_MARKET, this.data.id)
    req.then((res) => {
      if (res && res.status === 0) {
        this.setData({ favorited: !fav })
        wx.showToast({ title: fav ? '已取消收藏' : '已收藏', icon: 'none' })
      } else if (res && res.msg) {
        wx.showToast({ title: res.msg, icon: 'none' })
      }
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
    if (this.data.contactMethod === 'ad') {
      wx.showModal({
        title: '联系房东',
        content: '观看完整广告后可获得房东联系方式（24小时内有效）',
        confirmText: '看广告',
        success: (res) => {
          if (res.confirm) this._showContactAd()
        }
      })
    } else {
      this._doPayContact()
    }
  },

  _doPayContact() {
    if (!wx.canIUse('requestVirtualPayment')) {
      wx.showModal({ title: '版本过低', content: '请将微信升级至最新版本后重试' })
      return
    }
    wx.showLoading({ title: '创建订单...' })
    pay.payContact(this.data.id, 1, '').then(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.setData({ adUnlocked: true })
      this.loadDetail()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付失败', icon: 'none' })
    })
  },

  _getContactAd() {
    if (this._contactAd) return this._contactAd
    if (!CONTACT_AD_UNIT_ID || CONTACT_AD_UNIT_ID.indexOf('xxxx') >= 0) return null
    this._contactAd = wx.createRewardedVideoAd({ adUnitId: CONTACT_AD_UNIT_ID })
    this._contactAd.onError((err) => { console.log('联系房东激励视频广告错误', err) })
    this._contactAd.onClose((res) => {
      if (res && res.isEnded) {
        this._unlockContactByAd()
      } else {
        wx.showToast({ title: '看完视频才能解锁', icon: 'none' })
      }
    })
    return this._contactAd
  },

  _showContactAd() {
    const ad = this._getContactAd()
    if (!ad) {
      wx.showToast({ title: '广告暂不可用', icon: 'none' })
      return
    }
    ad.show().catch(() => {
      ad.load().then(() => ad.show()).catch(() => wx.showToast({ title: '广告加载失败', icon: 'none' }))
    })
  },

  _unlockContactByAd() {
    wx.showLoading({ title: '解锁中...' })
    market.createContact({
      house_id: this.data.id,
      type: 1,
      message: this.data.contactMessage,
      method: 'ad'
    }).then((res) => {
      wx.hideLoading()
      if (res && res.status === 0) {
        this.setData({ adUnlocked: true })
        wx.showToast({ title: '已解锁联系方式', icon: 'success' })
      } else {
        wx.showToast({ title: (res && res.msg) || '解锁失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '解锁失败', icon: 'none' })
    })
  },

  callPhone() {
    if (!this.data.detail || !this.data.detail.contact_phone) {
      wx.showToast({ title: '联系方式不可见', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: this.data.detail.contact_phone })
  },

  copyWechat() {
    const wechat = this.data.detail && this.data.detail.contact_wechat
    if (!wechat) return
    wx.setClipboardData({
      data: wechat,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' })
    })
  },

  copySourceUrl() {
    const url = this.data.detail && this.data.detail.source_url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success: () => wx.showModal({
        title: '链接已复制',
        content: '请用浏览器粘贴打开查看',
        showCancel: false,
        confirmText: '好的'
      })
    })
  },

  goReport() {
    wx.navigateTo({ url: `/pages/report/create?house_id=${this.data.id}` })
  },

  editHouse() {
    wx.navigateTo({ url: `/pages/market/publish?id=${this.data.id}` })
  },

  onTapComment() {
    const cs = this.selectComponent('#comment-section')
    if (cs) cs.openInput()
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
  },

  onShareAppMessage() {
    const path = '/pages/market/detail?id=' + this.data.id
    return {
      title: this.data.detail ? this.data.detail.title : '市场租房',
      path: '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl: '',
      success(res) { if (res.errMsg === 'shareAppMessage:ok') wx.showToast({ title: '转发成功', icon: 'success' }) },
      fail(err) {
        if (err.errMsg === 'shareAppMessage:fail cancel') wx.showToast({ title: '转发已取消' })
        else wx.showToast({ title: '转发失败' })
      }
    }
  }
})
