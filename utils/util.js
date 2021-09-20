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

module.exports = {
  formatTime,
  formatDate,
  groupBy,
  yesterday,
  validateEmail : validateEmail,
  compareDates : compareDates,
  sortByProperty : sortByProperty,
  numberComparator : numberComparator,
  dateStrComparator : dateStrComparator
}
