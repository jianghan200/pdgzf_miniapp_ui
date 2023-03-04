const app = getApp()
const log = require('./../../utils/log')

const constants = require('../../utils/constants')
const payHelper = require('../../utils/pay')
const utils = require('../../utils/util')
const userInfoHelper = require('../../utils/user')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    userinfo : null,
    isIOS: false,
    isNormalMode: false,
    isVip: false,
    // 弹窗相关
    showModal: false,
    displayOfficialAccount: true,
    officialAccount: 'PD生活',
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad: function (options) {
    log.info('onLoad right')

    this.setData({
      isIOS: app.globalData.IOS,
      isNormalMode: app.globalData.isNormalMode,
      isVip: app.globalData.userinfo.type == 2,
      displayOfficialAccount: utils.displayOfficialAccount(),
      officialAccount: constants.officialAccount
    })

    // open-id被禁用，只能向用户请求权限
    const self = this
    userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
      if (res !== null) {
        self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
      }
    })
  },

  // 普通用户点击VIP范例
  vipSample(e) {
    log.info('普通用户点击vip范例')

    let url = '../community/community?pid=' + constants.vipPid + '&mock=true'
    wx.navigateTo({ url: url })
  },

  // Modal相关
  showConfirmationModal() {
    if (app.globalData.IOS && !this.data.isNormalMode) {
      wx.showModal({
        'title' : '苹果税',
        'content' : '请联系meo365成为VIP'
      })
    } else {
      this.setData({
        showModal: true
      })
    }
  },

  // 关闭所有弹窗
  hideModal() {
    this.setData({
      showModal: false
    })
  },

  // 支付
  pay() {
    let self = this
    // 先显示loading动画
    wx.showLoading({ title: '处理中' })

    payHelper.pay(1).then(() => {
      log.info('pay(1) 成功')
      // 关闭弹窗
      self.hideModal()
      // 支付成功
      wx.showToast({
        title: '支付成功！',
        icon: 'success'
      })
      // 将mem中的userinfo更新
      app.globalData.userinfo.type = 2
      // redirect而不是导航到user主页
      wx.hideLoading()
      wx.redirectTo({
        url: '/pages/user/user',
      })
    }).catch((err) => {
      log.error('pay(1)(vip付款) 失败')
      log.error(err)
      console.log(err)
      // 隐藏loading动画
      wx.hideLoading()
      // 关闭弹窗
      self.hideModal()
      // 支付失败
      wx.showToast({
        title: '支付失败'
      })
    })
  },

  // 将公众号名称复制到用户的clipboard
  copyToClipboard() {
    log.info(`复制公众号${this.data.officialAccount}到剪贴板上`)
    
    utils.copyToClipboard(this.data.officialAccount)
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/user/user?tab=rights'
    return {
      title : 'PD公租房',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({
            title: '转发成功',
            icon: 'success'
          })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({
            title: '转发已取消',
          })
        } else {
          wx.showToast({
            title: '转发失败',
          })
        }
      }
    }
  }
})