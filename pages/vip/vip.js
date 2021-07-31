// pages/vip/vip.js
const constants = require('../../utils/constants')
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
    showModal: false
  },

  onLoad: function (options) {},

  // 填写信息的handler
  fillName(e) {
    this.setData({
      username: e.detail.value
    })
  },

  fillEmail(e) {
    this.setData({
      email: e.detail.value
    })
  },

  fillAccount(e) {
    this.setData({
      account: e.detail.value
    })
  },

  fillPassword(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 递交用户信息
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

  // 向后端递交用户信息
  postUserInfo() {
    const url = constants.userinfoServer + '/api/user/update'
    let self = this
    wx.request({
      url: url,
      method: 'POST',
      header: { 
        'content-type' : 'application/x-www-form-urlencoded', 
        'token': app.globalData.userinfo.tokenStr 
      },
      data: {
        name: self.data.name,
        email: self.data.email,
        account: self.data.account,
        password: self.data.password
      },
      success: (res) => {
        if (res.data.status == 0) {
          // 成功
          self.hideModal()
          wx.redirectTo({
            url: '/pages/user/user',
          })
        } else {
          // 请求有误
          console.log(res)
          self.hideModal()
          self.showErrorModal(res.data.data)
        }
      },
      fail: (err) => {
        console.log(err)
        self.hideModal()
        self.showErrorModal(JSON.stringify(err))
      }
    })
  },

  // Modal相关
  showConfirmationModal() {
    this.setData({
      showModal: true
    })
  },

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