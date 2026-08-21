const app = getApp()
const credit = require('../../utils/credit')
const ad = require('../../utils/ad')
const { getClientId } = require('../../utils/clientid')

Page({
  data: {
    balance: 0,
    totalEarned: 0,
    loading: true,
    dailyProgress: {},
    adDailyUsed: 0,
    adDailyMax: 10,
    inviteInfo: null,
    creditConfig: null,
    exchangeOptions: [
      { period: 'week', name: '7天会员', cost: 50, icon: 'cuIcon-vip', tag: '' },
      { period: 'month', name: '30天会员', cost: 150, icon: 'cuIcon-vip', tag: '推荐' },
      { period: 'year', name: '365天会员', cost: 500, icon: 'cuIcon-vip', tag: '超值' }
    ],
    earningChannels: [
      { key: 'share', icon: 'cuIcon-share', title: '分享房源给好友', reward: '+5/人', desc: '好友通过你的分享打开小程序即可获得', color: 'text-blue' },
      { key: 'ad', icon: 'cuIcon-videofill', title: '看激励视频', reward: '+1/次', desc: '', color: 'text-green' },
      { key: 'publish', icon: 'cuIcon-edit', title: '发布真实房源', reward: '+20', desc: '审核通过后获得积分', color: 'text-orange' }
    ],
    channelExpanded: { share: true, ad: true, publish: true }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [account, inviteInfo, creditConfig] = await Promise.all([
        credit.getAccount(),
        credit.getInviteInfo(),
        credit.getCreditConfig()
      ])

      const updateData = { loading: false }

      if (account) {
        updateData.balance = account.balance || 0
        updateData.totalEarned = account.total_earned || 0
        updateData.dailyProgress = account.daily_progress || {}
        updateData.adDailyUsed = (account.daily_progress && account.daily_progress.ad) || 0
        updateData.adDailyMax = (creditConfig && creditConfig.ad_daily_limit) || 10
      }

      if (inviteInfo) {
        updateData.inviteInfo = inviteInfo
      }

      if (creditConfig) {
        updateData.creditConfig = creditConfig
        if (creditConfig.ad_daily_limit) {
          updateData.adDailyMax = creditConfig.ad_daily_limit
        }
      }

      this.setData(updateData)
    } catch (e) {
      console.log('积分中心加载失败', e)
      this.setData({ loading: false })
    }
  },

  // 切换赚积分渠道展开/收起
  toggleChannel(e) {
    const key = e.currentTarget.dataset.key
    const expanded = this.data.channelExpanded
    expanded[key] = !expanded[key]
    this.setData({ channelExpanded: expanded })
  },

  // 看广告赚积分
  async onWatchAd() {
    const adDailyUsed = this.data.adDailyUsed
    const adDailyMax = this.data.adDailyMax
    if (adDailyUsed >= adDailyMax) {
      wx.showToast({ title: '今日次数已用完', icon: 'none' })
      return
    }

    if (!this._isLogin()) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能赚取积分',
        confirmText: '去登录',
        success: (r) => {
          if (r.confirm) wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }

    wx.showLoading({ title: '加载广告...' })

    // 尝试从 creditConfig 获取广告位ID
    let adUnitId = ''
    if (this.data.creditConfig && this.data.creditConfig.ad_unit_id) {
      adUnitId = this.data.creditConfig.ad_unit_id
    }

    try {
      const completed = await ad.showRewardedVideo(adUnitId)
      wx.hideLoading()

      if (completed) {
        const userId = (app.globalData.userinfo && app.globalData.userinfo.id) || 0
        const requestId = 'ad_' + userId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
        const res = await credit.earnCredit('ad', requestId)

        if (res && res.status === 0) {
          wx.showToast({ title: '获得1积分', icon: 'success' })
          this.loadData()
        } else {
          wx.showToast({ title: (res && res.msg) || '积分发放失败', icon: 'none' })
        }
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '广告加载失败', icon: 'none' })
    }
  },

  // 分享赚积分
  onShareCredit() {
    // 分享功能通过 onShareAppMessage 触发
    wx.showToast({ title: '点击右上角分享', icon: 'none' })
  },

  // 去发布
  onGoPublish() {
    wx.switchTab({ url: '/pages/market/list' })
  },

  // 兑换会员
  async onExchange(e) {
    const period = e.currentTarget.dataset.period
    const option = this.data.exchangeOptions.find(o => o.period === period)
    if (!option) return

    if (!this._isLogin()) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能兑换会员',
        confirmText: '去登录',
        success: (r) => {
          if (r.confirm) wx.navigateTo({ url: '/pages/login/login' })
        }
      })
      return
    }

    if (this.data.balance < option.cost) {
      wx.showToast({ title: '积分不足，还需' + (option.cost - this.data.balance) + '积分', icon: 'none' })
      return
    }

    const res = await new Promise((resolve) => {
      wx.showModal({
        title: '确认兑换',
        content: '确认使用 ' + option.cost + ' 积分兑换' + option.name + '？',
        success: (r) => resolve(r.confirm)
      })
    })

    if (!res) return

    wx.showLoading({ title: '兑换中...' })
    const userId = (app.globalData.userinfo && app.globalData.userinfo.id) || 0
    const requestId = 'exchange_' + userId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
    const result = await credit.exchangeVip(period, requestId)
    wx.hideLoading()

    if (result && result.status === 0) {
      wx.showToast({ title: '兑换成功', icon: 'success' })
      this.loadData()
    } else {
      wx.showToast({ title: (result && result.msg) || '兑换失败', icon: 'none' })
    }
  },

  // 查看邀请详情
  onGoInvitees() {
    wx.navigateTo({ url: '/pages/credit/invitees' })
  },

  // 查看积分流水
  onGoTransactions() {
    wx.navigateTo({ url: '/pages/credit/transactions' })
  },

  _isLogin() {
    const u = app.globalData.userinfo
    return !!(u && u.tokenStr)
  },

  // 分享积分中心
  onShareAppMessage() {
    const userId = (app.globalData.userinfo && app.globalData.userinfo.id) || 0
    return {
      title: '赚积分换会员，浦东租房更轻松',
      path: userId ? '/pages/credit/credit?inviter_uid=' + userId : '/pages/credit/credit',
      imageUrl: '',
      success: (res) => {
        if (res.errMsg === 'shareAppMessage:ok') {
          wx.showToast({ title: '转发成功', icon: 'success' })
        }
      },
      fail: () => {
        wx.showToast({ title: '转发已取消' })
      }
    }
  }
})
