const app = getApp()

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
    if (app.globalData.IOS == undefined) {
      return 1
    } else {
      return -1
    }
  } else {
    if (app.globalData.IOS == undefined) {
      return -1
    } else {
      return 1
    }
  }
}

// 比较两个string大小
const strComparator = function(str1, comparator) {
  if (str1 > comparator) {
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

const sliceOf = function(str) {
  if (str.indexOf('(') != -1) {
    return str.slice(str.indexOf('(') + 1, str.indexOf(')'))
  } else if (str.indexOf('（') != -1) {
    return str.slice(str.indexOf('（') + 1, str.indexOf('）'))
  } else {
    return str
  }
}

const base64_encode = function(str) {
  var c1, c2, c3;
  var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var i = 0, len = str.length, string = '';
 
  while (i < len) {
    c1 = str.charCodeAt(i++) & 0xff;
    if (i == len) {
      string += base64EncodeChars.charAt(c1 >> 2);
      string += base64EncodeChars.charAt((c1 & 0x3) << 4);
      string += "==";
      break;
    }
    c2 = str.charCodeAt(i++);
    if (i == len) {
      string += base64EncodeChars.charAt(c1 >> 2);
      string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      string += base64EncodeChars.charAt((c2 & 0xF) << 2);
      string += "=";
      break;
    }
    c3 = str.charCodeAt(i++);
    string += base64EncodeChars.charAt(c1 >> 2);
    string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
    string += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
    string += base64EncodeChars.charAt(c3 & 0x3F)
  }
  return string
}

const getTimeDistanceOf = function(str) {
  // 2014-10-29T18:00:00
  str = str.substr(0, 19)
  var ymd = str.split("T")[0];
  var ymd_arr = ymd.split("-");
  var hms = str.split("T")[1];
  var hms_arr = hms.split(":");

  var date1 = new Date(ymd_arr[0], ymd_arr[1] - 1, ymd_arr[2], hms_arr[0], hms_arr[1], hms_arr[2]);
  var date2 = new Date();    //结束时间  
  date2.setHours(date2.getHours() - 8);
  var date3 = date2.getTime() - date1.getTime();  //时间差的毫秒数  
  //计算出相差天数  
  var days = Math.floor(date3 / (24 * 3600 * 1000));

  //计算出小时数  

  var leave1 = date3 % (24 * 3600 * 1000);    //计算天数后剩余的毫秒数  
  var hours = Math.abs(Math.floor(leave1 / (3600 * 1000)));
  //计算相差分钟数  
  var leave2 = leave1 % (3600 * 1000);        //计算小时数后剩余的毫秒数  
  var minutes = Math.floor(leave2 / (60 * 1000))
  //计算相差秒数  
  // var leave3 = leave2 % (60 * 1000);      //计算分钟数后剩余的毫秒数  
  // var seconds = Math.round(leave3 / 1000);

  if (days > 0) {
    if (days / 365 >= 1) {
      return Math.floor(days / 365) + "年前";
    } else {
      return days + "天前";
    }
  } else {
    if (hours > 0) {
      return hours + "小时前";
    } else {
      if (minutes <= 3) {
        return "刚刚";
      } else {
        return minutes + "分钟前";
      }
    }
  }
}

// 矫正百度地图的坐标
const convert2TecentMap = function(lng, lat) {
  if (lng == '' && lat == '') {
    return {
      lng: '',
      lat: ''
    }
  }
  var x_pi = 3.14159265358979324 * 3000.0 / 180.0
  var x = lng - 0.0065
  var y = lat - 0.006
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi)
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi)
  var qqlng = z * Math.cos(theta)
  var qqlat = z * Math.sin(theta)
  return {
    lng: qqlng,
    lat: qqlat
  }
}

function generateUuid(length=5){
  return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
} 

function getTimeDistance(str) {
  // 2014-10-29T18:00:00
  str = str.substr(0,19)
  // console.log("Date input", str)
  var ymd = str.split("T")[0];
  var ymd_arr = ymd.split("-");
  var hms = str.split("T")[1];
  var hms_arr = hms.split(":");

  var date1 = new Date(ymd_arr[0], ymd_arr[1] - 1, ymd_arr[2], hms_arr[0], hms_arr[1], hms_arr[2]);
  var date2 = new Date();    //结束时间  
  date2.setHours(date2.getHours() - 8);
  var date3 = date2.getTime() - date1.getTime();  //时间差的毫秒数  
  //计算出相差天数  
  var days = Math.floor(date3 / (24 * 3600 * 1000));

  //计算出小时数  

  var leave1 = date3 % (24 * 3600 * 1000);    //计算天数后剩余的毫秒数  
  var hours = Math.abs(Math.floor(leave1 / (3600 * 1000)));
  //计算相差分钟数  
  var leave2 = leave1 % (3600 * 1000);        //计算小时数后剩余的毫秒数  
  var minutes = Math.floor(leave2 / (60 * 1000))
  //计算相差秒数  
  var leave3 = leave2 % (60 * 1000);      //计算分钟数后剩余的毫秒数  
  var seconds = Math.round(leave3 / 1000);
  //alert(" 相差 "+days+"天 "+hours+"小时 "+minutes+" 分钟"+seconds+" 秒");

  if (days > 0) {
    if (days / 365 >= 1) {
      return Math.floor(days / 365) + "年前";
    } else {
      return days + "天前";
    }
  } else {
    if (hours > 0) {
      return hours + "小时前";
    } else {
      if (minutes <= 3) {
        return "刚刚";
      } else {
        return minutes + "分钟前";
      }
    }
  }

  return "刚刚";
}

const generateArticleIdOf = function(pid) {
  return `pdgzf_project_${pid}`
}

const getRoute = function(page) {
  let url = page.route
  if(!url.startsWith("/")) {
    url = "/" + url
  }
  return url
}

const getParams = function(page) {
  let options = page.options
  var params = Object.keys(options).map(function (key) {
    return key + "=" + options[key]; 
  }).join("&");
  return params
}

// 比较微信的版本
const compareVersion = (v1, v2) => {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i])
    const num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
};

// 根据场景值判断是否应该展示公众号的引导组件
const officialAccountAvailableScenes = [1011, 1017, 1025, 1047, 1124]
const displayOfficialAccount = function() {
  if (app.globalData.scene) {
    if (officialAccountAvailableScenes.indexOf(app.globalData.scene) == -1) {
      return false
    } else {
      return true
    }
  } else {
    return false
  }
}

// 讲某个string复制到用户的clipboard
const copyToClipboard = function(str) {
  wx.setClipboardData({
    data: str,
    success: function (res) {
      wx.showToast({ title: '复制成功' })
    }
  })
}

// 生成论坛的url
const generate_flarum_url = function(webUrl) {
  const url = 'https://bbs.pdgzf.cn/api/wechatl?unionId=' + 
                app.globalData.userinfo.unionId + 
                '&nickname=' + app.globalData.userinfo.wxNickName + 
                '&avatarUrl=' + app.globalData.userinfo.wxAvatarUrl +
                '&url=' + webUrl
  return url
}

const getReqParam = function(urlStr) {
  if (typeof urlStr == "undefined") {
      // 获取url中"?"符后的字符串
      var url = decodeURI(location.search)
  } else {
      var url = "?" + urlStr.split("?")[1]
  }
  var theRequest = new Object()
  if (url.indexOf("?") != -1) {
      var str = url.substr(1)
      if(str.indexOf("&") != -1) {
        var strs = str.split("&")
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1])
        }
      } else {
        theRequest[str.split("=")[0]] = decodeURI(str.split("=")[1])
      }
  }
  return theRequest
}

// 判断两个数组的内容是否相等
function equ_array(a, b) {
  // 判断数组的长度
  if (a.length !== b.length) {
    return false
  } else {
    // 循环遍历数组的值进行比较
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false
        }
    }
    return true;
  }
}

/**
 * 将小程序的API封装成支持Promise的API
 * @params fn {Function} 小程序原始API，如wx.login
 */
const wxPromisify = fn => {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = function (res) {
        resolve(res)
      }

      obj.fail = function (res) {
        reject(res)
      }

      fn(obj)
    })
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
  dateStrComparator : dateStrComparator,
  strComparator: strComparator,
  rgbArrayToHex : rgbArrayToHex,
  number2Hex : number2Hex,
  daysInBtw : daysInBtw,
  getOrElse : getOrElse,
  categorize : categorize,
  sliceOf : sliceOf,
  base64_encode : base64_encode,
  getTimeDistanceOf : getTimeDistanceOf,
  convert2TecentMap : convert2TecentMap,
  generateUuid : generateUuid,
  getTimeDistance : getTimeDistance,
  generateArticleIdOf: generateArticleIdOf,
  getRoute: getRoute,
  getParams: getParams,
  compareVersion: compareVersion,
  displayOfficialAccount: displayOfficialAccount,
  copyToClipboard: copyToClipboard,
  generate_flarum_url: generate_flarum_url,
  getReqParam: getReqParam,
  equ_array: equ_array,
  wxPromisify: wxPromisify
}