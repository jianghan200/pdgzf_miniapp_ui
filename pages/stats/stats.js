import * as echarts from '../../components/ec-canvas/echarts' 
const app = getApp()
const requestHelper = require('../../utils/request')
const charts = require('../../utils/charts')
const utils = require('../../utils/util')
const log = require('./../../utils/log')

// 初始化chart1
function initChart1(canvas, width, height, dpr) {
  const chart1 = 
    echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr // new
    });
  canvas.setChart(chart1);

  // 在全局中试图找到月度的获得资格的人数
  let cacheOpt = app.globalData.monthlyData
  if (!cacheOpt) {
    // 没有cache过，要请求
    requestHelper.getCandidatesCounts().then((res) => {
      app.globalData.monthlyData = res
      charts.setChart1(chart1, res)
    }).catch((err) => {
      console.log(err)
    })
  } else {
    // 已经cache起来了
    charts.setChart1(chart1, cacheOpt)
  }
  return chart1;
}

// 初始化chart2
function initChart2(canvas, width, height, dpr) {
  const chart2 = 
    echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr // new
    });
  canvas.setChart(chart2)

  let cacheOpt = app.globalData.validCandidatesCountPerMonth
  if (!cacheOpt) {
    // 没有cache过，要请求
    requestHelper.getValidCandidatesCounts().then((res) => {
      app.globalData.validCandidatesCountPerMonth = res
      // 对月度数据进行normalize，categorize
      charts.setChart2(chart2, utils.categorize(res))
    }).catch((err) => {
      console.log(err)
    })
  } else {
    // 数据有缓存过
    charts.setChart2(chart2, utils.categorize(cacheOpt))
  }
  return chart2;
}

// 初始化chart3
function initChart3(canvas, width, height, dpr) {
  const chart3 = 
    echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr // new
    });
  canvas.setChart(chart3)

  let cacheOpt = app.globalData.monthlyHouseData
  if (!cacheOpt) {
    requestHelper.getMonthlyHouseCount().then((res) => {
      app.globalData.monthlyHouseData = res
      charts.setChart3(chart3, res)
    }).catch((err) => {
      console.log(err)
    })
  } else {
    charts.setChart3(chart3, cacheOpt)
  }
}

Page({
  data : {
    ec1: {
      onInit: initChart1
    },
    ec2 : {
      onInit: initChart2
    },
    ec3 : {
      onInit: initChart3
    }
  },
  onLoad(options) {
    log.info('onLoad stats')
  },
  
  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/newbee/newbee?tab=stats'
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