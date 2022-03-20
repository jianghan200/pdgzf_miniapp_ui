const constants = require('./constants')
const app = getApp()
// 从后端获得信息流文章
// 输入 pageSize: 一页多少文章, pageNum: 第几页
const getNewsStream = function(pageSize, pageNum) {
  const url = constants.userinfoServer + '/api/article/list?pageSize=' + pageSize + '&pageNum=' + pageNum
  const token = app.globalData.userinfo.tokenStr
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: { 'token' : token },
      method: 'GET',
      success: res => {
        return resolve(res)
      }
    })
  })
}

module.exports = {
  getNewsStream: getNewsStream
}