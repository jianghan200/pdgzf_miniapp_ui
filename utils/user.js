var app = getApp()
const log = require('./log')

const hasStartDate = function() {
  log.info(`判断用户是否有资格日`)
  log.info(app.globalData.userinfo)

  if (app.globalData.userinfo.type == 2 && app.globalData.userinfo.startDate && app.globalData.userinfo.startDate != null) {
    // 开启了自动选房的Vip，现在Vip也有可能没有选房资格日的信息。
    return 0
  } else if (!app.globalData.userinfo.manualStartDate || app.globalData.userinfo.manualStartDate == null) {
    // 不是vip，也没有输入过资格日
    return -1
  } else {
    // 输入过自己资格日
    return 1
  }
}

module.exports = {
  hasStartDate : hasStartDate
}