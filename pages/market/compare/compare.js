const market = require('../../../utils/market')

const COMPARE_STORAGE_KEY = 'compare_house_ids'

Page({
  data: {
    StatusBar: 0,
    houseIds: [],
    list: [],
    loading: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    this.loadCompareList()
  },

  onShow() {
    this.loadCompareList()
  },

  loadCompareList() {
    const ids = wx.getStorageSync(COMPARE_STORAGE_KEY) || []
    const uniqueIds = ids.map(id => parseInt(id)).filter(id => id > 0)
    if (uniqueIds.length === 0) {
      this.setData({ houseIds: [], list: [] })
      return
    }
    this.setData({ houseIds: uniqueIds, loading: true })
    market.getMarketCompare(uniqueIds).then((res) => {
      if (res && res.status === 0 && res.data) {
        const list = (res.data.list || []).map(item => ({
          ...item,
          rent_display: item.rent_display || (item.rent ? '¥' + item.rent : '价格待定'),
          available_date_display: item.available_date_display || item.available_date_fuzzy || item.available_date || '待定'
        }))
        this.setData({ list })
      }
      this.setData({ loading: false })
    }).catch(() => this.setData({ loading: false }))
  },

  removeItem(e) {
    const id = e.currentTarget.dataset.id
    let ids = wx.getStorageSync(COMPARE_STORAGE_KEY) || []
    ids = ids.filter(i => parseInt(i) !== parseInt(id))
    wx.setStorageSync(COMPARE_STORAGE_KEY, ids)
    this.loadCompareList()
  },

  clearAll() {
    wx.showModal({
      title: '清空对比',
      content: '确定清空所有对比房源？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync(COMPARE_STORAGE_KEY, [])
          this.loadCompareList()
        }
      }
    })
  },

  goList() {
    wx.switchTab({ url: '/pages/market/list' })
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/market/detail?id=' + id })
  },

  goBack() { wx.navigateBack() }
})
