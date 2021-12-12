var app = getApp()
const log = require('./log')

const hasStartDate = function() {
  log.info(`判断用户是否有资格日`)
  log.info(app.globalData.userinfo)

  if (app.globalData.userinfo.type == 2) {
    // 已经成功成为vip肯定是有资格日的
    return 0
  } else {
    // 非vip
    if (!app.globalData.userinfo.manualStartDate || app.globalData.userinfo.manualStartDate == null) {
      // 非vip也没有模拟过自己的资格日
      return -1
    } else {
      // 已经模拟过自己的资格日
      return 1
    }
  }
}

module.exports = {
  hasStartDate : hasStartDate
}