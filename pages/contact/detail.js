const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, id: 0, detail: null, replyText: '', loading: true },
  onLoad(options) { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight, id: options.id }); this.loadDetail() },
  loadDetail() {
    market.getContactDetail(this.data.id).then((res) => {
      if (res && res.status === 0) this.setData({ detail: res.data })
      this.setData({ loading: false })
    })
  },
  onReplyInput(e) { this.setData({ replyText: e.detail.value }) },
  sendReply() {
    if (!this.data.replyText.trim()) { wx.showToast({ title: '请输入回复', icon: 'none' }); return }
    market.replyContact(this.data.id, this.data.replyText).then((res) => {
      if (res && res.status === 0) { wx.showToast({ title: '已回复', icon: 'success' }); this.setData({ replyText: '' }); this.loadDetail() }
    })
  }
})
