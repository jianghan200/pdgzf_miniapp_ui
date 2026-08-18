const market = require('../../utils/market')

const SOURCE_TYPE_MAP = {
  owner: '房东直租',
  roommate: '合租找室友',
  sublet: '转租',
  apt: '公寓直租'
}

const RENT_TYPE_MAP = {
  whole: '整租',
  share: '合租',
  bed: '床位'
}

const PROPERTY_TYPE_MAP = {
  commercial: '商品房',
  relocation: '安置房',
  affordable: '经济适用房',
  civilian: '民房',
  apartment: '公寓',
  talent_apt: '人才公寓',
  bao_rent: '保租房',
  public_rent: '公租房',
  other: '其他'
}

const formatRelativeTime = (timeStr) => {
  if (!timeStr) return ''
  const t = new Date(timeStr.replace(/-/g, '/')).getTime()
  if (isNaN(t)) return timeStr
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return min + '分钟前'
  const hour = Math.floor(min / 60)
  if (hour < 24) return hour + '小时前'
  const day = Math.floor(hour / 24)
  if (day < 7) return day + '天前'
  const d = new Date(t)
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  return `${mm}-${dd}`
}

const preprocessItem = (item) => {
  const sourceType = item.source_type || 'owner'
  const rentType = item.rent_type || 'whole'
  return {
    ...item,
    source_type_label: SOURCE_TYPE_MAP[sourceType] || '房东直租',
    rent_type_label: RENT_TYPE_MAP[rentType] || '整租',
    property_type_label: PROPERTY_TYPE_MAP[item.property_type] || '',
    building_type_label: item.building_type_label || '',
    rent_display: item.rent_display || (item.rent ? '¥' + item.rent : item.is_negotiable ? '面议' : '价格待定'),
    available_date_display: item.available_date_display || item.available_date || '入住时间待定',
    time_display: formatRelativeTime(item.online_time_str || item.created_at || item.publish_time)
  }
}

Page({
  data: {
    StatusBar: 0,
    list: [],
    page: 1,
    size: 20,
    hasMore: true,
    loading: false,
    keyword: '',
    filters: {
      district: '',
      rent_min: '',
      rent_max: '',
      bedrooms: '',
      rent_type: '',
      rent_source: '',
      room_shape: '',
      move_in: '',
      subway_line: '',
      subway_station: '',
      property_type: '',
      building_type: '',
      has_private_bathroom: 0,
      pet_friendly: 0,
      civil_meters: 0,
      elevator: 0,
      south: 0,
      gas: 0,
      private_kitchen: 0,
      not_first_floor: 0,
      not_top_floor: 0,
      not_basement: 0,
      not_attic: 0,
      sort: 'time'
    },
    districts: ['全部', '浦东新区', '徐汇区', '闵行区', '杨浦区', '长宁区', '黄浦区', '静安区', '普陀区', '虹口区', '宝山区', '嘉定区', '青浦区', '松江区', '奉贤区', '金山区', '崇明区'],
    districtIndex: 0,
    sortOptions: ['最新发布', '价格低到高', '价格高到低'],
    sortIndex: 0,
    showFilter: false,
    // 抽屉内临时状态，点击确定后才写入 filters
    draftFilters: {},
    // 快捷标签展示
    quickTags: [
      { key: 'rent_type', value: 'whole', label: '整租' },
      { key: 'rent_type', value: 'share', label: '合租' },
      { key: 'elevator', value: 1, label: '电梯' },
      // { key: 'has_private_bathroom', value: 1, label: '独卫' },
      { key: 'pet_friendly', value: 1, label: '可养宠' },
      { key: 'civil_meters', value: 1, label: '民水民电' },
      
    ]
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight, draftFilters: { ...this.data.filters } })
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
    if (f.rent_type) params.rent_type = f.rent_type
    if (f.rent_source) params.rent_source = f.rent_source
    if (f.room_shape) params.room_shape = f.room_shape
    if (f.move_in) params.move_in = f.move_in
    if (f.subway_line) params.subway_line = f.subway_line
    if (f.subway_station) params.subway_station = f.subway_station
    if (f.property_type) params.property_type = f.property_type
    if (f.building_type) params.building_type = f.building_type
    if (f.has_private_bathroom) params.has_private_bathroom = 1
    if (f.pet_friendly) params.pet_friendly = 1
    if (f.civil_meters) params.civil_meters = 1
    if (f.elevator) params.elevator = 1
    if (f.south) params.south = 1
    if (f.gas) params.gas = 1
    if (f.private_kitchen) params.private_kitchen = 1
    if (f.not_first_floor) params.not_first_floor = 1
    if (f.not_top_floor) params.not_top_floor = 1
    if (f.not_basement) params.not_basement = 1
    if (f.not_attic) params.not_attic = 1
    if (this.data.keyword) params.keyword = this.data.keyword

    market.getMarketList(params).then((res) => {
      if (res && res.status === 0) {
        const newList = (res.data.list || []).map(preprocessItem)
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

  // ===== 搜索 =====
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadList(true)
  },

  onSearchConfirm(e) {
    const keyword = (e.detail.value || '').trim()
    if (!keyword) return
    // 地铁线路匹配
    if (/^\d+号线$/.test(keyword) || keyword.includes('号线')) {
      wx.navigateTo({ url: '/pages/market/subway/subway?line=' + encodeURIComponent(keyword) })
      return
    }
    // 公司/大厦通勤搜索
    if (/(公司|大厦|中心|广场|科技园|产业园|写字楼)$/.test(keyword)) {
      wx.navigateTo({ url: '/pages/market/commute/commute?keyword=' + encodeURIComponent(keyword) })
      return
    }
    this.setData({ keyword })
    this.loadList(true)
  },

  // ===== 快捷标签 =====
  onQuickTagTap(e) {
    const { key, value } = e.currentTarget.dataset
    const current = this.data.filters[key]
    const next = (current == value) ? '' : value
    this.setData({ [`filters.${key}`]: next }, () => this.loadList(true))
  },

  // ===== 维度入口 =====
  goSubwaySearch() {
    wx.navigateTo({ url: '/pages/market/subway/subway' })
  },
  goCommuteSearch() {
    wx.navigateTo({ url: '/pages/market/commute/commute' })
  },
  goMapSearch() {
    wx.navigateTo({ url: '/pages/map/map?mode=market' })
  },
  goCompare() {
    wx.navigateTo({ url: '/pages/market/compare/compare' })
  },

  // ===== 筛选抽屉 =====
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter, draftFilters: { ...this.data.filters } })
  },

  closeFilter() {
    this.setData({ showFilter: false })
  },

  onDistrictChange(e) {
    const idx = e.detail.value
    const val = idx === 0 ? '' : this.data.districts[idx]
    this.setData({ districtIndex: idx, 'filters.district': val }, () => this.loadList(true))
  },

  onSortChange(e) {
    const idx = e.detail.value
    const sortMap = ['time', 'rent_asc', 'rent_desc']
    this.setData({ sortIndex: idx, sort: sortMap[idx] }, () => this.loadList(true))
  },

  onDraftRentMinInput(e) { this.setData({ 'draftFilters.rent_min': e.detail.value }) },
  onDraftRentMaxInput(e) { this.setData({ 'draftFilters.rent_max': e.detail.value }) },

  // 抽屉内单选标签
  setDraftSingle(e) {
    const { field, value } = e.currentTarget.dataset
    const cur = this.data.draftFilters[field]
    this.setData({ [`draftFilters.${field}`]: cur === value ? '' : value })
  },

  // 抽屉内互斥标签（bedrooms / room_shape）
  setDraftMutex(e) {
    const { field, value } = e.currentTarget.dataset
    this.setData({ [`draftFilters.${field}`]: value })
  },

  // 抽屉内开关标签
  toggleDraftFlag(e) {
    const field = e.currentTarget.dataset.field
    const cur = this.data.draftFilters[field] ? 1 : 0
    this.setData({ [`draftFilters.${field}`]: cur ? 0 : 1 })
  },

  applyFilter() {
    this.setData({ filters: { ...this.data.draftFilters }, showFilter: false }, () => this.loadList(true))
  },

  resetFilter() {
    const empty = {
      district: '',
      rent_min: '',
      rent_max: '',
      bedrooms: '',
      rent_type: '',
      rent_source: '',
      room_shape: '',
      move_in: '',
      subway_line: '',
      subway_station: '',
      property_type: '',
      building_type: '',
      has_private_bathroom: 0,
      pet_friendly: 0,
      civil_meters: 0,
      elevator: 0,
      south: 0,
      gas: 0,
      private_kitchen: 0,
      not_first_floor: 0,
      not_top_floor: 0,
      not_basement: 0,
      not_attic: 0,
      sort: this.data.sort
    }
    this.setData({ draftFilters: empty, districtIndex: 0 })
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/market/detail?id=${id}` })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/market/publish' })
  },

  onShareAppMessage() {
    return {
      title: 'PD租房 - 真实房源',
      path: '/pages/login/login?redirect=' + encodeURIComponent('/pages/market/list'),
      imageUrl: '',
      success(res) { if (res.errMsg === 'shareAppMessage:ok') wx.showToast({ title: '转发成功', icon: 'success' }) },
      fail(err) {
        if (err.errMsg === 'shareAppMessage:fail cancel') wx.showToast({ title: '转发已取消' })
        else wx.showToast({ title: '转发失败' })
      }
    }
  }
})
