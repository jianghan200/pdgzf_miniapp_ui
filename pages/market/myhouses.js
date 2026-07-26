const market = require('../../utils/market')

const STATUS_MAP = {
  0: { text: '待审核', cls: 'status-pending' },
  1: { text: '已上架', cls: 'status-online' },
  2: { text: '已下架', cls: 'status-offline' },
  3: { text: '审核不通过', cls: 'status-rejected' },
  4: { text: '已下架', cls: 'status-offline' },
}

Page({
  data: {
    StatusBar: 0,
    list: [],
    loading: true,
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    this.loadList()
  },

  onShow() {
    // 每次显示重新加载（发布/编辑后刷新）
    this.loadList()
  },

  onPullDownRefresh() {
    this.loadList(() => wx.stopPullDownRefresh())
  },

  loadList(callback) {
    this.setData({ loading: true })
    market.getMyMarketHouses().then((res) => {
      if (res && res.status === 0) {
        const list = (res.data || []).map(h => ({
          ...h,
          statusInfo: STATUS_MAP[h.status] || { text: '未知', cls: '' },
        }))
        this.setData({ list })
      }
      this.setData({ loading: false })
      if (callback) callback()
    }).catch(() => {
      this.setData({ loading: false })
      if (callback) callback()
    })
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/market/detail?id=${id}` })
  },

  editHouse(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/market/publish?id=${id}` })
  },

  offlineHouse(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '下架确认',
      content: '确定要下架此房源吗？',
      success: (res) => {
        if (res.confirm) {
          market.offlineMarketHouse(id).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已下架', icon: 'success' })
              this.loadList()
            }
          })
        }
      }
    })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/market/publish' })
  },
})