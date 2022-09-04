// pages/consult/consult.js
const app = getApp()
const paymentHelper = require('../../utils/pay')
const log = require('../../utils/log')
const requestHelper = require('../../utils/request')
const constants = require('../../utils/constants')
const userInfoHelper = require('../../utils/user')

Page({
  data: {
    statusCode: 0,
    token: '',
    openDatetime: '',
    consultant: constants.consultant,
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad: function (options) {
    log.info('onLoad consult.js')

    // statusCode: 0代表普通用户且为开通咨询。1代表已经开通。2代表是vip
    let statusCode = 0
    let token = ''
    let openDatetime = ''
    if (app.globalData.userinfo.type == 2) {
      // VIP无需判断
      log.info('用户是VIP已经可以咨询')

      statusCode = 2
      this.setData({
        statusCode : statusCode
      })
    } else if (app.globalData.userinfo.openConsult) {
      // 已经付费
      log.info('已经开通了真人咨询')
      log.info(app.globalData)

      statusCode = 1

      let self = this
      requestHelper.getConsultStatus().then((res) => {
        log.info('已经获得用户真人咨询开通状态')

        console.log('here')

        token = app.globalData.userinfo.consultCode
        openDatetime = app.globalData.userinfo.payDay

        log.info(`用户的咨询token为: ${token}`)
        log.info(`用户开通咨询的时间为: ${openDatetime}`)

        self.setData({
          statusCode : statusCode,
          token : token,
          openDatetime : openDatetime
        })

      }).catch((err) => {
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '请求失败',
          icon: 'error'
        })
      })
    } else {
      // 普通用户，未付费
      this.setData({
        statusCode : statusCode
      })
    }

    // open-id被禁用，只能向用户请求权限
    const self = this
    userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
      if (res !== null) {
        self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
      }
    })
  },

  // 支付
  pay(e) {
    wx.showLoading({
      title: '支付中',
      mask: true
    })
    paymentHelper
      .payConsultFee()
      .then((res) => {
        if (res) {
          // 付款成功  
          wx.hideLoading()
          wx.showToast({ title: '支付成功', icon: 'success' })

          app.globalData.userinfo.openConsult = true
          wx.redirectTo({ url: '/pages/user/user' })
        } else {
          // 付款失败
          log.error('付款失败')

          wx.hideLoading()
          wx.showToast({ title: '支付失败', icon: 'error' })
        }
      }).catch((err) => {
        log.error('付款失败')
        log.error(err)

        wx.hideLoading()
        wx.showToast({ title: '支付失败', icon: 'error' })
      })
  },

  onShareAppMessage: function () {

  }
})