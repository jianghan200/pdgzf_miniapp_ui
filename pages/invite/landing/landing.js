const app = getApp()
const credit = require('../../../utils/credit')

Page({
  data: {
    inviterUid: 0,
    isLoggedIn: false,
    loading: false
  },

  onLoad(options) {
    // 从 options.scene 或 options 中解析 inviter_uid
    const scene = decodeURIComponent(options.scene || '')
    const match = scene.match(/inviter_(\d+)/)
    if (match) {
      this.setData({ inviterUid: parseInt(match[1]) })
    }
    if (!match && options.inviter_uid) {
      this.setData({ inviterUid: parseInt(options.inviter_uid) })
    }
    // 也支持直接传 inviter_id 参数
    if (!match && !options.inviter_uid && options.inviter_id) {
      this.setData({ inviterUid: parseInt(options.inviter_id) })
    }
  },

  onShow() {
    this.setData({
      isLoggedIn: !!(app.globalData.userinfo && app.globalData.userinfo.tokenStr)
    })

    // 已登录用户访问时，上报分享打开
    if (this.data.isLoggedIn && this.data.inviterUid > 0) {
      this._reportShareOpen()
    }
  },

  async _reportShareOpen() {
    try {
      await credit.reportShareOpen(this.data.inviterUid)
    } catch (e) {
      console.log('上报分享打开失败', e)
    }
  },

  async onJoin() {
    if (this.data.isLoggedIn) {
      // 已登录 → 跳转市场租房列表
      wx.switchTab({ url: '/pages/market/list' })
      return
    }

    // 未登录 → 跳转登录页
    const redirect = '/pages/market/list'
    wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent(redirect)
    })
  },

  onGoMarket() {
    wx.switchTab({ url: '/pages/market/list' })
  },

  onShareAppMessage() {
    const userId = (app.globalData.userinfo && app.globalData.userinfo.id) || 0
    return {
      title: '我在用PD租房，邀请你一起找房',
      path: userId ? '/pages/invite/landing/landing?inviter_uid=' + userId : '/pages/invite/landing/landing',
      imageUrl: ''
    }
  }
})
