// pages/policy/policy.js
const log = require('./../../utils/log')
const utils = require('../../utils/util')
const constants = require('../../utils/constants')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关
    curTab : 0,
    scrollLeft : 0
  },

  onLoad: function (options) {
    log.info('onLoad policy页')
  },

  // 导航栏上选择不同的tab
  tabSelect(e) {
    this.setData({
      curTab: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1 )* 60
    })
  },

  // 点击文章链接导航至其他页面
  navTo(e) {
    log.info(`用户点击一个文章链接`)
    console.log(e)

    if (e.currentTarget.dataset.url) {
      log.info(`文章链接是: ${e.currentTarget.dataset.url}`)

      wx.navigateTo({
        url: '/pages/article/article?url=' + e.currentTarget.dataset.url,
      })
    }
  },

  // 打咨询电话
  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '021-50591069',
    })
  },

  // 开启导航（到公租房办事处）
  navigateToOffice() {
    log.info('点击导航至办事处')

    // 防止用户的微信版本过低
    const wxVersion = wx.getSystemInfoSync().SDKVersion
    if (utils.compareVersion(wxVersion, '2.14.0') < 0) {
      wx.showToast({
        title: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
        icon: 'none'
      })
      return;
    }

    const mapCtx = wx.createMapContext('map', this);

    const officeCoordinate = constants.officeCoordinate
    mapCtx.openMapApp({
      latitude: officeCoordinate.lat,
      longitude: officeCoordinate.lng,
      destination: officeCoordinate.address,
      success: res => {
        console.log(res)
      },
      fail: err => {
        console.log(err)
      }
    })
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/newbee/newbee?tab=policy'
    let self = this
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