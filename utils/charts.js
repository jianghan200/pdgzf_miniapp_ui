// 设置图1 折线图
const setChart1 = function(chart1, cacheOpt) {
  const years = Array.from(new Set(cacheOpt.map(obj => obj.year))).sort()
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const curYear = new Date().getFullYear()
  let yearlySeries = 
    years.map(year => {
      // 这一年的所有数据
      let dataOfThisYear = cacheOpt.filter(obj => obj.year == year)
      let completedDataArray = []
      if (year != curYear) {
        // 如果这年不是"今年"，必须补齐数据，否则数据会被“前移”，在图表上出现业务上的错误
        // 遍历1-12
        months.forEach(month => {
          let dataOfThisMonth = dataOfThisYear.find(data => data.month == month)
          if (!dataOfThisMonth) {
            // 如果某个月份的数据没找到，必须补充一个mock数据
            completedDataArray.push({ year : year, month : month, cnt : 0 })
          } else {
            completedDataArray.push(dataOfThisMonth)
          }
        })
      } else {
        completedDataArray = dataOfThisYear.sort((d1, d2) => d1['month'] > d2['month'] ? 1 : -1)
      }
      return { name: year, type: 'line', stack: 'Total', data: completedDataArray.map(obj => obj.cnt) }
    })

  var option = {
    title : { text : '每个月获得资格的人数', left : 'center' },
    tooltip : { trigger : 'axis' },
    legend : { data : years.map(num => `${num}`), top : 40, left : 'center', z : 100 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis : { type : 'category', boundaryGap : false, data: months },
    yAxis : { type : 'value' },
    backgroundColor: "#ffffff",
    series : yearlySeries
  }
  chart1.setOption(option)
}

// 设置Chart2 饼状图
const setChart2 = function(chart2, categories) {
  var option = {
    title: { text: '参与排队人的资格分布', x: 'center' },
    roseType : 'angle',
    backgroundColor: "#ffffff",
    series: [{
      label: { normal: { fontSize: 14, formatter: '{b}\n{c}人\n{d}%' } },
      type: 'pie',
      center: ['50%', '50%'],
      radius: ['20%', '40%'],
      data: categories
    }]
  }
  chart2.setOption(option)
}

// 设置Chart3
const setChart3 = function(chart3, monthlyHouseCounts) {
  const years = Array.from(new Set(monthlyHouseCounts.map(obj => obj.year))).sort()
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const curYear = new Date().getFullYear()
  let yearlySeries = 
    years.map(year => {
      // 这一年的所有数据
      let dataOfThisYear = monthlyHouseCounts.filter(obj => obj.year == year)
      let completedDataArray = []
      if (year != curYear) {
        // 如果这年不是"今年"，必须补齐数据，否则数据会被“前移”，在图表上出现业务上的错误
        // 遍历1-12
        months.forEach(month => {
          let dataOfThisMonth = dataOfThisYear.find(data => data.month == month)
          if (!dataOfThisMonth) {
            // 如果某个月份的数据没找到，必须补充一个mock数据
            completedDataArray.push({ year : year, month : month, cnt : 0 })
          } else {
            completedDataArray.push(dataOfThisMonth)
          }
        })
      } else {
        completedDataArray = dataOfThisYear.sort((d1, d2) => d1['month'] > d2['month'] ? 1 : -1)
      }
      return {
        name: year,
        type: 'line',
        stack: 'Total',
        data: completedDataArray.map(obj => obj.cnt)
      }
    })

  var option = {
    title : { text : '每个月房屋供给量', left : 'center' },
    tooltip : { trigger : 'axis' },
    legend : { data : years.map(num => `${num}`), top : 40, left : 'center', z : 100 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis : { type : 'category', boundaryGap : false, data: months },
    yAxis : { type : 'value' },
    backgroundColor: "#ffffff",
    series : yearlySeries
  }
  chart3.setOption(option)
}

module.exports = {
  setChart1 : setChart1,
  setChart2 : setChart2,
  setChart3 : setChart3
}