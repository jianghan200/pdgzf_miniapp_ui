const vipStats = require('../../utils/vipStats')
const log = require('../../utils/log')
const constants = require('../../utils/constants')
const app = getApp()
import * as echarts from '../../components/ec-canvas/echarts' 

Page({
  data: {
    isVip: false,
    pId: "",
    pName: "",
    summaryStats: [],
    // echarts
    ec1: {},
    ec2: {}
  },

  onLoad(options) {
    const self = this
    const pId = options.pId
    const isVipShowCase = pId == constants.vipSampleProjectId
    const isVip = (app.globalData.userinfo.type === 2) || isVipShowCase
    this.setData({ 'pId': pId, 'pName': options.pName, 'isVip': isVip }, () => self.getSummaryStats())
  },

  onShow() {
    const chart1Component = this.selectComponent('#vip-chart1')
    const chart2Component = this.selectComponent('#vip-chart2')
    const self = this
    chart1Component.init((canvas, width, height, dpr) => {
      const chart1 = echarts.init(canvas, null, { width: width, height: height, devicePixelRatio: dpr })
      vipStats.buildVipChart1(chart1, self.data.pId)
    })
    chart2Component.init((canvas, width, height, dpr) => {
      const chart2 = echarts.init(canvas, null, { width: width, height: height, devicePixelRatio: dpr })
      vipStats.buildVipChart2(chart2, self.data.pId)
    })
  },

  // 获取全量数据
  getSummaryStats() {
    const self = this
    vipStats.getSummaryStats(this.data.pId).then(res => {
      if (res != null) {
        // 请求成功
        // 将户型id翻译成文字，方便前端显示
        res.forEach(row => { row['houseTypeName'] = constants.id2Type(row['typeName']) })
        self.setData({ summaryStats: res })
      } else {
        log.warn(`非vip请求全量统计数据(${self.data.pName})`)
        
        self.promptUsersToBecomeVip()
      }
    }).catch(err => {
      log.error(err)
      console.log(err)
      
      wx.showToast({ title: '请求有误', icon: 'error' })
    })
  },

  // 引导用户成为VIP
  promptUsersToBecomeVip() {
    log.info('用户非VIP')

    wx.showModal({
      title: 'VIP专享内容',
      content: '成为VIP解锁更多服务',
      showCancel: true,
      confirmText: '看看权益',
      success: res => { if (res.confirm) { wx.redirectTo({ url: '/pages/rights/rights' }) } }
    })
  },
})