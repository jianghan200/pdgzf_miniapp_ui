const market = require('../../utils/market')

Page({
  data: {
    StatusBar: 0,
    list: [],
    loading: false,
    houseId: 0
  },

  onLoad(options) {
    const s = wx.getSystemInfoSync()
    this.setData({ StatusBar: s.statusBarHeight, houseId: (options && options.house_id) ? parseInt(options.house_id) : 0 })
  },

  onShow() {
    this.loadList()
    // 前台每 8 秒轮询一次未读数/会话列表，实现准实时
    this.stopPolling()
    this._timer = setInterval(() => this.loadList(), 8000)
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  stopPolling() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  loadList() {
    // 带 house_id 时按房源查询（房东视角），否则查我的全部会话
    const req = this.data.houseId
      ? market.getChatConversationsByHouse(this.data.houseId)
      : market.getChatConversations()
    req.then((res) => {
      if (res && res.status === 0) {
        this.setData({ list: res.data || [] })
        this.refreshBadge()
      }
    })
  },

  // 刷新首页 tab 未读角标（通过页面通信或 storage）
  refreshBadge() {
    const total = (this.data.list || []).reduce((sum, c) => sum + (c.unread || 0), 0)
    wx.setStorageSync('chat_unread', total)
    // 通知 tabBar 页面刷新角标（如"我的"页）
    try {
      const pages = getCurrentPages()
      pages.forEach(p => {
        if (p && typeof p.onChatUnread === 'function') p.onChatUnread(total)
      })
    } catch (e) { /* ignore */ }
  },

  openChat(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/chat/detail?id=${id}` })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除会话',
      content: '将删除与该用户的聊天记录（仅自己可见），确定？',
      success: (r) => {
        if (r.confirm) {
          market.deleteChatConversation(id).then((res) => {
            if (res && res.status === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadList()
            }
          })
        }
      }
    })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/market/list' })
  }
})
