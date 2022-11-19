const constants = require('./constants')
const log = require('./log')

// 获取公告
const getBroadcastMsgs = function() {
  log.info('准备获取公告信息')

  const url = constants.prodFeedbackServer + '/wp-json/wp/v2/posts?categories=7&_fields=author,id,content,title,link'

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      success: function(res) {
        if (res.statusCode == 200 || res.statusCode == 201) {
          log.info('公告获取成功')
          log.info(res)

          resolve(res.data)
        } else {
          log.error('公告获取失败，WP返回error')
          log.error(res)

          resolve([])
        }
      },
      fail: function(err) {
        log.error('公告获取出现错误')
        log.error(err)

        resolve([])
      }
    })
  })
}

// 获得WP的所有问题
const get_WP_articles = function(pageNum, categoryIds) {
  log.info(`试图获取WP文章列表(pageNum: ${pageNum}, categoryIds: ${categoryIds})`)

  // 如果categoryIds为空，则不需要添加这个参数到请求中
  const categoryParam = categoryIds.length == 0 ? '' : `&categories=${categoryIds.join(',')}`

  const url = constants.prodFeedbackServer + '/wp-json/wp/v2/posts?per_page=5&page=' + pageNum + categoryParam
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'GET',
      success: res => {
        log.info(res)

        if (res.statusCode == 200) {
          log.info('成功返回文章')
          // request成功返回并且结果符合预期
          return resolve(res.data)
        } else if (res.statusCode == 400) {
          log.info('找不到更多内容了')
          // 后端已经找不到更多内容了
          return resolve([])
        } else {
          log.error(`请求得到响应，但是后端返回statusCode: ${res.statusCode}`)
          // 虽然成功返回，但是遭遇了未知的问题
          return resolve(null)
        }
      },
      fail: err => {
        console.log(err)
        log.error(`请求WP文章列表失败 ${err}`)

        return reject(err)
      }
    })
  })
}

// 所有wp文章类别
const wp_article_categories = function() {
  const url = constants.prodFeedbackServer + '/wp-json/wp/v2/categories/?per_page=100&orderby=count'
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'GET',
      success: res => {
        return resolve(res.data)
      },
      fail: err => {
        console.log(err)
        log.error(`请求文章全类别失败. ${err}`)
  
        return reject(err)
      }
    })
  })
}

module.exports = {
  getBroadcastMsgs: getBroadcastMsgs,
  get_WP_articles: get_WP_articles,
  wp_article_categories: wp_article_categories
}