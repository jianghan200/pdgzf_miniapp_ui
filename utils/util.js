const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('-')}`
}

const yesterday = function() {
  const now = new Date().getTime()
  return new Date(now - 24 * 60 * 60 * 1000)
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const groupBy = function( array , f ) {
  let groups = {};
  array.forEach( function( o ) {
      let group = JSON.stringify( f(o) );
      groups[group] = groups[group] || [];
      groups[group].push( o );
  });
  return Object.keys(groups).map( function( group ) {
      return groups[group];
  });
}

const validateEmail = function(email) {
  const emailRegex = /^(?:\w+\.?)*\w+@(?:\w+\.?)*\w+$/
  return emailRegex.test(email)
}

const compareDates = function(date, comparison) {
  let date1 = new Date(date)
  let date2 = new Date(comparison)
  
  if (date1.getTime() > date2.getTime()) {
    // date比comparison更新
    return true
  } else {
    // date比comparison更旧
    return false
  }
}

const sortByProperty = function(arr, property, comparator) {
  if (arr.length > 0 && arr && property && comparator) {
    arr.sort(function(o1, o2) {
      let po1 = o1[property]
      let po2 = o2[property]
      return comparator(po1, po2)
    })
    return arr
  } else {
    return []
  }
}

const numberComparator = function(num1, num2) {
  let res = true
  if (typeof(num1) != Number && typeof(num2) != Number) {
      res = Number(num1) > Number(num2)
  } else if (typeof(num1) != Number) {
      res = Number(num1) > num2
  } else if (typeof(num2) != Number) {
      res = num1 > Number(num2)
  } else {
      res = num1 > num2
  }
  // 不能return true/false
  if (res) {
      return 1
  } else {
      return -1
  }
}

// 如果date比pivot新，排在pivot后面
const dateStrComparator = function(dStr1, pivotDateStr) {
  let date1 = new Date(dStr1)
  let pivot = new Date(pivotDateStr)

  if (date1.getTime() > pivot.getTime()) {
    return 1
  } else {
    return -1
  }
}
// [255, 0, 0] to #ff0000
const rgbArrayToHex = function(rgbArray) {
  let hex = '#'
  rgbArray.forEach(num => hex = hex + ('0' + parseInt(num).toString(16)).slice(-2))
  return hex
}

// 从0到120，大于120视同120
const number2Hex = function(number) {
  let step = (255 + 255) / 120
  let red = 0
  let green = 0
  let blue = 0

  if (number < 60) {
    // 绿色越来越多
    red = step * number
    green = 255
  } else if (number >= 60 && number <= 120) {
    // 红色越来越多
    red = 255;
    green = 255 - (number - 60) * step
  } else {
    // number可能超过120视同120
    red = 255
  }
  let rgb = [parseInt(red), parseInt(green), parseInt(blue)]
  return rgbArrayToHex(rgb)
}

// 2个日期之间相隔了多少天
const daysInBtw = function(startD, endD) {
  return parseInt((endD.getTime() - startD.getTime()) / 1000 / 24 / 3600)
}

const getOrElse = function(option, defaultValue) {
  if (option && option != null) {
    return option
  } else {
    return defaultValue
  }
}

// Given申请人的apply日期，进行categorize
const categorize = function(monthlyDataArray) {
  const now = new Date()
  // Get rid of time, but leave date.
  const today = new Date(formatDate(now))
  // 直接按照月份划分
  // 超过2年以上的资格已经失效，需要过滤掉
  let validDataArray = 
    monthlyDataArray.filter(monthlyData => {
      let pivotDate = new Date(monthlyData.year, monthlyData.month - 1, 1)
      let rangeInDays = (today.getTime() - pivotDate.getTime()) / 3600 / 24 / 1000
      return rangeInDays <= 731
    })
  // populate各个区间的数据
  let type1 = 0 // 一年半以上
  let type2 = 0 // 一年到一年半
  let type3 = 0 // 半年到一年
  let type4 = 0 // 半年以内
  validDataArray.forEach(monthlyData => {
    let pivotDate = new Date(monthlyData.year, monthlyData.month - 1, 1)
    let rangeInDays = (today.getTime() - pivotDate.getTime()) / 3600 / 24 / 1000
    // 使用360 / 360
    if (rangeInDays >= 540) {
      // 一年半以上
      type1 += monthlyData.cnt
    } else if (rangeInDays >= 360) {
      // 一年到一年半
      type2 += monthlyData.cnt
    } else if (rangeInDays >= 180) {
      // 半年到一年
      type3 += monthlyData.cnt
    } else {
      // 半年以内
      type4 += monthlyData.cnt
    }
  })
  
  return [
    { name : '一年半以上', value : type1 },
    { name : '一年到一年半', value : type2 },
    { name : '半年到一年', value : type3 },
    { name : '半年以内', value : type4 },
  ]
}

module.exports = {
  formatTime,
  formatDate,
  groupBy,
  yesterday,
  validateEmail : validateEmail,
  compareDates : compareDates,
  sortByProperty : sortByProperty,
  numberComparator : numberComparator,
  dateStrComparator : dateStrComparator,
  rgbArrayToHex : rgbArrayToHex,
  number2Hex : number2Hex,
  daysInBtw : daysInBtw,
  getOrElse : getOrElse,
  categorize : categorize
}