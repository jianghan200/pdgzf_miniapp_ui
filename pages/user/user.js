const app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const utils = require('../../utils/util')
const log = require('./../../utils/log')
const today = utils.formatDate(new Date())
const userInfoHelper = require('./../../utils/user')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    CustomBar: app.globalData.CustomBar *2,
    userinfo: null,
    vipInfo: null,
    vipStartDate: '',
    vipEndDate: '',
    vipExpired: false,
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
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: '',
    // 是否存在关闭苹果支付
    closeIOSPay: false,
    // 是否支持虚拟支付
    supportVp: false,
    // 是否为管理员（基于 role 字段判断）
    isAdmin: false,
    // 私信未读数
    chatUnread: 0
  },
  
  onLoad: function (options) {
    log.info('onLoad user')
    log.info(app.globalData.userinfo)

      // // 继承自newbee页面
      // if (options['curComponentId'] && options['curComponentId'] != '') {
      //   this.setData({ curComponentId: options['curComponentId'] })
      // }
      if (options['tab'] && options['tab'] != '') {
        const tab = options['tab']
        let articleUrl = ''
        if (options['articleUrl'] && options['articleUrl'] != '') {
          articleUrl = '?articleUrl=' + options['articleUrl']
        }
        // 来自分享
        wx.navigateTo({ url: `/pages/${tab}/${tab}` + articleUrl })
      }

    this.getVipInfo()
    let userinfo = app.globalData.userinfo
    // 判断用户的资格日
    let hasStartDateCode = userInfoHelper.hasStartDate()
    this.setData({
      app: app,
      userinfo: userinfo,
      startDate: this.resolveStartDate(hasStartDateCode),
      hasStartDateCode: hasStartDateCode,
      buttonInfo: this.resolveButtonInfo(hasStartDateCode, app.globalData.userinfo.type === 2),
      closeIOSPay: app.globalData.IOS && !app.globalData.isNormalMode,
      supportVp: !!wx.canIUse('requestVirtualPayment')
    })

    if (options['tab'] != undefined && options['tab'] != '' &&  options['tab'] == 'rights') {
      // 来自分享
      wx.navigateTo({ url: `../rights/rights` })
    }

    // open-id被禁用，只能向用户请求权限
    const self = this
    // userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
    //   if (res !== null) {
    //     self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
    //   }
    // })
    if (userInfoHelper.has_weixin_nickNameAndAvatar()) {
      self.setData({ 
        nickname: app.globalData.userinfo.wxNickName, 
        avatarUrl: app.globalData.userinfo.wxAvatarUrl 
      })
    } else {
      // 使用默认值
      self.setData({ 
        nickname: '游客', 
        avatarUrl: 'https://cdn.vencloud.cn/yzzz/default/cat.jpeg-detail_img' 
      })
    }
  },

  onShow: function(){
    console.log("onshow")
    const userType = (app.globalData.userinfo && app.globalData.userinfo.type) || 0
    this.setData({
      app: app,
      nickname: app.globalData.userinfo.wxNickName,
      avatarUrl: app.globalData.userinfo.wxAvatarUrl,
      isAdmin: userType === 99
    });
    this.loadChatUnread()
  },

  // res = { 'wxNickName': '...', 'wxAvatarUrl': 'http://...' }
  setAvatarAndNickname(res) {
    const self = this
    self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
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
          vipInfo: info,
          vipStartDate: info.vipStartDate || '',
          vipEndDate: info.vipEndDate || '',
          vipExpired: info.type === 2 && info.vipEndDate && new Date(info.vipEndDate) < new Date()
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

  
  goToSelectDetail(e) {
    wx.navigateTo({
      url: '/pages/select_status/select_status',
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

  // 设置默认首页 0=pudong 1=shbzf 2=market 3=forum
  chooseDefaultTab() {
    const tabs = [
      { key: 0, label: '浦东公租房' },
      { key: 1, label: '保租房' },
      { key: 2, label: '市场租房' },
      { key: 3, label: '社区' },
    ]
    const current = app.globalData.userinfo.defaultTab != null ? app.globalData.userinfo.defaultTab : 0
    wx.showActionSheet({
      itemList: tabs.map(t => t.label + (t.key === current ? ' (当前)' : '')),
      success: (res) => {
        const tab = tabs[res.tapIndex].key
        if (tab === current) return
        requests.updateDefaultTab(tab).then(() => {
          wx.showToast({ title: '设置成功', icon: 'success' })
          this.setData({
            'userinfo.defaultTab': tab
          })
        }).catch(() => {
          wx.showToast({ title: '设置失败', icon: 'error' })
        })
      }
    })
  },

  // 进入审核后台（管理员可见）
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/houseReview' })
  },

  // 发布市场房源
  goPublishMarket() {
    wx.navigateTo({ url: '/pages/market/publish' })
  },

  // 我的消息（聊天）
  goChatList() {
    wx.navigateTo({ url: '/pages/chat/list' })
  },

  // 外部（聊天列表页）刷新未读角标
  onChatUnread(total) {
    this.setData({ chatUnread: total || 0 })
  },

  loadChatUnread() {
    const market = require('../../utils/market')
    market.getChatUnread().then((res) => {
      if (res && res.status === 0) {
        this.setData({ chatUnread: res.data.total || 0 })
        wx.setStorageSync('chat_unread', res.data.total || 0)
      }
    }).catch(() => {})
  },

  // 我的发布
  goMyMarketHouses() {
    wx.navigateTo({ url: '/pages/market/myhouses' })
  },

  // 我的收藏
  goFavorite() {
    wx.navigateTo({ url: '/pages/favorite/list' })
  },


  // 我的联系
  goContactList() {
    wx.navigateTo({ url: '/pages/contact/list' })
  },

  // 保证金记录
  goDepositList() {
    wx.navigateTo({ url: '/pages/deposit/list' })
  },

  // 实名认证
  goRealName() {
    wx.navigateTo({ url: '/pages/auth/realName' })
  },

  // 房东认证
  goLandlordAuth() {
    wx.navigateTo({ url: '/pages/auth/landlord' })
  },

  // VIP 中心
  goVipCenter() {
    wx.navigateTo({ url: '/pages/vip/vipCenter' })
  },

  // Go to edit-user-info
  goToEditUserInfo(e) {
    wx.navigateTo({
      url: '/pages/user/edit-user-info',
    })
  },

  // 查看VIP的权益，导航至权益页
  goToRights() {
    wx.navigateTo({
      url: '/pages/rights/rights',
    })
    // if (this.data.closeIOSPay) {
    //   wx.showToast({
    //     title: '联系 meo365',
    //     icon: 'none'
    //   })
    // } else {
      
    // }
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
        let hasStartDateCode = userInfoHelper.hasStartDate()
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
  },

  // 新手村导航至某个页面
  goToNewbeePage(e) {
    console.log("goToNewbeePage", e.currentTarget.dataset)
    const page = e.currentTarget.dataset.page
    const url = `/pages/${page}/${page}?curComponentId=${e.currentTarget.dataset.curcomponentid}`
    console.log("url", url)
    wx.navigateTo({ url: url })
  },
})