const market = require('../../utils/market')

const STATUS_TEXT = {
  0: '待支付',
  1: '待确认',
  2: '已确认',
  3: '已完成',
  4: '已取消',
  5: '退款中',
  6: '已退款',
  7: '退款异常',
}

const STATUS_COLOR = {
  0: '#ff9500',
  1: '#0081ff',
  2: '#39b54a',
  3: '#39b54a',
  4: '#999',
  5: '#ff9500',
  6: '#999',
  7: '#e54d42',
}

Page({
  data: {
    role: 'tenant',
    status: '',
    page: 1,
    size: 20,
    total: 0,
    list: [],
    loading: false,
    noMore: false,
    statusText: STATUS_TEXT,
    statusColor: STATUS_COLOR,
    // 选时段弹层
    showConfirmSheet: false,
    confirmSlots: [],
    selectedSlotId: 0,
    confirmViewingId: 0,
  },

  onLoad(options) {
    const role = options.role || 'tenant'
    const status = options.status !== undefined ? options.status : ''
    wx.setNavigationBarTitle({ title: role === 'landlord' ? '我的预约（房东）' : '我的预约' })
    this.setData({ role, status })
    this.loadList(true)
  },

  switchRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ role, page: 1, list: [], noMore: false })
    wx.setNavigationBarTitle({ title: role === 'landlord' ? '我的预约（房东）' : '我的预约' })
    this.loadList(true)
  },

  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ status, page: 1, list: [], noMore: false })
    this.loadList(true)
  },

  onPullDownRefresh() {
    this.loadList(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loading) return
    this.loadList(false)
  },

  loadList(refresh) {
    const page = refresh ? 1 : this.data.page + 1
    this.setData({ loading: true })
    return market.getViewingList(this.data.role, this.data.status || undefined, page, this.data.size).then((res) => {
      if (res && res.status === 0 && res.data) {
        const data = res.data
        const newList = refresh ? data.list : this.data.list.concat(data.list)
        this.setData({
          list: newList,
          total: data.total,
          page: data.page,
          noMore: newList.length >= data.total,
        })
      }
      this.setData({ loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/viewing/detail?id=${id}` })
  },

  // 打开选时段弹层
  openConfirmSheet(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const index = parseInt(e.currentTarget.dataset.index)
    const item = this.data.list[index]
    if (!item || !item.slots || item.slots.length === 0) {
      // 没有时段数据，直接确认
      this._doConfirm(id, 0)
      return
    }
    // 默认选第一个
    this.setData({
      showConfirmSheet: true,
      confirmSlots: item.slots,
      selectedSlotId: item.slots[0].id,
      confirmViewingId: id,
    })
  },

  closeConfirmSheet() {
    this.setData({ showConfirmSheet: false })
  },

  selectSlot(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    this.setData({ selectedSlotId: id })
  },

  doConfirm() {
    if (!this.data.selectedSlotId) return
    const id = this.data.confirmViewingId
    const slotId = this.data.selectedSlotId
    this.closeConfirmSheet()
    this._doConfirm(id, slotId)
  },

  _doConfirm(id, slotId) {
    wx.showModal({
      title: '确认预约',
      content: slotId ? '确认同意该看房预约并选定此时段？' : '确认同意该看房预约吗？',
      success: (res) => {
        if (!res.confirm) return
        market.confirmViewing(id, slotId).then((r) => {
          if (r && r.status === 0) {
            wx.showToast({ title: '已确认', icon: 'success' })
            this.loadList(true)
          } else {
            wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },

  onCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消预约',
      content: '确定要取消该看房预约吗？',
      confirmColor: '#e54d42',
      success: (res) => {
        if (!res.confirm) return
        market.cancelViewing(id, '用户取消').then((r) => {
          if (r && r.status === 0) {
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadList(true)
          } else {
            wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },

  onComplete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '标记完成',
      content: '确认本次看房已完成？完成后押金将原路退还租客。',
      success: (res) => {
        if (!res.confirm) return
        market.completeViewing(id).then((r) => {
          if (r && r.status === 0) {
            wx.showToast({ title: '已完成', icon: 'success' })
            this.loadList(true)
          } else {
            wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },
})
