const app = getApp()
const log = require('./log')
const constants = require('./constants')
const utils = require('./util')

// VIP接口，获取年度的选中人资格总结信息
const summary = function(projectId) {
  return new Promise((resolve, reject) => {
    if (isVip(projectId)) {
      log.info(`VIP(unionId: ${app.globalData.userinfo.unionId})请求全量选房数据`)
  
      wx.request({
        url: constants.server + '/house_waiting_time/' + projectId,
        header: { 'content-type': 'application/json' },
        success: (res) => { return resolve(res.data) },
        fail: (err) => {
          log.error(err)
          console.log(err)
          
          return reject(err)
        }
      })
    } else {
      log.warn(`非VIP无法请求这个统计信息`)
      log.warn(app.globalData.userinfo)

      return resolve(null)
    }
  })
}

// 获取月度的选房数据
const monthly_stats = function(projectId) {
  return new Promise((resolve, reject) => {
    if (isVip(projectId)) {
      log.info(`VIP(unionId: ${app.globalData.userinfo.unionId})请求月度选房数据`)

      wx.request({
        url: constants.server + '/monthly_house_waiting_time/' + projectId,
        header: { 'content-type': 'application/json' },
        success: (res) => { return resolve(res.data) },
        fail: (err) => {
          log.error(err)
          console.log(err)
          
          return reject(err)
        }
      })
    } else {
      log.warn(`非VIP无法请求这个统计信息`)
      log.warn(app.globalData.userinfo)

      return resolve(null)
    }
  })
}

// 一个用于本文件的helper方法
const isVip = function(projectId) {
  return app.globalData.userinfo.type == 2 || projectId == constants.vipPid
}

// 初始化echarts以及数据mapping
const chart_of_monthly_stats = function(chart1, chart2, projectId) {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  monthly_stats(projectId).then(res => {
    if (res != null) {
      log.info(`获得${res.length}个结果`)
      const dataByHouseType = []
      const refDataByHouseType = []
      // 修改原始数据的结构
      // 每一个户型为一个series, 先清洗好数据
      Object.getOwnPropertyNames(res).forEach(houseTypeId => {
        // [{year, month, max, min, avg, count, std, mid}, ...]
        const houseType = constants.id2Type(Number(houseTypeId))
        // 按照 年-月 排序
        const rawData = res[houseTypeId]
        // 找到户型数据中“年的Set”，并从小到大排序
        const ySet = Array.from(new Set(rawData.map(elem => elem['year']))).sort()
        // [{houseTypeId, houseTypeName, year, month, max, min, avg, count, yearMonth, yearSet, std, mid}, {...}, ...]
        rawData.forEach(row => {
          row['yearMonth'] = `${row['year']}-${row['month']}`
          row['houseTypeId'] = houseTypeId
          row['houseTypeName'] = houseType
          row['yearSet'] = ySet
        })
        const sorted_by_year_month = utils.sortByProperty(rawData, 'yearMonth', utils.dateStrComparator)
        
        log.info('将数据使用yearMonth排序')
        log.info(sorted_by_year_month)
        
        const refData = {
          'houseTypeId': Number(houseTypeId),
          'yearSet': ySet,
          'firstYear': sorted_by_year_month[0].year,
          'firstMonth': sorted_by_year_month[0].month,
          'lastYear': sorted_by_year_month[sorted_by_year_month.length - 1].year,
          'lastMonth': sorted_by_year_month[sorted_by_year_month.length - 1].month
        }
        // 对此房型的数据进行“对齐”操作，保证每个年月都有数据，placeholder或非零
        // pivotIndex是sorted_by_year_month的index
        let pivotIndex = 0
        // 结果集
        const results = []
        // 顺序遍历年月
        for (let yi = 0; yi < ySet.length; yi++) {
          const curYear = ySet[yi]
          for (let mi = 0; mi < months.length; mi++) {
            const curMonth = months[mi]
            if (pivotIndex == sorted_by_year_month.length) {
              results.push({ 'houseTypeId': Number(houseTypeId), 'houseTypeName': houseType, 'yearMonth': `${curYear}-${curMonth}`, 'year': curYear, 'month': curMonth, 'max': 0, 'min': 0, 'avg': 0, 'count': 0, 'std': 0, 'mid': 0, 'yearSet': ySet })
            } else {
              // e.g. 2022-12 -> yearMonths = 2022 * 12 + 12
              const yearMonths = curYear * 12 + curMonth
              // pivot是当前用于对比的非零数据（sorted）
              const pivot = sorted_by_year_month[pivotIndex]
              const pivotYearMonths = pivot['year'] * 12 + pivot['month']
              if (yearMonths == pivotYearMonths) {
                // 说明这个年月是存在非零数据的，使用非零数据，然后更新pivot
                results.push(pivot)
                pivotIndex++
              } else {
                // 说明这个年月没有非零数据，使用placeholder
                results.push({ 'houseTypeId': Number(houseTypeId), 'houseTypeName': houseType, 'yearMonth': `${curYear}-${curMonth}`, 'year': curYear, 'month': curMonth, 'max': 0, 'min': 0, 'avg': 0, 'count': 0, 'std': 0, 'mid': 0, 'yearSet': ySet })
              }
            }
          }
        }
        dataByHouseType.push(results)
        refDataByHouseType.push(refData)
      })

      // 找到yearMonth的range，使用这个作为x坐标系，同时利用这个range对齐数据
      const y_m_range = []
      const sorted_extreme_ym = 
        refDataByHouseType.map(data => `${data['firstYear']}-${data['firstMonth']}`).sort(utils.dateStrComparator)
      // [2019, 11]
      const firstYM = sorted_extreme_ym[0].split('-')
      // lastYM为本年月，跟数据无关
      const lastYM = [new Date().getFullYear(), new Date().getMonth() + 1]
      // 从第一年月遍历到最后一年月生成所有自然年月
      for (let y = firstYM[0]; y <= lastYM[0]; y++) {
        // 如果y是第一年，那么此年月份从"第一个月"开始遍历，否则从1月开始
        const monthStart = y == firstYM[0] ? firstYM[1] : 1
        // 如果y是最后一年，那么此年月份的遍历终止于"最后一月"，否则终止于12月
        const monthEnd = y == lastYM[0] ? lastYM[1] : 12
        for (let m = monthStart; m <= monthEnd; m++) {
          y_m_range.push({ 'year': y, 'month': m })
        }
      }
      // 填充各个户型的数据
      const series1 = 
        dataByHouseType.map(houseTypeData => {
          const sample = houseTypeData[0]
          const year_range_of_this_houseType = sample['yearSet']
          const refData = refDataByHouseType.find(data => data['houseTypeId'] == sample['houseTypeId'])
          // dataSet为本serires的数据集，需要被返回
          let dataSet = []
          for (let y = firstYM[0]; y <= lastYM[0]; y++) {
            // 首年
            if (y == firstYM[0]) {
              if (year_range_of_this_houseType.indexOf(y) == -1) {
                // 数据中没有首年的数据，需要填充(首月 -> 12月)为0
                dataSet = dataSet.concat(Array(12 - firstYM[1] + 1).fill(0))
              } else {
                if (refData['firstMonth'] == firstYM[1]) {
                  // 数据中存在首年，且首月也跟全集的首月相同，使用数据
                  dataSet = dataSet.concat(houseTypeData.filter(data => data['year'] == y).map(data => data['mid']))
                } else {
                  // 数据中存在首年，但首月跟全集的首月不同，全集首月~数据首月的部分填充为0，数据首月~12月部分使用数据
                  const placeHolderPart = Array(refData['firstMonth'] - firstYM[1]).fill(0)
                  const partThatUseRealData = houseTypeData.filter(data => data['year'] == y).map(data => data['mid'])
                  dataSet = dataSet.concat(placeHolderPart.concat(partThatUseRealData))
                }
              }
            } else if (y == lastYM[0]) {
              // 末年
              if (year_range_of_this_houseType.indexOf(y) == -1) {
                // 数据中没有末年的数据，需要填充(1月 -> 末月)为0
                dataSet = dataSet.concat(Array(lastYM[1]).fill(0))
              } else {
                if (refData['lastMonth'] == lastYM[1]) {
                  // 数据中存在末年，且末月也跟全集末月相同，使用数据
                  dataSet = dataSet.concat(houseTypeData.filter(data => data['year'] == y).map(data => data['mid']))
                } else {
                  // 数据中存在末年，但末月跟全集的末月不同，1月至数据末月的部分使用数据，数据末月至全集末月的部分填充为0
                  const partThatUseRealData = houseTypeData.filter(data => data['year'] == y).map(data => data['mid'])
                  const placeHolderPart = Array(lastYM[1] - refData['lastMonth']).fill(0)
                  dataSet = dataSet.concat(partThatUseRealData.concat(placeHolderPart))
                }
              }
            } else {
              // 中间年
              if (year_range_of_this_houseType.indexOf(y) == -1) {
                // 数据中无此中间年，1-12月的数据全部需要填充
                dataSet = dataSet.concat(Array(12).fill(0))
              } else {
                // 数据中存在此中间年，全部使用数据
                dataSet = dataSet.concat(houseTypeData.filter(data => data['year'] == y).map(data => data['mid']))
              }
            }
          }
          return { 'name': sample['houseTypeName'], 'type': 'line', data: dataSet }
        })

      const series2 = 
        dataByHouseType.map(houseTypeData => {
          const sample = houseTypeData[0]
          const year_range_of_this_houseType = sample['yearSet']
          const refData = refDataByHouseType.find(data => data['houseTypeId'] == sample['houseTypeId'])
          // dataSet为本serires的数据集，需要被返回
          let dataSet = []
          for (let y = firstYM[0]; y <= lastYM[0]; y++) {
            // 首年
            if (y == firstYM[0]) {
              if (year_range_of_this_houseType.indexOf(y) == -1) {
                // 数据中没有首年的数据，需要填充(首月 -> 12月)为0
                dataSet = dataSet.concat(Array(12 - firstYM[1] + 1).fill(0))
              } else {
                if (refData['firstMonth'] == firstYM[1]) {
                  // 数据中存在首年，且首月也跟全集的首月相同，使用数据
                  dataSet = dataSet.concat(houseTypeData.filter(data => data['year'] == y).map(data => data['count']))
                } else {
                  // 数据中存在首年，但首月跟全集的首月不同，全集首月~数据首月的部分填充为0，数据首月~12月部分使用数据
                  const placeHolderPart = Array(refData['firstMonth'] - firstYM[1]).fill(0)
                  const partThatUseRealData = houseTypeData.filter(data => data['year'] == y).map(data => data['count'])
                  dataSet = dataSet.concat(placeHolderPart.concat(partThatUseRealData))
                }
              }
            } else if (y == lastYM[0]) {
              // 末年
              if (year_range_of_this_houseType.indexOf(y) == -1) {
                // 数据中没有末年的数据，需要填充(1月 -> 末月)为0
                dataSet = dataSet.concat(Array(lastYM[1]).fill(0))
              } else {
                if (refData['lastMonth'] == lastYM[1]) {
                  // 数据中存在末年，且末月也跟全集末月相同，使用数据
                  dataSet = dataSet.concat(houseTypeData.filter(data => data['year'] == y).map(data => data['count']))
                } else {
                  // 数据中存在末年，但末月跟全集的末月不同，1月至数据末月的部分使用数据，数据末月至全集末月的部分填充为0
                  const partThatUseRealData = houseTypeData.filter(data => data['year'] == y).map(data => data['count'])
                  const placeHolderPart = Array(lastYM[1] - refData['lastMonth']).fill(0)
                  dataSet = dataSet.concat(partThatUseRealData.concat(placeHolderPart))
                }
              }
            } else {
              // 中间年
              if (year_range_of_this_houseType.indexOf(y) == -1) {
                // 数据中无此中间年，1-12月的数据全部需要填充
                dataSet = dataSet.concat(Array(12).fill(0))
              } else {
                // 数据中存在此中间年，全部使用数据
                dataSet = dataSet.concat(houseTypeData.filter(data => data['year'] == y).map(data => data['count']))
              }
            }
          }
          return { 'name': sample['houseTypeName'], 'type': 'bar', data: dataSet }
        })

      // Options
      const option1 = {
        title : { text : '选中者资格分布（月度中位数）', left : 'center' },
        // toolbox: { feature: { dataZoom: { yAxisIndex: 'none' }, restore: {}, saveAsImage: {} } },
        tooltip : { trigger : 'axis' },
        legend : { data : dataByHouseType.map(houseTypeData => houseTypeData[0]['houseTypeName']), top : 40, left : 'center', z : 100 },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis : { type : 'category', boundaryGap : false, data: y_m_range.map(ym => `${ym['year']}-${ym['month']}`) },
        yAxis : { type : 'value', boundaryGap: [0, '100%'] },
        backgroundColor: "#ffffff",
        // dataZoom: [{ type: 'inside', start: 50, end: 100 }],
        series : series1,
      }
      const option2 = {
        title : { text : '房源供给量（月度）', left : 'center' },
        // toolbox: { feature: { dataZoom: { yAxisIndex: 'none' }, restore: {}, saveAsImage: {} } },
        tooltip : { trigger : 'axis' },
        legend : { data : dataByHouseType.map(houseTypeData => houseTypeData[0]['houseTypeName']), top : 40, left : 'center', z : 100 },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis : { type : 'category', boundaryGap : false, data: y_m_range.map(ym => `${ym['year']}-${ym['month']}`) },
        yAxis : { type : 'value', boundaryGap: [0, '100%'] },
        backgroundColor: "#ffffff",
        // dataZoom: [{ type: 'inside', start: 50, end: 100 }],
        series : series2
      }

      if (chart1 != null) {
        chart1.setOption(option1)
      }
      if (chart2 != null) {
        chart2.setOption(option2)
      }
    } else {
      log.info('用户非VIP')

      wx.showModal({
        title: 'VIP专享内容',
        content: '成为VIP解锁更多服务',
        showCancel: true,
        confirmText: '看看权益',
        success: res => { if (res.confirm) { wx.redirectTo({ url: '/pages/rights/rights' }) } }
      })
    }
  }).catch(err => {
    log.error(err)
    console.log(err)
    wx.showToast({ title: '请求异常', icon: 'error' })
  })
}

// 选中这等待时间分布
const chart1 = function(chart, pId) {
  chart_of_monthly_stats(chart, null, pId)
}

// 房源数量统计
const chart2 = function(chart, pId) {
  chart_of_monthly_stats(null, chart, pId)
}

module.exports = {
  getSummaryStats: summary,
  buildVipChart1: chart1,
  buildVipChart2: chart2
}