const market = require('../../utils/market')
const pay = require('../../utils/pay')
const gate = require('../../utils/gate')

const app = getApp()

const HOUSE_TYPE_MARKET = 3
const CONTACT_AD_UNIT_ID = 'adunit-1b2c81cb8c5f8b73'
const COMPARE_STORAGE_KEY = 'compare_house_ids'

Page({
  data: {
    StatusBar: 0,
    CustomBar: 0,
    id: 0,
    detail: null,
    mediaList: [],
    currentMedia: 0,
    loading: true,
    isOwner: false,
    isAdmin: false,
    favorited: false,
    contactMethod: 'pay',
    adUnlocked: false,
    inCompare: false,
    isRoot: false,
    highlightList: [],
    mapReady: false,
    // content gate 状态
    priceVisible: true,
    descriptionVisible: true,
    chatVisible: true,
    priceMasked: false,
    descriptionMasked: false,
    unlockExpire: '',
    // 统一解锁 Dialog
    unlockDialogVisible: false,
    unlockDialogTitle: '',
    unlockDialogGateType: '',
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    // 冷启动/分享直接进入详情页时，页面栈只有本页（栈底），无上一页可返回
    const pages = getCurrentPages()
    const isRoot = pages.length <= 1
    this.setData({
      StatusBar: sys.statusBarHeight,
      CustomBar: app.globalData.CustomBar,
      id: options.id,
      isRoot
    })
    this.loadContactConfig()
    this.checkCompareStatus()
  },

  onShow() {
    // 每次进入/返回页面时刷新详情（编辑保存返回后展示最新数据）
    if (this.data.id) this.loadDetail()
  },

  loadContactConfig() {
    market.getContactConfig().then((res) => {
      if (res && res.status === 0 && res.data) {
        const method = res.data.method || 'pay'
        this.setData({ contactMethod: method })
        if (method === 'ad' && this._isContactUnlockedRecently()) {
          this.setData({ adUnlocked: true })
        }
      }
    })
  },

  loadDetail() {
    this.setData({ loading: true })
    market.getMarketDetail(this.data.id).then((res) => {
      if (res.status === 0) {
        const d = res.data
        try { d.facilities_arr = JSON.parse(d.facilities || '[]') } catch(e) { d.facilities_arr = [] }
        try { d.nearby_arr = JSON.parse(d.nearby_facilities || '[]') } catch(e) { d.nearby_arr = [] }
        try { d.ai_info = JSON.parse(d.ai_info_json || '[]') } catch(e) { d.ai_info = [] }
        d.source_type_label = this._sourceTypeLabel(d.source_type)
        d.rent_type_label = this._rentTypeLabel(d.rent_type)
        d.property_type_label = this._propertyTypeLabel(d.property_type)
        d.building_type_label = this._buildingTypeLabel(d.building_type)
        d.rent_display = d.rent_display || (d.rent ? '¥' + d.rent : d.is_negotiable ? '面议' : '价格待定')
        d.available_date_display = d.available_date_display || d.available_date_fuzzy || d.available_date || '入住时间待定'
        d.floor_desc = this._buildFloorDesc(d)
        d.orientation_label = this._orientationLabel(d.orientation)
        d.lease_desc = this._buildLeaseDesc(d)
        const highlightList = this._buildHighlightList(d)
        // content gate 状态（后端返回的 gate 字段）
        const g = d.gate || {}
        const priceVisible = !(g.price && g.price.visible === false)
        const descVisible = !(g.description && g.description.visible === false)
        const chatVisible = !(g.chat && g.chat.visible === false)
        this.setData({
          detail: d,
          mediaList: (d.medias || []).map(m => ({ url: m.url, type: m.type === 'video' ? 'video' : 'photo' })),
          isOwner: d.is_owner || false,
          isAdmin: d.is_admin || false,
          highlightList,
          priceVisible,
          descriptionVisible: descVisible,
          chatVisible,
          priceMasked: !priceVisible,
          descriptionMasked: !descVisible,
          unlockExpire: g.unlock_expire || '',
        })
        this.loadFavoriteStatus()
      }
      this.setData({ loading: false })
    })
  },

  _sourceTypeLabel(v) {
    const map = { owner: '房东直租', roommate: '合租找室友', sublet: '转租', apt: '公寓直租' }
    return map[v] || '房东直租'
  },
  _rentTypeLabel(v) {
    const map = { whole: '整租', share: '合租', bed: '床位' }
    return map[v] || '整租'
  },
  _propertyTypeLabel(v) {
    const map = {
      commercial: '商品房', relocation: '安置房', affordable: '经济适用房',
      civilian: '民房', apartment: '公寓', talent_apt: '人才公寓',
      bao_rent: '保租房', public_rent: '公租房', other: '其他'
    }
    return map[v] || ''
  },
  _buildingTypeLabel(v) {
    const map = {
      low_rise: '小高层', high_rise: '高层', villa: '别墅',
      stacked: '叠墅', super_high: '超高层', bungalow: '平房'
    }
    return map[v] || ''
  },
  _orientationLabel(v) {
    const map = { east: '东', south: '南', west: '西', north: '北' }
    return map[v] || (v === 'unknown' ? '' : v)
  },
  _buildFloorDesc(d) {
    const parts = []
    if (d.floor) parts.push('第' + d.floor + '层')
    if (d.total_floor) parts.push('共' + d.total_floor + '层')
    if (d.floor_tag === 'first') parts.push('一楼')
    if (d.floor_tag === 'last') parts.push('顶层')
    if (d.floor_tag === 'attic') parts.push('阁楼')
    if (d.floor_tag === 'basement') parts.push('地下室')
    return parts.join(' · ')
  },
  _buildLeaseDesc(d) {
    if (!d.min_lease && !d.max_lease) return ''
    if (d.min_lease && d.max_lease) return `${d.min_lease}-${d.max_lease}月`
    if (d.min_lease) return `≥${d.min_lease}月`
    return `≤${d.max_lease}月`
  },

  // 构建亮点列表（参考截图的 emoji + 文本风格）
  _buildHighlightList(d) {
    const list = []
    if (d.source_type === 'owner') {
      list.push({ emoji: '😊', text: '业主本人直租，无中介费' })
    }
    if (d.source_type === 'apt') {
      list.push({ emoji: '🏢', text: '品牌公寓直租，管家服务' })
    }
    if (d.is_certified == 1) {
      list.push({ emoji: '✅', text: '房东身份已认证，房源信息真实' })
    }
    if (d.is_new_decoration == 1) {
      list.push({ emoji: '❗', text: '全新装修，拎包入住' })
    }
    if (d.is_furnished == 1) {
      list.push({ emoji: '🛋️', text: '家具家电齐全，拎包入住' })
    }
    if (d.private_kitchen == 1 && d.bathroom_type === 'private') {
      list.push({ emoji: '💡', text: '独厨独卫，生活私密性好' })
    } else if (d.bathroom_type === 'private') {
      list.push({ emoji: '🚿', text: '独立卫生间，使用方便' })
    } else if (d.private_kitchen == 1) {
      list.push({ emoji: '🍳', text: '独立厨房，可自己做饭' })
    }
    if (d.civil_meters == 1) {
      list.push({ emoji: '💰', text: '民水民电，生活成本低' })
    }
    if (d.gas == 1) {
      list.push({ emoji: '🔥', text: '通天然气，做饭方便又省钱' })
    }
    if (d.south == 1 || d.orientation === 'south') {
      list.push({ emoji: '☀️', text: '朝南户型，采光充足' })
    }
    if (d.elevator == 1) {
      list.push({ emoji: '🛗', text: '电梯房，上下楼方便' })
    }
    if (d.pet_friendly == 1) {
      list.push({ emoji: '🐱', text: '可养宠物，毛孩子也有家' })
    }
    if (d.can_register == 1) {
      list.push({ emoji: '📋', text: '可办居住证，满足落户需求' })
    }
    if (d.is_negotiable == 1) {
      list.push({ emoji: '🤝', text: '价格面议，有协商空间' })
    }
    if (d.subway_info) {
      list.push({ emoji: '🚇', text: d.subway_info })
    }
    if (d.parking_fee) {
      list.push({ emoji: '🚗', text: '有停车位：' + d.parking_fee })
    }
    if (d.view_time_desc) {
      list.push({ emoji: '⏰', text: '看房时间：' + d.view_time_desc })
    } else {
      list.push({ emoji: '👁️', text: '看房时间随意，请提前联系' })
    }
    return list.slice(0, 10)
  },

  scrollToMap() {
    wx.createSelectorQuery()
      .select('#location-section')
      .boundingClientRect((rect) => {
        if (rect) {
          wx.pageScrollTo({ scrollTop: rect.top - 20, duration: 300 })
        }
      })
      .exec()
  },

  openMap() {
    const d = this.data.detail
    if (!d) return
    const address = (d.district || '') + (d.town || '') + (d.address || d.address_name || '')
    if (d.latitude && d.longitude) {
      wx.openLocation({
        latitude: parseFloat(d.latitude),
        longitude: parseFloat(d.longitude),
        name: d.address_name || d.title || '房源位置',
        address: address,
        scale: 16
      })
    } else if (address) {
      wx.showToast({ title: '位置信息暂不完整', icon: 'none' })
    }
  },

  _isLogin() {
    const u = app.globalData.userinfo
    return !!(u && u.tokenStr)
  },

  _requireLogin() {
    if (this._isLogin()) return true
    const redirect = '/pages/market/detail?id=' + this.data.id
    wx.showModal({
      title: '请先登录',
      content: '登录后才能收藏房源',
      confirmText: '去登录',
      success: (r) => { if (r.confirm) wx.navigateTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(redirect) }) }
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
    const imgs = this.data.mediaList.filter(m => m.type !== 'video').map(m => m.url)
    const current = this.data.mediaList[idx] && this.data.mediaList[idx].url
    wx.previewImage({ current: current, urls: imgs })
  },

  // 冷启动/分享进入时，浮动图标返回市场房源 tab
  goMarketList() {
    wx.switchTab({ url: '/pages/market/list' })
  },

  previewVideo(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.mediaList[idx]
    if (!item || item.type !== 'video') return
    const imgs = this.data.mediaList.filter(m => m.type !== 'video').map(m => m.url)
    const sources = imgs.map(url => ({ url, type: 'image' }))
    sources.push({ url: item.url, type: 'video' })
    wx.previewMedia({ sources, current: sources.length - 1, fail: () => wx.showToast({ title: '视频暂无法预览', icon: 'none' }) })
  },

  toggleContact() {
    if (this.data.contactMethod === 'ad') {
      if (this._isContactUnlockedRecently()) { this._unlockContactByAd(true); return }
      this._showContactAd()
    } else {
      this._doPayContact()
    }
  },

  onBottomContact() {
    if (this.data.contactMethod === 'ad') {
      if (this._isContactUnlockedRecently()) { this._unlockContactByAd(true); return }
      wx.showModal({
        title: '联系房东',
        content: '观看完整广告后可获得房东联系方式（24小时内有效）',
        confirmText: '看广告',
        cancelText: '取消',
        success: (res) => { if (res.confirm) this._showContactAd() }
      })
    } else {
      this._doPayContact()
    }
  },

  _AD_STORAGE_KEY: 'market_contact_ad_unlock',
  _isContactUnlockedRecently() {
    try {
      const map = wx.getStorageSync(this._AD_STORAGE_KEY) || {}
      const ts = map[this.data.id]
      return !!(ts && (Date.now() - ts) < 24 * 3600 * 1000)
    } catch (e) { return false }
  },
  _markContactUnlocked() {
    try {
      const map = wx.getStorageSync(this._AD_STORAGE_KEY) || {}
      map[this.data.id] = Date.now()
      wx.setStorageSync(this._AD_STORAGE_KEY, map)
    } catch (e) {}
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
      if (res && res.isEnded) this._unlockContactByAd()
      else wx.showToast({ title: '看完视频才能解锁', icon: 'none' })
    })
    return this._contactAd
  },

  _showContactAd() {
    const ad = this._getContactAd()
    if (!ad) { wx.showToast({ title: '广告暂不可用', icon: 'none' }); return }
    ad.show().catch(() => {
      ad.load().then(() => ad.show()).catch(() => wx.showToast({ title: '广告加载失败', icon: 'none' }))
    })
  },

  _unlockContactByAd(skipServer) {
    if (skipServer) {
      this.setData({ adUnlocked: true })
      wx.showToast({ title: '已解锁联系方式', icon: 'success' })
      return
    }
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
        this._markContactUnlocked()
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

  // 发起私信会话
  startChat() {
    if (!this._requireLogin()) return
    if (!this.data.chatVisible) {
      this.showUnlockDialog('chat')
      return
    }
    wx.showLoading({ title: '开启会话...' })
    market.createChatConversation(this.data.id).then((res) => {
      wx.hideLoading()
      if (res && res.status === 0) {
        wx.navigateTo({ url: `/pages/chat/detail?id=${res.data.id}` })
      } else {
        wx.showToast({ title: (res && res.msg) || '暂无法私信', icon: 'none' })
      }
    })
  },

  // ---- 内容门槛解锁 ----

  unlockPrice() {
    if (this.data.priceVisible) return
    this.showUnlockDialog('price')
  },

  unlockDescription() {
    if (this.data.descriptionVisible) return
    this.showUnlockDialog('description')
  },

  unlockChat() {
    if (this.data.chatVisible) return
    this.showUnlockDialog('chat')
  },

  // ---- 统一解锁 Dialog ----

  showUnlockDialog(gateType) {
    const titles = { price: '解锁价格', description: '解锁描述', chat: '解锁私信' }
    this.setData({
      unlockDialogVisible: true,
      unlockDialogTitle: titles[gateType] || '解锁内容',
      unlockDialogGateType: gateType,
    })
  },

  closeUnlockDialog() {
    this.setData({ unlockDialogVisible: false })
  },

  stopPropagation() {},

  doUnlockByAd() {
    const gateType = this.data.unlockDialogGateType
    if (!gateType) return
    this.closeUnlockDialog()
    wx.showLoading({ title: '加载广告...' })
    gate.watchAdAndUnlock(this.data.id, gateType).then((ok) => {
      wx.hideLoading()
      if (ok) {
        this.loadDetail()
        wx.showModal({
          title: '解锁成功',
          content: '内容已解锁，现在可以查看完整信息啦。',
          showCancel: false,
          confirmText: '好的'
        })
      } else {
        wx.showToast({ title: '解锁失败，请重试', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '广告加载失败', icon: 'none' })
    })
  },

  buyVipInDialog(e) {
    const period = parseInt(e.currentTarget.dataset.period)
    if (!wx.canIUse('requestVirtualPayment')) {
      wx.showModal({ title: '版本过低', content: '请将微信升级至最新版本后重试' })
      return
    }
    this.closeUnlockDialog()
    wx.showLoading({ title: '创建订单...' })
    pay.payVip(1, period).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '开通成功', icon: 'success' })
      this.loadDetail()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付失败', icon: 'none' })
    })
  },

  // 预约看房
  createViewing() {
    if (!this._requireLogin()) return
    if (this.data.isOwner) {
      wx.showToast({ title: '房东不能预约自己的房源', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/viewing/create?house_id=${this.data.id}&title=${encodeURIComponent(this.data.detail && this.data.detail.title || '')}`
    })
  },

  copyWechat() {
    const wechat = this.data.detail && this.data.detail.contact_wechat
    if (!wechat) return
    wx.setClipboardData({ data: wechat, success: () => wx.showToast({ title: '微信号已复制', icon: 'success' }) })
  },

  copySourceUrl() {
    const url = this.data.detail && this.data.detail.source_url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success: () => wx.showModal({ title: '链接已复制', content: '请用浏览器粘贴打开查看', showCancel: false, confirmText: '好的' })
    })
  },

  // 加入对比
  checkCompareStatus() {
    const ids = wx.getStorageSync(COMPARE_STORAGE_KEY) || []
    this.setData({ inCompare: ids.includes(parseInt(this.data.id)) })
  },
  addToCompare() {
    let ids = wx.getStorageSync(COMPARE_STORAGE_KEY) || []
    ids = ids.map(id => parseInt(id))
    const id = parseInt(this.data.id)
    if (ids.includes(id)) {
      wx.showToast({ title: '已在对比列表', icon: 'none' })
      return
    }
    if (ids.length >= 4) {
      wx.showToast({ title: '最多对比4套', icon: 'none' })
      return
    }
    ids.push(id)
    wx.setStorageSync(COMPARE_STORAGE_KEY, ids)
    this.setData({ inCompare: true })
    wx.showToast({ title: '已加入对比', icon: 'success' })
  },
  removeFromCompare() {
    let ids = wx.getStorageSync(COMPARE_STORAGE_KEY) || []
    const id = parseInt(this.data.id)
    ids = ids.filter(i => parseInt(i) !== id)
    wx.setStorageSync(COMPARE_STORAGE_KEY, ids)
    this.setData({ inCompare: false })
    wx.showToast({ title: '已移出对比', icon: 'none' })
  },
  goCompare() {
    wx.navigateTo({ url: '/pages/market/compare/compare' })
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
