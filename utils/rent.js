const log = require('../utils/log')

// 调用home接口获取所有租房信息
const loadRentList = function(openid, page, pageSize) {
  log.info('请求rentList from云函数')
  
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'home',
      data: {
        openid : openid,
        page: page,
        pageSize : pageSize,
      },
      success: (res) => {
        log.info('成功获取到房屋信息列表')

        if (res.result.articles != null && res.result.articles.length > 0) {
          log.info(`读取到: ${res.result.articles.length}条房屋信息`)
          resolve(res)
        } else {
          log.info('暂无房屋信息发布')
          resolve(null)
        }
      },
      fail: (err) => {
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '获取失败',
          icon: 'error'
        })

        resolve(null)
      }
    })
  })
}

// 获得某个文章（发布的租房信息）的详情
const getArticle = function(aid) {
  log.info(`试图获取租房详情文章(${aid})`)

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getArticle',
      data: { aid: aid },
      success: (res) => {
        log.info('租房文章获取成功')

        if (res.result.article) {
          resolve(res.result.article)
        } else {
          log.error('未能找到租房文章详情')
          reject()
        }
      },
      fail: (err) => {
        console.log(err)
        log.error(`租房文章获取失败(${aid})`)
        log.error(err)
        
        reject()
      }
    })
  })
}

module.exports = {
  loadRentList: loadRentList,
  getArticle: getArticle
}