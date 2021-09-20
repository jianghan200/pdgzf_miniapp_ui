// pages/email/email.js
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const payHelper = require('../../utils/pay')
const app = getApp()
const util = require('../../utils/util')

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
    modalTitle : '开启邮件订阅'
  },

  onLoad: function (options) {
    let daysToExpire = 0
    if (options.type && options.expiryDate && options.type == 1) {
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
    if (options.type && options.expiryDate && options.type == 2) {
      let hour = new Date().getHours()
      if (hour <= 6 || hour >= 18) {
        dayTime = '晚'
      } else if (hour >= 11 && hour <= 13) {
        dayTime = '午'
      }
    }
    this.setData({
      type : options.type,
      expiryDate : options.expiryDate,
      daysToExpire : daysToExpire,
      dayTime : dayTime,
      email : app.globalData.userinfo.email == null ? '' : app.globalData.userinfo.email,
      modalTitle : app.globalData.userinfo.type == 0 ? '开启邮件订阅' : '续一个月'
    })
  },

  // 点击小铃铛开启订阅
  register() {
    this.setData({
      showRegisterModal : true
    })
  },

  // 关闭Modal
  hideModal() {
    this.setData({
      showRegisterModal : false
    })
  },

  // 记录用户输入的email, 由于双向绑定，这只是一个placeholder
  handleEmail(e) {},

  // 支付成功后需要更新用户信息
  postPayment() {
    let self = this
    // 用户可能已经用昵称作为自己的用户名
    let oldUsername = app.globalData.userinfo.name == null ? '' : app.globalData.userinfo.name
    requests
      .updateUserInfo(oldUsername, self.data.email, '', '')
      .then((res) => {
        // 微信支付成功
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        })
        // 关掉弹窗
        self.hideModal()
        app.globalData.userinfo.type = 1
        app.globalData.userinfo.email = self.data.email
        // 必须redirect，否则不会触发onLoad
        wx.redirectTo({
          url: './../../pages/user/user',
        })
      })
      .catch((err) => {
        wx.showToast({
          title: err
        })
        self.hideModal()
      })
  },

  // 支付
  pay() {
    if (util.validateEmail(this.data.email)) {
      // 邮件验证通过
      // 开始支付
      let self = this
      payHelper.pay(0).then((res) => {
        self.postPayment()
      }).catch((err) => {
        // 微信支付失败
        wx.showToast({
          title: '支付失败',
          icon: 'cancel'
        })
        self.hideModal()
      })
    } else {
      // 检查未通过
      wx.showToast({
        title: '电邮填写有误',
        icon: 'cancel'
      })
    }
  }
})