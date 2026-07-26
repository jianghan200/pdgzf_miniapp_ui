const market = require('../../utils/market')

Page({
  data: {
    StatusBar: 0,
    list: [],
    page: 1,
    size: 20,
    hasMore: true,
    loading: false,
    filters: {
      district: '',
      rent_min: '',
      rent_max: '',
      bedrooms: '',
      only_certified: 0,
      sort: 'time'
    },
    districts: ['全部', '浦东新区', '徐汇区', '闵行区', '杨浦区', '长宁区', '黄浦区', '静安区', '普陀区', '虹口区'],
    districtIndex: 0,
    sortOptions: ['最新发布', '价格低到高', '价格高到低'],
    sortIndex: 0,
    showFilter: false,
    keyword: ''
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    this.loadList(true)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onPullDownRefresh() {
    this.loadList(true, () => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList(false)
    }
  },

  loadList(reset, callback) {
    if (this.data.loading) return
    this.setData({ loading: true })
    if (reset) {
      this.setData({ page: 1, list: [], hasMore: true })
    }

    const params = {
      page: this.data.page,
      size: this.data.size,
      sort: this.data.sort
    }
    const f = this.data.filters
    if (f.district) params.district = f.district
    if (f.rent_min) params.rent_min = f.rent_min
    if (f.rent_max) params.rent_max = f.rent_max
    if (f.bedrooms) params.bedrooms = f.bedrooms
    if (f.only_certified) params.only_certified = 1
    if (this.data.keyword) params.keyword = this.data.keyword

    market.getMarketList(params).then((res) => {
      if (res && res.status === 0) {
        const newList = res.data.list || []
        this.setData({
          list: reset ? newList : this.data.list.concat(newList),
          hasMore: newList.length >= this.data.size,
          page: this.data.page + 1
        })
      }
      this.setData({ loading: false })
      if (callback) callback()
    })
  },

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  onDistrictChange(e) {
    const idx = e.detail.value
    this.setData({
      districtIndex: idx,
      'filters.district': idx === 0 ? '' : this.data.districts[idx]
    })
  },

  onSortChange(e) {
    const idx = e.detail.value
    const sortMap = ['time', 'rent_asc', 'rent_desc']
    this.setData({
      sortIndex: idx,
      sort: sortMap[idx]
    })
  },

  onRentMinInput(e) {
    this.setData({ 'filters.rent_min': e.detail.value })
  },

  onRentMaxInput(e) {
    this.setData({ 'filters.rent_max': e.detail.value })
  },

  onBedroomsChange(e) {
    this.setData({ 'filters.bedrooms': e.detail.value })
  },

  toggleCertified() {
    this.setData({ 'filters.only_certified': this.data.filters.only_certified ? 0 : 1 })
  },

  applyFilter() {
    this.setData({ showFilter: false })
    this.loadList(true)
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadList(true)
  },

  resetFilter() {
    this.setData({
      districtIndex: 0,
      sortIndex: 0,
      sort: 'time',
      'filters.district': '',
      'filters.rent_min': '',
      'filters.rent_max': '',
      'filters.bedrooms': '',
      'filters.only_certified': 0
    })
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/market/detail?id=${id}` })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/market/publish' })
  }
})
