// pages/vip/vip.js
const constants = require('../../utils/constants')
const payHelper = require('../../utils/pay')
const util = require('../../utils/util')
const requests = require('../../utils/request')
const app = getApp()

Page({
  data: {
    username: '',
    email: '',
    account: '',
    password: '',
    // 弹窗相关
    showErrorModal: false,
    errorMessage: '',
    showModal: false,
    // 跟当前的模式相关的变量
    isVip: false
  },

  onLoad: function (options) {
    if (options.mode && options.mode == 'edit') {
      // 说明是VIP来修改信息的
      // 设置flag，并且将VIP的信息读进去
      let username = ''
      let email = ''
      let account = ''
      if (app.globalData.userinfo.name && app.globalData.userinfo.name != null) {
        username = app.globalData.userinfo.name
      }
      if (app.globalData.userinfo.email && app.globalData.userinfo.email != null) {
        email = app.globalData.userinfo.email
      }
      if (app.globalData.userinfo.account && app.globalData.userinfo.account != null) {
        account = app.globalData.userinfo.account
      }
      this.setData({
        isVip : true,
        username : username,
        email : email,
        account : account
      })
    }
  },

  // 填写信息的handler
  fillName(e) {},

  fillEmail(e) {},

  fillAccount(e) {},

  fillPassword(e) {},

  // 查看VIP的权益，导航至权益页
  goToRights() {
    wx.navigateTo({
      url: './../../pages/rights/rights',
    })
  },

  // 开启支付，递交用户信息
  submit(e) {
    if (this.checkInputs()) {
      // 通过了输入检查
      this.showConfirmationModal()
    } else {
      // 输入检查失败
      this.showErrorModal(this.hasEmptyField() ? '所有条目均为必填' : '请正确填写邮箱地址')
    }
  },

  // 检查用户输入
  checkInputs() {
    return constants.isEmail(this.data.email) && !this.hasEmptyField()
  },

  // 是否有的field为空
  hasEmptyField() {
    return (this.data.username.trim() == '') && 
      (this.data.email.trim() == '') && 
      (this.data.account.trim() == '') && 
      (this.data.password.trim() == '')
  },

  // 支付
  // submit已经检查了用户的输入
  pay() {
    if (!this.data.isVip) {
      let self = this
      // 必须先update用户信息，再完成付款
      // 先显示loading动画
      wx.showLoading({
        title: '处理中',
      })
      requests
        .updateUserInfo(self.data.username, self.data.email, self.data.account, self.data.password)
        .then((res) => {
          // 隐藏loading动画
          wx.hideLoading()
          // 信息update成功，开始付款
          payHelper.pay(1).then((res) => {
            // 关闭弹窗
            self.hideModal()
            // 支付成功
            wx.showToast({
              title: '支付成功！',
              icon: 'success'
            })
            // 将mem中的userinfo更新
            // 唯独不能把密码暴露
            app.globalData.userinfo.name = self.data.username
            app.globalData.userinfo.email = self.data.email
            app.globalData.userinfo.account = self.data.account
            app.globalData.userinfo.type = 2
            // redirect而不是导航到user主页
            wx.redirectTo({
              url: '/pages/user/user',
            })
          }).catch((err) => {
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
        })
    } else {
      // 是VIP回来更改自己的数据
      // 先显示loading动画
      wx.showLoading({
        title: '处理中',
      })
      let self = this
      requests
        .updateUserInfo(self.data.username, self.data.email, self.data.account, self.data.password)
        .then((res) => {
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
          app.globalData.userinfo.name = self.data.username
          app.globalData.userinfo.email = self.data.email
          app.globalData.userinfo.account = self.data.account
          app.globalData.userinfo.type = 2
          // redirect而不是导航到user主页
          wx.redirectTo({
            url: '/pages/user/user',
          })
        })
        .catch((err) => {
          // 隐藏loading动画
          wx.hideLoading()
          // 处理更新失败
          self.hideModal()
          self.showErrorModal(err)
        })
    }
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

  // 关闭所有弹窗
  hideModal() {
    this.setData({
      showErrorModal: false,
      errorMessage: '',
      showModal: false
    })
  }
})