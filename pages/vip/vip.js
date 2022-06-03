// pages/vip/vip.js
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const app = getApp()
const log = require('./../../utils/log')

Page({
  data: {
    email: '',
    account: '',
    password: '',
    // 弹窗相关
    showErrorModal: false,
    errorMessage: '',
    showModal: false,
    showIntroModal: false,
    // 跟当前的模式相关的变量
    isVip: false,
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad: function (options) {
    log.info('onLoad vip')

    if (options.mode && options.mode == 'edit') {
      log.info('VIP修改信息模式')
      // 说明是VIP来修改信息的
      // 设置flag，并且将VIP的信息读进去
      let email = ''
      let account = ''
      if (app.globalData.userinfo.email && app.globalData.userinfo.email != null) {
        email = app.globalData.userinfo.email
      }
      if (app.globalData.userinfo.account && app.globalData.userinfo.account != null) {
        account = app.globalData.userinfo.account
      }
      this.setData({
        isVip : true,
        email : email,
        account : account
      })
    }

    // open-id被禁用，只能向用户请求权限
    if (!app.globalData.nickname || app.globalData.nickname == null) {
      const self = this
      requests.getAvatarAndNickname().then(res => {
        if (res) {
          // 成功获得
          self.setData({
            nickname: app.globalData.nickname,
            avatarUrl: app.globalData.avatarUrl
          })
        }
      })
    } else {
      this.setData({
        nickname: app.globalData.nickname,
        avatarUrl: app.globalData.avatarUrl
      })
    }
  },

  // 填写信息的handler
  fillEmail(e) {},
  fillAccount(e) {},
  fillPassword(e) {},

  // 开启支付，递交用户信息
  submit(e) {
    log.info('用户递交信息，即将开始检查用户输入')
    if (this.checkInputs()) {
      // 通过了输入检查
      log.info('通过了用户输入')

      this.showConfirmationModal()
    } else {
      // 输入检查失败
      log.error('未通过输入检查')

      this.showErrorModal(this.hasEmptyField() ? '所有条目均为必填' : '请正确填写邮箱地址')
    }
  },

  // 检查用户输入
  checkInputs() {
    return constants.isEmail(this.data.email) && !this.hasEmptyField()
  },

  // 是否有的field为空
  hasEmptyField() {
    return (this.data.email.trim() == '') && 
      (this.data.account.trim() == '') && 
      (this.data.password.trim() == '')
  },

  // submit已经检查了用户的输入
  updateAccountInfo() {
    // 是VIP回来更改自己的数据
    // 先显示loading动画
    wx.showLoading({
      title: '处理中',
    })
    let self = this
    requests
      .updateUserInfo(self.data.email, self.data.account, self.data.password)
      .then((res) => {
        log.info('updateUserInfo 成功')
        // 隐藏loading动画
        wx.hideLoading()
        // 提示用户成功
        wx.showToast({
          title: '信息更新成功',
          icon: 'success'
        })
        self.hideModal()
        // 将mem中的userinfo更新
        // 唯独不能把密码暴露
        app.globalData.userinfo.email = self.data.email
        app.globalData.userinfo.account = self.data.account
        app.globalData.userinfo.type = 2
        // redirect而不是导航到user主页
        wx.redirectTo({
          url: '/pages/user/user',
        })
      })
      .catch((err) => {
        log.error('updateUserInfo 失败')
        log.error(err)
        // 隐藏loading动画
        wx.hideLoading()
        // 处理更新失败
        self.hideModal()
        self.showErrorModal(err)
      })
  },

  // Modal相关
  showConfirmationModal() {
    this.setData({
      showModal: true
    })
  },

  // 展示错误Modal
  showErrorModal(errMsg) {
    this.setData({
      showErrorModal: true,
      errorMessage: errMsg
    })
  },

  // 展示自动选房介绍弹窗
  openIntroModal() {
    this.setData({
      showIntroModal: true
    })
  },

  // 关闭所有弹窗
  hideModal() {
    this.setData({
      showErrorModal: false,
      errorMessage: '',
      showModal: false,
      showIntroModal: false
    })
  }
})