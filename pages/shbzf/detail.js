const market = require('../../utils/market')

const app = getApp()

const HOUSE_TYPE_SHBZF = 1

// 设施英文 -> 中文映射（实际数据为 camelCase）
const FACILITY_MAP = {
  'airConditioner': '空调',
  'washingMachine': '洗衣机',
  'refrigerator': '冰箱',
  'heater': '热水器',
  'broadband': '宽带',
  'naturalGas': '天然气',
  'television': '电视',
  'tv': '电视',
  'heating': '暖气',
  'elevator': '电梯',
  'security': '门禁',
  'undergroundParking': '地下车库',
  'chargingPile': '充电桩',
  'smartHome': '智能家居',
  'gym': '健身房',
  'swimmingPool': '游泳池',
  'childrensPlayground': '儿童乐园',
  'garden': '花园',
  'expressCabinet': '快递柜',
  'bicycleParking': '非机动车停放',
  'barrierFree': '无障碍设施',
  'centralAirConditioning': '中央空调',
  'wardrobe': '衣柜',
  'bed': '床',
  'sofa': '沙发',
  'table': '书桌',
  'desk': '书桌',
  'smartLock': '智能门锁',
  'clothesDryer': '烘干机',
  'rangeHood': '油烟机',
  'microwave': '微波炉',
  'electricKettle': '电热水壶',
  'toilet': '马桶',
  'shower': '淋浴',
  'bathroomCabinet': '浴室柜',
  'intercom': '对讲系统',
  'fireAlarm': '火灾报警',
  'cctv': '监控',
  'laundryRoom': '洗衣房',
  'lounge': '休息区',
  'meetingRoom': '会议室',
  'coworking': '共享办公',
  'cafe': '咖啡厅',
  'convenienceStore': '便利店',
  'parking': '停车场',
  'motorcycleParking': '摩托车停放',
}

const _translateFacility = (f) => FACILITY_MAP[f] || f

const utils = require('../../utils/util')

Page({
  data: { StatusBar: 0, id: 0, detail: null, mediaList: [], loading: true, coordinate: { lat: null, lng: null }, marker: [], countdownText: '', expandedRules: false, tels: [], isVip: false, adUnitId: 'adunit-1261b13b058b14cb', favorited: false },
  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this._pendingTelIdx = -1
    this.setData({ StatusBar: sys.statusBarHeight, id: options.id })
    this.loadDetail()
  },
  _maskTel(tel) {
    const s = String(tel || '').trim()
    if (s.length <= 4) return s
    return s.slice(0, 3) + '****' + s.slice(-2)
  },
  _countdownTo(endStr) {
    if (!endStr) return ''
    const end = new Date(endStr.replace(/-/g, '/')).getTime()
    const now = Date.now()
    const diff = end - now
    if (diff <= 0) return ''
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    return days > 0 ? `${days}天${hours}小时后截止` : `${Math.max(1, Math.floor(diff / 3600000))}小时后截止`
  },
  loadDetail() {
    this.setData({ loading: true })
    Promise.all([market.getShbzfDetail(this.data.id), market.getShbzfMedia(this.data.id)]).then(([dRes, mRes]) => {
      if (dRes && dRes.status === 0) {
        let detail = dRes.data
        try { detail.facilities_arr = (JSON.parse(detail.facilities || '[]')).map(_translateFacility) } catch(e) { detail.facilities_arr = [] }
        try { detail.room_types_arr = JSON.parse(detail.room_types || '[]') } catch(e) { detail.room_types_arr = [] }
        // 户型：优先用官方 door_types[]，否则回退旧 room_types JSON
        detail.door_types_arr = (detail.door_types && detail.door_types.length)
          ? detail.door_types.map(d => Object.assign({}, d, {
              statusText: (d.rent_flat_num || 0) > 0 ? '可租' : '满租',
              statusClass: (d.rent_flat_num || 0) > 0 ? 'dt-avail' : 'dt-full'
            }))
          : detail.room_types_arr.map(r => Object.assign({}, r, { statusText: '', statusClass: '' }))
        // 家电：官方 appliances[] 或旧 facilities
        detail.appliances_arr = detail.appliances || detail.facilities_arr || []
        const countdownText = this._countdownTo(detail.concent_rate_accept_end)
        // 联系电话：默认脱敏，看广告或 VIP 后解锁
        const tels = []
        if (detail.project_tel) tels.push({ label: '项目', num: detail.project_tel, display: this._maskTel(detail.project_tel), unlocked: false })
        if (detail.district_tel) tels.push({ label: '区住房保障', num: detail.district_tel, display: this._maskTel(detail.district_tel), unlocked: false })
        this.setData({ detail, countdownText, tels })
        // 24小时内已解锁过 → 显示完整电话
        if (this._isTelUnlockedRecently()) {
          const tels = this.data.tels.map(t =>
            Object.assign({}, t, { unlocked: true, display: t.num })
          )
          this.setData({ tels })
        }
        // 收藏状态
        this.loadFavoriteStatus()
        // 查询 VIP 状态（VIP 免广告直接看电话）
        market.getVipInfo().then((res) => {
          if (res && res.status === 0 && res.data && res.data.is_market_vip) this.setData({ isVip: true })
        })

        if (detail.latitude && detail.longitude) {
          const coordinate = { lat: detail.latitude, lng: detail.longitude }
          const marker = [{ id: 0, latitude: coordinate.lat, longitude: coordinate.lng, title: detail.name }]
          this.setData({ coordinate, marker })
        }
      }
      if (mRes.status === 0) {
        const mediaList = (mRes.data || []).map(m => m.url || m.local_path).filter(Boolean)
        this.setData({ mediaList })
      }
      this.setData({ loading: false })
    })
  },
  toggleRules() {
    this.setData({ expandedRules: !this.data.expandedRules })
  },
  _SHBZF_AD_KEY: 'shbzf_contact_ad_unlock',
  _isTelUnlockedRecently() {
    try {
      const ts = wx.getStorageSync(this._SHBZF_AD_KEY + '_' + this.data.id)
      return !!(ts && (Date.now() - ts) < 24 * 3600 * 1000)
    } catch (e) { return false }
  },
  _markTelUnlocked() {
    try {
      wx.setStorageSync(this._SHBZF_AD_KEY + '_' + this.data.id, Date.now())
    } catch (e) {}
  },
  tapTel(e) {
    const idx = e.currentTarget.dataset.index
    const tel = this.data.tels[idx]
    if (!tel) return
    if (tel.unlocked || this.data.isVip) { this.callNumber(tel.num); return }
    if (this._isTelUnlockedRecently()) { this._unlockAllTel(); return }
    wx.showModal({
      title: '联系电话',
      content: '观看完整广告后可获得联系电话（24小时内有效）',
      confirmText: '看广告',
      success: (res) => { if (res.confirm) this._showAd(idx) }
    })
  },
  _getAd() {
    if (this._ad) return this._ad
    if (!this.data.adUnitId || this.data.adUnitId.indexOf('xxxx') >= 0) return null
    this._ad = wx.createRewardedVideoAd({ adUnitId: this.data.adUnitId })
    this._ad.onError((err) => { console.log('激励视频广告错误', err) })
    this._ad.onClose((res) => {
      if (res && res.isEnded) {
        this._unlockAllTel()
      } else {
        wx.showToast({ title: '看完视频才能解锁', icon: 'none' })
      }
    })
    return this._ad
  },
  _showAd(idx) {
    this._pendingTelIdx = idx
    const ad = this._getAd()
    if (!ad) { wx.showToast({ title: '广告暂不可用', icon: 'none' }); return }
    ad.show().catch(() => {
      ad.load().then(() => ad.show()).catch(() => wx.showToast({ title: '广告加载失败', icon: 'none' }))
    })
  },
  _unlockAllTel() {
    this._markTelUnlocked()
    const tels = this.data.tels.map(t =>
      Object.assign({}, t, { unlocked: true, display: t.num })
    )
    this.setData({ tels })
    if (this._pendingTelIdx >= 0) {
      this.callNumber(tels[this._pendingTelIdx].num)
    }
    this._pendingTelIdx = -1
  },
  callNumber(tel) {
    if (tel) wx.makePhoneCall({ phoneNumber: tel, fail: () => {} })
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
    market.getFavoriteStatus(HOUSE_TYPE_SHBZF, this.data.id).then((res) => {
      if (res && res.status === 0) this.setData({ favorited: !!res.data.favorited })
    })
  },
  toggleFavorite() {
    if (!this._requireLogin()) return
    const fav = this.data.favorited
    const req = fav ? market.removeFavorite(HOUSE_TYPE_SHBZF, this.data.id) : market.addFavorite(HOUSE_TYPE_SHBZF, this.data.id)
    req.then((res) => {
      if (res && res.status === 0) {
        this.setData({ favorited: !fav })
        wx.showToast({ title: fav ? '已取消收藏' : '已收藏', icon: 'none' })
      } else if (res && res.msg) {
        wx.showToast({ title: res.msg, icon: 'none' })
      }
    })
  },
  onTapComment() {
    const cs = this.selectComponent('#comment-section')
    if (cs) cs.openInput()
  },
  openMapNavigator() {
    const coordinate = this.data.coordinate
    if (!coordinate.lat || !coordinate.lng) return
    const wxVersion = wx.getSystemInfoSync().SDKVersion
    if (utils.compareVersion(wxVersion, '2.14.0') < 0) {
      wx.showToast({ title: '当前微信版本过低，请升级后使用导航', icon: 'none' })
      return
    }
    wx.createMapContext('detailMap', this).openMapApp({
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      destination: this.data.detail.name,
      success: res => { console.log('openMapApp success', res) },
      fail: err => { console.log('openMapApp fail', err) }
    })
  },
  previewMedia(e) {
    wx.previewImage({ current: this.data.mediaList[e.currentTarget.dataset.idx], urls: this.data.mediaList })
  },

  onShareAppMessage() {
    const path = '/pages/shbzf/detail?id=' + this.data.id
    return {
      title: this.data.detail ? this.data.detail.name : '上海保租房',
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
