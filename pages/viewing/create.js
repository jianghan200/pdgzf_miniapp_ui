// 看房预约 - 创建页（多时段）
const market = require('../../utils/market')
const pay = require('../../utils/pay')

Page({
  data: {
    houseId: 0,
    houseTitle: '',
    slots: [], // [{date, time}]
    remark: '',
    minDate: '',
    depositFee: 20,
    viewingFee: 2,
    totalFee: 22,
    isVip: false,
    submitting: false,
  },

  onLoad(options) {
    const houseId = parseInt(options.house_id || 0)
    const houseTitle = decodeURIComponent(options.title || '')
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000)
    const dateStr = tomorrow.toISOString().split('T')[0]
    const minDate = now.toISOString().split('T')[0]
    this.setData({
      houseId,
      houseTitle,
      minDate,
      slots: [{ date: dateStr, time: '10:00' }],
    })
    this._loadVipStatus()
  },

  _loadVipStatus() {
    market.getVipInfo().then((res) => {
      if (res && res.status === 0 && res.data) {
        const info = res.data
        const isVip = info.tenant_vip && info.tenant_vip.is_vip
        const viewingFee = isVip ? 0 : 2
        const totalFee = 20 + viewingFee
        this.setData({ isVip, viewingFee, totalFee })
      }
    })
  },

  addSlot() {
    if (this.data.slots.length >= 3) return
    // 默认下一个时段+2小时
    const last = this.data.slots[this.data.slots.length - 1]
    const slots = [...this.data.slots, { date: last.date, time: '14:00' }]
    this.setData({ slots })
  },

  deleteSlot(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    if (this.data.slots.length <= 1) return
    const slots = this.data.slots.filter((_, i) => i !== idx)
    this.setData({ slots })
  },

  onSlotDateChange(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    const slots = this.data.slots.map((s, i) =>
      i === idx ? { ...s, date: e.detail.value } : s
    )
    this.setData({ slots })
  },

  onSlotTimeChange(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    const slots = this.data.slots.map((s, i) =>
      i === idx ? { ...s, time: e.detail.value } : s
    )
    this.setData({ slots })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  submit() {
    if (this.data.submitting) return
    const { houseId, slots, remark } = this.data

    if (!slots || slots.length < 1) {
      wx.showToast({ title: '请至少选择1个时段', icon: 'none' })
      return
    }
    if (slots.length > 3) {
      wx.showToast({ title: '最多选择3个时段', icon: 'none' })
      return
    }

    // 校验每个时段都有效且提前30分钟
    const slotTimes = []
    const nowTs = Date.now()
    for (const s of slots) {
      if (!s.date || !s.time) {
        wx.showToast({ title: '请完善所有时段', icon: 'none' })
        return
      }
      const dt = new Date(`${s.date} ${s.time}:00`.replace(/-/g, '/'))
      if (dt.getTime() - nowTs < 30 * 60 * 1000) {
        wx.showToast({ title: '预约需至少提前30分钟', icon: 'none' })
        return
      }
      slotTimes.push(`${s.date} ${s.time}:00`)
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '创建订单...' })

    pay.payViewing(houseId, slotTimes, remark).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '预约成功', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/viewing/list?role=tenant' })
      }, 1500)
    }).catch((err) => {
      wx.hideLoading()
      this.setData({ submitting: false })
      const msg = (err && err.msg) || '支付失败，请重试'
      wx.showToast({ title: msg, icon: 'none' })
    })
  },
})
