const app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const utils = require('../../utils/util')
const log = require('./../../utils/log')
const today = utils.formatDate(new Date())
const userHelper = require('./../../utils/user')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    CustomBar: app.globalData.CustomBar,
    userinfo: null,
    vipInfo: null,
    startDate: '',
    // 是否打开manualStartDate的Dialog
    openManualStartDateDialog : false,
    today: today,
    hasStartDateCode: -1,
    // 资格日button的信息
    buttonInfo: {
      text: '',
      color: ''
    },
    // 未读信息数量
    unreadCount: 0
  },
  
  onLoad: function (options) {
    log.info('onLoad user')
    log.info(app.globalData.userinfo)

    // 设置未读信息的数量
    this.setData({ unreadCount: app.globalData.unread })

    this.getVipInfo()
    let userinfo = app.globalData.userinfo
    // 判断用户的资格日
    let hasStartDateCode = userHelper.hasStartDate()
    this.setData({
      userinfo: userinfo,
      startDate: this.resolveStartDate(hasStartDateCode),
      hasStartDateCode: hasStartDateCode,
      buttonInfo: this.resolveButtonInfo(hasStartDateCode, app.globalData.userinfo.type === 2)
    })

    if(options['tab'] != undefined && options['tab'] != '' &&  options['tab'] == 'rights') {
      // 来自分享
      wx.navigateTo({
        url: `../rights/rights`
      })
    }
  },

  // 根据hasStartDateCode解析资格日
  resolveStartDate(hasStartDateCode) {
    let startDate = ''
    if (hasStartDateCode == 1) {
      // 说明用户输入过资格日
      startDate = app.globalData.userinfo.manualStartDate
    } else if (hasStartDateCode == 0) {
      // 说明这个人是vip且开启了自动选房（有自己的真实资格日）
      startDate = utils.getOrElse(app.globalData.userinfo.startDate, '').split(' ')[0]
    } else {
      // 这个人是普通用户，且没有输入过资格日
      startDate = utils.formatDate(constants.mockStartDate)
    }
    return startDate
  },

  // 根据hasStartDateCode以及用户是否为vip设置资格日button应该显示的内容
  resolveButtonInfo(hasStartDateCode, isVip) {
    const startDate = this.resolveStartDate(hasStartDateCode)
    const buttonInfo = {
      text: `${hasStartDateCode === -1 ? '模拟' : ''}资格日：${startDate} ${hasStartDateCode === 0 ? '' : '点击重置'}`,
      color: `${isVip ? 'yellow' : 'grey'}`
    }
    return buttonInfo
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

  // Go to 用户的评论 / 文章详情页
  goToInteractions(e) {
    wx.navigateTo({
      url: '/pages/interactions/interactions',
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

  // Go to 我的关注列表
  goToSubscriptions(e) {
    wx.navigateTo({
      url: '/pages/subscribe/subscribe',
    })
  },

  // Go to 我的反馈进度页
  gotoConsult(e) {
    wx.navigateTo({
      url: '/pages/consult/consult',
    })
  },

  // Go to版本页
  gotoVersions(e) {
    wx.navigateTo({
      url: '/pages/versions/versions',
    })
  },

  // Go to About页
  gotoAbout(e) {
    wx.navigateTo({
      url: '/pages/about/about',
    })
  },

  // 查看VIP的权益，导航至权益页
  goToRights() {
    wx.navigateTo({
      url: '/pages/rights/rights',
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

  // 打开自定义资格日的Dialog
  openMaunalStartDateDialog() {
    this.setData({
      openManualStartDateDialog : true
    })
  },

  // 关闭自定义资格日的Dialog
  closeManualStartDateDialog() {
    this.setData({
      openManualStartDateDialog : false
    })
  },

  // Override模拟的startDate
  overrideStartDate(e) {
    log.info('普通用户输入自己的资格日')
    this.openMaunalStartDateDialog()
  },

  // 向后端更新自定义的资格日
  addManualStartDate(e) {
    let self = this
    let selectedDate = e.detail.value
    requests
      .updateManualStartDate(selectedDate)
      .then((res) => {
        log.info('updateManualStartDate 成功')

        wx.showToast({
          title: '成功更新',
          icon: 'success'
        })
        // 更新本地的数据
        app.globalData.userinfo.manualStartDate = selectedDate
        let hasStartDateCode = userHelper.hasStartDate()
        self.setData({
          startDate : selectedDate,
          // vip无法看到这个方法
          hasStartDateCode : 1,
          buttonInfo: this.resolveButtonInfo(hasStartDateCode, app.globalData.userinfo.type === 2)
        })
        self.closeManualStartDateDialog()
      }).catch((err) => {
        log.error('updateManualStartDate 失败')
        log.error(err)

        wx.showToast({
          title: '未能成功更新',
          icon: 'error'
        })
        self.closeManualStartDateDialog()
      })
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