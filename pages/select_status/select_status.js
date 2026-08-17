const app = getApp()
const log = require('./../../utils/log')

const constants = require('../../utils/constants')
const payHelper = require('../../utils/pay')
const utils = require('../../utils/util')
const userInfoHelper = require('../../utils/user')
const requests = require('../../utils/request')

// 通过 unionId 获得用户的选房状态和资格信息的接口
Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    app: app,

    account:"加载中",
    pdgzf_account_status_code: "",
    pdgzf_account_status: "加载中",
    auto_choose_status:"加载中",
    auto_choose_email:"加载中",
    start_date:"加载中",
    vip_status:"加载中",
    real_name:"加载中",
    
    userinfo : null,
    isIOS: false,
    isNormalMode: false,
    iosModeMsg: "请联系meo365成为VIP",
    isVip: false,

    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad: function (options) {

    this.setData({
      userinfo: app.globalData.userinfo,
      account:app.globalData.userinfo.account,
      real_name: app.globalData.userinfo.realName,
      isNormalMode: app.globalData.isNormalMode,
      isIOS: app.globalData.IOS,
      iosModeMsg:app.globalData.iosModeMsg,
      isVip: app.globalData.userinfo.type == 2,
      start_date:app.globalData.userinfo.startDate
    })

    // 加载 VIP 详细信息（含过期时间）
    let self = this
    requests.getVipInfo().then((info) => {
      if (info && info.type === 2) {
        self.setData({
          vip_status: "是",
          vipStartDate: info.vipStartDate || '',
          vipEndDate: info.vipEndDate || '',
          vipExpired: info.vipEndDate && new Date(info.vipEndDate) < new Date()
        })
      } else {
        self.setData({ vip_status: "否" })
      }
    })

    if(app.globalData.userinfo.serverAccountId && app.globalData.userinfo.account){
      requests.getStatusByServerId(app.globalData.userinfo.serverAccountId)
      .then((info) => {
        log.info('成功获得用户的状态')
        log.info(info)
        self.setData({ pdgzf_account_status_code: info["code"], pdgzf_account_status : info["msg"] })
      })
      .catch((err) => {
        log.error('未成功获得用户的vip信息')
        log.error(err)
        console.log(err)
      })
    }else{
      this.setData({
        pdgzf_account_status: "官网登录信息缺失",
      })
    }
    console.log(app.globalData.userinfo.autoChoose)
    if(app.globalData.userinfo.autoChoose == 1 ){
      this.setData({
        auto_choose_status: "开启",
      })
    }else{
      this.setData({
        auto_choose_status: "关闭",
      })
    }

    if(app.globalData.userinfo.account == null){
      this.setData({
        pdgzf_account_status_code: "",
        pdgzf_account_status: "不适用",
        auto_choose_status:"不适用",
        auto_choose_email:"不适用",
        start_date:"不适用",
        real_name:"不适用",
      })
    }

  },
    // 导航至vip信息录入页
    goToVipInfo(e) {
      wx.navigateTo({
        url: '/pages/vip/vip?mode=edit',
      })
    },
})