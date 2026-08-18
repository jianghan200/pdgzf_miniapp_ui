const market = require('../../utils/market')

Page({
  data: {
    StatusBar: 0,
    convId: 0,
    fromHouse: false,
    conv: null,
    messages: [],
    inputText: '',
    page: 1,
    total: 0,
    hasMore: false,
    loading: false,
    myAvatar: '',
    scrollToId: '',
    isLandlord: false,
    viewingEnabled: true, // 全局预约看房功能开关
    viewingStatusText: {0:'待支付',1:'待确认',2:'待租客确认',3:'已完成',4:'已取消',5:'退款中',6:'已退款',7:'异常',8:'双方已确认',9:'租客爽约'},
    viewingStatusClass: {1:'orange',2:'blue',3:'gray',4:'red',8:'green',9:'red'},
  },

  onLoad(options) {
    const s = wx.getSystemInfoSync()
    const app = getApp()
    this.setData({
      StatusBar: s.statusBarHeight,
      convId: parseInt(options.id),
      fromHouse: options.from_house === '1',
      myAvatar: (app.globalData.userinfo && app.globalData.userinfo.wxAvatarUrl) || '/assets/user.png'
    })
    this.loadConversation()
    this.loadContactConfig()
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

  loadContactConfig() {
    market.getContactConfig().then((res) => {
      if (res && res.status === 0 && res.data) {
        const viewingEnabled = res.data.viewing_enabled !== false
        this.setData({ viewingEnabled })
      }
    })
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
        const app = getApp()
        const myId = app.globalData.userinfo && app.globalData.userinfo.id
        const conv = res.data.conversation || this.data.conv
        // 判断当前用户是否为房东（owner）
        const isLandlord = myId && conv && conv.owner_id === myId
        const items = this._parseViewingCards(res.data.items || [])
        this.setData({
          conv: conv,
          messages: items,
          total: res.data.total,
          page: 1,
          hasMore: res.data.total > (res.data.items || []).length,
          isLandlord: !!isLandlord,
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
        const items = this._parseViewingCards(res.data.items || [])
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
      // 用最后一条消息的 id 作为 scroll-into-view 目标
      const msgs = this.data.messages
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1]
        this.setData({ scrollToId: '' })
        wx.nextTick(() => {
          this.setData({ scrollToId: `msg-${lastMsg.id}` })
        })
      }
    })
  },

  goHouse() {
    if (this.data.conv && this.data.conv.house_id) {
      if (this.data.fromHouse) {
        // 从房源详情进入，直接返回不额外建栈
        wx.navigateBack({ delta: 1 })
      } else {
        wx.navigateTo({ url: `/pages/market/detail?id=${this.data.conv.house_id}` })
      }
    }
  },

  // 预约看房
  createViewing() {
    const app = getApp()
    if (!app.globalData.userinfo || !app.globalData.userinfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!this.data.conv || !this.data.conv.house_id) {
      wx.showToast({ title: '暂无关联房源', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/viewing/create?house_id=${this.data.conv.house_id}&conv_id=${this.data.convId}&title=${encodeURIComponent(this.data.conv.house_title || '')}`
    })
  },

  // ========== 看房卡片 ==========

  _parseViewingCards(items) {
    // 将 viewing_card 类型的 content (JSON) 解析为 viewing_card 对象
    return (items || []).map(function(item) {
      if (item.msg_type === 'viewing_card' && typeof item.content === 'string') {
        try {
          item.viewing_card = JSON.parse(item.content)
        } catch(e) {
          item.viewing_card = null
        }
      }
      return item
    })
  },

  cardStatusText(status) {
    const map = this.data.viewingStatusText || {}
    return map[status] || '未知'
  },

  cardStatusClass(status) {
    const map = this.data.viewingStatusClass || {}
    return map[status] || 'gray'
  },

  showCardActions(item) {
    // 只有最新的一张卡片显示操作按钮
    if (!item || !item.viewing_card) return false
    const msgs = this.data.messages || []
    // 找到最后一张 viewing_card 的 id
    let lastCardId = 0
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].msg_type === 'viewing_card') {
        lastCardId = msgs[i].id
        break
      }
    }
    return item.id === lastCardId
  },

  onViewingAction(e) {
    const action = e.currentTarget.dataset.action
    const viewingId = parseInt(e.currentTarget.dataset.viewingId)
    if (!viewingId) return

    const app = getApp()
    const myId = app.globalData.userinfo && app.globalData.userinfo.id
    if (!myId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    if (action === 'confirm') {
      // 打开时段选择弹层
      this._openSlotPicker(viewingId)
    } else if (action === 'counter_propose') {
      this._counterPropose(viewingId)
    } else if (action === 'tenant_confirm') {
      wx.showModal({
        title: '确认看房时间',
        content: '确定接受这个看房时间吗？确认后将展示双方联系方式。',
        success: (res) => {
          if (!res.confirm) return
          market.tenantConfirmViewing(viewingId).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已确认', icon: 'success' })
              this.loadConversation()
            } else {
              wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
            }
          })
        }
      })
    } else if (action === 'complete') {
      wx.showModal({
        title: '标记完成',
        content: '确认本次看房已完成？完成后押金将原路退还租客。',
        success: (res) => {
          if (!res.confirm) return
          market.completeViewing(viewingId).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已完成', icon: 'success' })
              this.loadConversation()
            } else {
              wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
            }
          })
        }
      })
    } else if (action === 'no_show') {
      wx.showModal({
        title: '标记租客爽约',
        content: '确认租客未到场？押金将不退还。',
        confirmColor: '#e54d42',
        success: (res) => {
          if (!res.confirm) return
          market.markNoShow(viewingId).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已标记', icon: 'success' })
              this.loadConversation()
            } else {
              wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
            }
          })
        }
      })
    } else if (action === 'cancel') {
      wx.showModal({
        title: '取消预约',
        content: '确定取消该看房预约？',
        confirmColor: '#e54d42',
        success: (res) => {
          if (!res.confirm) return
          market.cancelViewing(viewingId, '用户取消').then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadConversation()
            } else {
              wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
            }
          })
        }
      })
    } else if (action === 'report') {
      this._reportViewing(viewingId)
    }
  },

  // 打开时段选择弹层（房东确认时选一个时段）
  _openSlotPicker(viewingId) {
    // 从消息中找到 viewing_id 对应的卡片数据
    const msgs = this.data.messages || []
    let slots = []
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].msg_type === 'viewing_card' && msgs[i].viewing_card && msgs[i].viewing_card.viewing_id === viewingId) {
        slots = msgs[i].viewing_card.slots || []
        break
      }
    }
    if (!slots || slots.length === 0) {
      // 没有时段数据，直接确认
      wx.showModal({
        title: '确认预约',
        content: '确认同意该看房预约吗？',
        success: (res) => {
          if (!res.confirm) return
          market.confirmViewing(viewingId, 0).then((r) => {
            if (r && r.status === 0) {
              wx.showToast({ title: '已确认', icon: 'success' })
              this.loadConversation()
            } else {
              wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
            }
          })
        }
      })
      return
    }
    // 使用 picker 选择时段
    const slotTexts = slots.map(function(s) { return s.slot_time })
    const that = this
    wx.showActionSheet({
      itemList: slotTexts,
      success(res) {
        const slotId = slots[res.tapIndex] ? slots[res.tapIndex].id : 0
        market.confirmViewing(viewingId, slotId).then((r) => {
          if (r && r.status === 0) {
            wx.showToast({ title: '已确认', icon: 'success' })
            that.loadConversation()
          } else {
            wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 房东反提议新时间
  _counterPropose(viewingId) {
    const that = this
    // 先选日期
    wx.showModal({
      title: '反提议新时间',
      content: '请输入新的看房时间（格式：2026-08-20 14:00）',
      confirmText: '下一步',
      editable: true,
      success(res) {
        if (!res.confirm || !res.content) return
        const input = res.content.trim()
        // 简单校验格式
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(input)) {
          wx.showToast({ title: '格式错误，请使用：2026-08-20 14:00', icon: 'none' })
          return
        }
        market.counterProposeViewing(viewingId, input + ':00').then((r) => {
          if (r && r.status === 0) {
            wx.showToast({ title: '已反提议', icon: 'success' })
            that.loadConversation()
          } else {
            wx.showToast({ title: (r && r.msg) || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 投诉
  _reportViewing(viewingId) {
    const that = this
    wx.showModal({
      title: '投诉',
      content: '请描述投诉原因：',
      editable: true,
      confirmText: '提交',
      confirmColor: '#e54d42',
      success(res) {
        if (!res.confirm || !res.content) return
        market.reportViewing(viewingId, res.content.trim()).then((r) => {
          if (r && r.status === 0) {
            wx.showToast({ title: '投诉已提交', icon: 'success' })
          } else {
            wx.showToast({ title: (r && r.msg) || '提交失败', icon: 'none' })
          }
        })
      }
    })
  }
})
