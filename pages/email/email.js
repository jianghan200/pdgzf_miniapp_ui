// pages/email/email.js
const requests = require('../../utils/request')
const app = getApp()
const util = require('../../utils/util')
const log = require('./../../utils/log')
const userInfoHelper = require('../../utils/user')

Page({
  data: {
    CustomBar : app.globalData.CustomBar,
    type : 0,
    expiryDate : '',
    // 订阅用户独有的进度
    daysToExpire : 0,
    // VIP专项
    dayTime: '早',
    // email
    email: '',
    // Modals
    showRegisterModal : false,
    modalTitle : '开启邮件订阅',
    // 是否开启邮件订阅，有资格但不想收邮件。
    openSubscription : false,
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad: function (options) {
    log.info('onLoad email')
    log.info(app.globalData.userinfo)

    let daysToExpire = 0
    let openSubscription = false
    // option.type是vip的类型
    // 现有的邮件订阅用户
    if (app.globalData.userinfo.type == 1) {
      // 特殊处理进度
      let today = new Date()
      let expiryDate = new Date(options.expiryDate)
      if (expiryDate.getTime() > today.getTime()) {
        // 未来会expire
        daysToExpire = Math.floor((expiryDate - today) / 1000 / 60 / 60 / 24)
      }
    }
    // VIP专享项
    let dayTime = '早'
    if (app.globalData.userinfo.type == 2) {
      let hour = new Date().getHours()
      if (hour <= 6 || hour >= 18) {
        dayTime = '晚'
      } else if (hour >= 11 && hour <= 13) {
        dayTime = '午'
      }

      // vip是否打开了邮件订阅？
      if (app.globalData.userinfo.emailSubscription == 1) {
        log.info('是VIP用户，且开启了邮件订阅')

        openSubscription = true
      }
    }
    this.setData({
      type : options.type,
      expiryDate : options.expiryDate,
      daysToExpire : daysToExpire,
      dayTime : dayTime,
      email : app.globalData.userinfo.email == null ? '' : app.globalData.userinfo.email,
      modalTitle : app.globalData.userinfo.type == 0 ? '开启邮件订阅' : '续一个月',
      openSubscription : openSubscription
    })

    // open-id被禁用，只能向用户请求权限
    const self = this
    userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
      if (res !== null) {
        self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
      }
    })
  },

  // 点击小铃铛开启订阅
  register() {
    log.info('点击小铃铛')

    this.setData({ showRegisterModal : true })
  },

  // 关闭Modal
  hideModal() {
    this.setData({ showRegisterModal : false })
  },

  // 记录用户输入的email, 由于双向绑定，这只是一个placeholder
  handleEmail(e) {},

  // 支付成功后需要更新用户信息
  postPayment() {
    log.info('postPayment email subscription')
    log.info('想后端更新用户的信息')

    const self = this
    // 用户可能已经用昵称作为自己的用户名
    const oldUsername = app.globalData.userinfo.name == null ? '' : app.globalData.userinfo.name
    requests
      .updateUserInfo(oldUsername, self.data.email, '', '')
      .then(() => {
        log.info('updateUserInfo 成功更新用户信息')
        // 微信支付成功
        wx.showToast({ title: '支付成功', icon: 'success' })
        // 关掉弹窗
        self.hideModal()
        app.globalData.userinfo.type = 1
        app.globalData.userinfo.email = self.data.email
        // 必须redirect，否则不会触发onLoad
        wx.redirectTo({ url: './../../pages/user/user' })
      })
      .catch((err) => {
        log.error('updateUserInfo 失败')
        log.error(err)

        wx.showToast({ title: err })
        self.hideModal()
      })
  },

  // 支付
  pay() {
    log.info('支付email订阅')

    if (util.validateEmail(this.data.email)) {
      log.info('开始支付')
      this.postPayment()
    } else {
      log.error('用户填写的Email不合法')
      // 检查未通过
      wx.showToast({ title: '电邮填写有误', icon: 'error' })
    }
  },

  // 改变是否开启邮件订阅
  changeSubscriptionStatus(e) {
    let self = this
    let afterStatusCode = e.detail.value ? 1 : 0

    log.info(`更改邮件订阅状态到：${afterStatusCode}`)

    requests
      .updateEmailSubscriptionStatus(afterStatusCode)
      .then((res) => {
        log.info('成功更新了邮件订阅的状态')

        self.setData({ openSubscription : e.detail.value })
        app.globalData.userinfo.emailSubscription = afterStatusCode

        wx.showToast({ title: '更新成功', icon: 'success' })
      }).catch((err) => {
        log.error('更新邮件订阅状态失败')
        console.log(err)

        wx.showToast({ title: '更新失败', icon: 'error' })
      })
  }
})