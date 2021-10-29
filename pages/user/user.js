const app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const utils = require('../../utils/util')
const log = require('./../../utils/log')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    CustomBar: app.globalData.CustomBar,
    userinfo: null,
    vipInfo: null,
    startDate: ''
  },
  
  onLoad: function (options) {
    log.info('onLoad user')

    this.getVipInfo()
    let userinfo = app.globalData.userinfo
    let startDate = utils.getOrElse(userinfo.startDate, '').split(' ')[0]
    this.setData({
      userinfo: userinfo,
      startDate: userinfo.type == 2 ? startDate : ''
    })
  },

  // 读取用户会员信息
  getVipInfo() {
    log.info('读取用户的vip信息')

    let self = this
    requests.getVipInfo()
      .then((info) => {
        log.info('成功获得用户的vip信息')
        // 更新一下globalData中的vip相关的数据
        app.globalData.userinfo.emailExpireDate = info.emailExpireDate
        app.globalData.userinfo.type = info.type
        self.setData({
          vipInfo : info
        })
      })
      .catch((err) => {
        log.error('未成功获得用户的vip信息')
        log.error(err)
        console.log(err)
      })
  },

  // Go to VIP页
  gotoVipPage(e) {
    wx.navigateTo({
      url: `/pages/vip/vip`,
    })
  },

  // VIP 才能看到的修改个人信息页
  goEditInfo() {
    wx.navigateTo({
      url: '/pages/vip/vip?mode=edit',
    })
  },

  // Go to Email页
  gotoEmailPage(e) {
    const vipType = this.data.vipInfo.type
    const expiryDate = this.data.vipInfo.emailExpireDate == null ? '' : this.data.vipInfo.emailExpireDate
    wx.navigateTo({
      url: '/pages/email/email?type=' + vipType + '&expiryDate=' + expiryDate,
    })
  },

  // Bottom Bar的方法
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'user') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    return {
      title : 'PD公租房',
      path : '/pages/login/login',
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