const market = require('../../utils/market')

Page({
  data: {
    StatusBar: 0,
    list: [],
    page: 1,
    size: 20,
    hasMore: true,
    loading: false,
    keyword: '',
    // 区域树状筛选
    openDrawer: false,
    districtTree: [],
    selectedDistrictIds: [],
    selectedBizcircleIds: [],
    selectedCount: 0,
    // 户型筛选（多选）
    roomTypes: ['一居室', '二居室', '三居室', '四居室及以上'],
    chosenRoomTypes: [],
    // 价格区间筛选（单选）
    priceIntervals: [
      { label: '3000以下', min: 0, max: 3000 },
      { label: '3000-5000', min: 3000, max: 5000 },
      { label: '5000-8000', min: 5000, max: 8000 },
      { label: '8000-12000', min: 8000, max: 12000 },
      { label: '12000以上', min: 12000, max: 999999 }
    ],
    chosenPriceIndex: -1
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    this.loadDistricts()
    this.loadList(true)
  },

  loadDistricts() {
    market.getShbzfMapAggregate().then((res) => {
      if (!res || res.status !== 0 || !res.data) return
      const districts = res.data.districts || []
      const bizcircles = res.data.bizcircles || []
      // 按 district_id 归组街镇到对应区
      const bizByDistrict = {}
      bizcircles.forEach((b) => {
        const key = b.district_id
        if (!bizByDistrict[key]) bizByDistrict[key] = []
        bizByDistrict[key].push({
          id: b.id,
          name: b.name,
          project_count: b.project_count || 0,
          checked: false
        })
      })
      const tree = districts.map((d) => ({
        id: d.id,
        name: d.name,
        project_count: d.project_count || 0,
        expanded: false,
        checked: false,
        children: bizByDistrict[d.id] || []
      }))
      this.setData({ districtTree: tree })
    })
  },

  onPullDownRefresh() {
    this.loadList(true, () => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadList(false)
  },

  loadList(reset, cb) {
    if (this.data.loading) return
    this.setData({ loading: true })
    if (reset) this.setData({ page: 1, list: [], hasMore: true })
    const params = { page: this.data.page, size: this.data.size }
    if (this.data.selectedDistrictIds.length) {
      params.map_district_id = this.data.selectedDistrictIds.join(',')
    }
    if (this.data.selectedBizcircleIds.length) {
      params.map_business_area_id = this.data.selectedBizcircleIds.join(',')
    }
    if (this.data.chosenRoomTypes.length) {
      params.house_types = this.data.chosenRoomTypes.join(',')
    }
    if (this.data.chosenPriceIndex >= 0) {
      params.rent_min = this.data.priceIntervals[this.data.chosenPriceIndex].min
      params.rent_max = this.data.priceIntervals[this.data.chosenPriceIndex].max
    }
    if (this.data.keyword) params.keyword = this.data.keyword
    market.getShbzfList(params).then((res) => {
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

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadList(true)
  },

  // ===== 区域筛选 drawer =====
  openFilterDrawer() {
    // 打开前同步当前选中状态到 tree（用于展示）
    this._syncTreeFromSelection()
    // 保存户型/价格的已应用状态，取消时恢复
    this._appliedRoomTypes = this.data.chosenRoomTypes.slice()
    this._appliedPriceIndex = this.data.chosenPriceIndex
    this.setData({ openDrawer: true })
  },

  closeFilterDrawer() {
    // 点遮罩/关闭 = 取消，恢复到已应用状态
    this._syncTreeFromSelection()
    this.setData({
      openDrawer: false,
      chosenRoomTypes: this._appliedRoomTypes || [],
      chosenPriceIndex: this._appliedPriceIndex !== undefined ? this._appliedPriceIndex : -1
    })
  },

  toggleDistrict(e) {
    const id = e.currentTarget.dataset.id
    const tree = this.data.districtTree.map((d) => {
      if (d.id === id) return Object.assign({}, d, { expanded: !d.expanded })
      return d
    })
    this.setData({ districtTree: tree })
  },

  tapDistrict(e) {
    const id = e.currentTarget.dataset.id
    const tree = this.data.districtTree.map((d) => {
      if (d.id === id) return Object.assign({}, d, { checked: !d.checked })
      return d
    })
    this.setData({ districtTree: tree })
  },

  tapBizcircle(e) {
    const id = e.currentTarget.dataset.id
    const tree = this.data.districtTree.map((d) => {
      if (!d.children) return d
      const children = d.children.map((b) => {
        if (b.id === id) return Object.assign({}, b, { checked: !b.checked })
        return b
      })
      return Object.assign({}, d, { children })
    })
    this.setData({ districtTree: tree })
  },

  selectAll() {
    // 清空所有勾选（区域+户型+价格）
    const tree = this.data.districtTree.map((d) => {
      const children = (d.children || []).map((b) => Object.assign({}, b, { checked: false }))
      return Object.assign({}, d, { checked: false, children })
    })
    this.setData({
      districtTree: tree,
      chosenRoomTypes: [],
      chosenPriceIndex: -1
    })
  },

  resetFilter() {
    this.selectAll()
  },

  applyFilter() {
    // 根据 tree 当前勾选状态计算选中集合
    const selectedDistrictIds = []
    const selectedBizcircleIds = []
    this.data.districtTree.forEach((d) => {
      if (d.checked) selectedDistrictIds.push(d.id)
      ;(d.children || []).forEach((b) => {
        if (b.checked) selectedBizcircleIds.push(b.id)
      })
    })
    const selectedCount = selectedDistrictIds.length
      + selectedBizcircleIds.length
      + this.data.chosenRoomTypes.length
      + (this.data.chosenPriceIndex >= 0 ? 1 : 0)
    this.setData({
      selectedDistrictIds,
      selectedBizcircleIds,
      selectedCount,
      openDrawer: false
    })
    this.loadList(true)
  },

  _syncTreeFromSelection() {
    const dSet = new Set(this.data.selectedDistrictIds)
    const bSet = new Set(this.data.selectedBizcircleIds)
    const tree = this.data.districtTree.map((d) => {
      const checked = dSet.has(d.id)
      const children = (d.children || []).map((b) => Object.assign({}, b, { checked: bSet.has(b.id) }))
      return Object.assign({}, d, { checked, children })
    })
    this.setData({ districtTree: tree })
  },

  tapRoomType(e) {
    const t = e.currentTarget.dataset.type
    const cur = this.data.chosenRoomTypes
    const idx = cur.indexOf(t)
    const next = idx === -1 ? cur.concat([t]) : cur.filter((x) => x !== t)
    this.setData({ chosenRoomTypes: next })
  },

  tapPriceInterval(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    // 再次点击已选中的 -> 取消
    this.setData({ chosenPriceIndex: this.data.chosenPriceIndex === idx ? -1 : idx })
  },

  openDetail(e) {
    wx.navigateTo({ url: `/pages/shbzf/detail?id=${e.currentTarget.dataset.id}` })
  },

  openMap() {
    wx.navigateTo({ url: '/pages/shbzf/map' })
  },

  onShareAppMessage() {
    return {
      title: '上海保租房',
      path: '/pages/login/login',
      imageUrl: '',
      success(res) { if (res.errMsg === 'shareAppMessage:ok') wx.showToast({ title: '转发成功', icon: 'success' }) },
      fail(err) {
        if (err.errMsg === 'shareAppMessage:fail cancel') wx.showToast({ title: '转发已取消' })
        else wx.showToast({ title: '转发失败' })
      }
    }
  }
})
