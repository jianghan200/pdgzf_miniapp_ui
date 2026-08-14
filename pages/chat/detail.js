const market = require('../../utils/market')

Page({
  data: {
    StatusBar: 0,
    convId: 0,
    conv: null,
    messages: [],
    inputText: '',
    page: 1,
    total: 0,
    hasMore: false,
    loading: false,
    myAvatar: ''
  },

  onLoad(options) {
    const s = wx.getSystemInfoSync()
    const app = getApp()
    this.setData({
      StatusBar: s.statusBarHeight,
      convId: parseInt(options.id),
      myAvatar: (app.globalData.userinfo && app.globalData.userinfo.wxAvatarUrl) || '/assets/user.png'
    })
    this.loadConversation()
  },

  onShow() {
    this.startPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  startPolling() {
    this.stopPolling()
    // 聊天页 5 秒轮询新消息，实现准实时
    this._timer = setInterval(() => {
      this.pollNewMessages()
    }, 5000)
  },

  stopPolling() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  loadConversation() {
    // 通过消息列表获取会话上下文（首屏）
    market.getChatMessages(this.data.convId, 1, 50).then((res) => {
      if (res && res.status === 0) {
        this.setData({
          conv: res.data.conversation || this.data.conv,
          messages: res.data.items || [],
          total: res.data.total,
          page: 1,
          hasMore: res.data.total > (res.data.items || []).length
        })
        this.scrollToBottom()
      }
      this.setData({ loading: false })
    })
  },

  // 轮询：拉最近一页，若总条数变化则刷新
  pollNewMessages() {
    market.getChatMessages(this.data.convId, 1, 50).then((res) => {
      if (res && res.status === 0) {
        const items = res.data.items || []
        const oldLen = this.data.messages.length
        if (items.length > oldLen) {
          this.setData({
            conv: res.data.conversation || this.data.conv,
            messages: items, total: res.data.total, hasMore: res.data.total > items.length
          })
          this.scrollToBottom()
        }
      }
    })
  },

  // 加载更早的消息（分页）
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ loading: true })
    const next = this.data.page + 1
    market.getChatMessages(this.data.convId, next, 50).then((res) => {
      if (res && res.status === 0) {
        const older = res.data.items || []
        this.setData({
          messages: older.concat(this.data.messages),
          page: next,
          total: res.data.total,
          hasMore: res.data.total > (next * 50)
        })
      }
      this.setData({ loading: false })
    })
  },

  onReachBottom() {
    this.loadMore()
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendText() {
    const text = this.data.inputText.trim()
    if (!text) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    this.send(text, 'text')
  },

  send(content, msgType) {
    market.sendChatMessage(this.data.convId, msgType, content).then((res) => {
      if (res && res.status === 0) {
        this.setData({ inputText: '' })
        this.loadConversation()
      } else {
        wx.showToast({ title: (res && res.msg) || '发送失败', icon: 'none' })
      }
    })
  },

  // 选择并发送图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        market.uploadChatImage(filePath).then((url) => {
          wx.hideLoading()
          if (url) {
            this.send(url, 'image')
          } else {
            wx.showToast({ title: '图片上传失败', icon: 'none' })
          }
        })
      }
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({ current: url, urls: [url] })
  },

  scrollToBottom() {
    wx.nextTick(() => {
      const query = wx.createSelectorQuery().in(this)
      query.select('#chat-body').boundingClientRect((rect) => {
        wx.pageScrollTo({ scrollTop: 99999, duration: 0 })
      }).exec()
    })
  },

  goHouse() {
    if (this.data.conv && this.data.conv.house_id) {
      wx.navigateTo({ url: `/pages/market/detail?id=${this.data.conv.house_id}` })
    }
  }
})
