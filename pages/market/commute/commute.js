const market = require('../../../utils/market')

const TRANSPORT_OPTIONS = [
  { value: 'subway', label: '地铁', icon: 'subway' },
  { value: 'bus', label: '公交', icon: 'cart' },
  { value: 'bike', label: '骑行', icon: 'bike' },
  { value: 'walk', label: '步行', icon: 'footprint' },
  { value: 'drive', label: '驾车', icon: 'fill' }
]

const TIME_OPTIONS = [
  { value: 30, label: '30分钟内' },
  { value: 45, label: '45分钟内' },
  { value: 60, label: '1小时内' },
  { value: 90, label: '1.5小时内' }
]

Page({
  data: {
    StatusBar: 0,
    keyword: '',
    company: '',
    address: '',
    transport: 'subway',
    transportOptions: TRANSPORT_OPTIONS,
    maxMinutes: 45,
    timeOptions: TIME_OPTIONS,
    longitude: '',
    latitude: '',
    list: [],
    page: 1,
    size: 20,
    hasMore: true,
    loading: false,
    searched: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    if (options.keyword) this.setData({ keyword: decodeURIComponent(options.keyword), company: decodeURIComponent(options.keyword) })
  },

  onInputCompany(e) {
    this.setData({ company: e.detail.value })
  },

  onInputAddress(e) {
    this.setData({ address: e.detail.value })
  },

  onTransportTap(e) {
    this.setData({ transport: e.currentTarget.dataset.value })
  },

  onTimeChange(e) {
    const idx = e.detail.value
    this.setData({ maxMinutes: this.data.timeOptions[idx].value })
  },

  searchCompany() {
    const keyword = this.data.company.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入公司或地点', icon: 'none' })
      return
    }
    // 调起腾讯地图 POI 搜索
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/search',
      data: {
        keyword: keyword,
        boundary: 'region(上海,0)',
        page_size: 10,
        key: '2QUBZ-IJVWW-K6RRU-R7ANO-WSRSJ-PTBMG'
      },
      success: (res) => {
        if (res.data && res.data.status === 0 && res.data.data && res.data.data.length > 0) {
          const first = res.data.data[0]
          this.setData({
            company: first.title,
            address: first.address,
            longitude: first.location.lng,
            latitude: first.location.lat
          })
          this.loadList(true)
        } else {
          wx.showToast({ title: '未找到该地点', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '搜索失败', icon: 'none' })
    })
  },

  loadList(reset, cb) {
    if (this.data.loading) return
    if (!this.data.longitude || !this.data.latitude) return
    this.setData({ loading: true, searched: true })
    if (reset) this.setData({ page: 1, list: [], hasMore: true })

    const params = {
      page: this.data.page,
      size: this.data.size,
      sort: 'time',
      commute_lon: this.data.longitude,
      commute_lat: this.data.latitude,
      commute_transport: this.data.transport,
      commute_max_minutes: this.data.maxMinutes
    }

    market.getMarketList(params).then((res) => {
      if (res && res.status === 0) {
        const l = res.data.list || []
        this.setData({
          list: reset ? l : this.data.list.concat(l),
          hasMore: l.length >= this.data.size,
          page: this.data.page + 1
        })
      }
      this.setData({ loading: false })
      if (cb) cb()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadList(false)
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/market/detail?id=' + id })
  },

  goBack() { wx.navigateBack() }
})
