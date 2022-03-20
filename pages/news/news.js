const app = getApp()
const newsHelper = require('../../utils/news')
const log = require('../../utils/log')
const utils = require('../../utils/util')

Page({
  data: {
    // 未读信息的数量
    unreadCount: 0,
    pageSize: 10,
    pageNum: 1,
    list: []
  },

  onLoad: function (options) {
    this.setData({ unreadCount: app.globalData.unread })

    this.loadArticles()
  },

  // 从后端获取文章
  loadArticles() {
    wx.showLoading({ title: '读取ing～' })

    const self = this
    newsHelper.getNewsStream(self.data.pageSize, self.data.pageNum).then(res => {
      log.info('成功获取文章')

      const newArticles = res.data.data.list

      newArticles.forEach(article => {
        article['createTime_text'] = utils.formatDate(new Date(article.createTime * 1000))
      })

      this.setData({
        list: self.data.list.concat(newArticles),
        pageNum: self.data.pageNum + 1
      })

      wx.hideLoading()
    }).catch(err => {
      log.error(err)
      console.log(err)

      wx.showToast({ title: '请求有误' })
      wx.hideLoading()
    })
  },

  // 打开文章
  goToArticle(e) {
    const url = e.currentTarget.dataset.url
    const id = e.currentTarget.dataset.id
    const article = this.data.list.find(article => article.id == id)
    if (article) {
      wx.showLoading({ title: '发送中...' })

      wx.cloud.callFunction({
        name: 'notification',
        data: {
          openId: app.globalData.userinfo.openId,
          url: url,
          title: article.title,
          createTime: utils.formatDate(new Date(article.createTime * 1000))
        }
      }).then(() => {
        wx.showToast({ title: '请查看微信' })

        wx.hideLoading()
      }).catch(err => {
        wx.showToast({ title: '发送失败', icon: 'error' })
        console.log(err)

        wx.hideLoading()
      })
    }
  },

  // Bottom Bar的方法
  redirect: function(e) {
    const newTab = e.detail
    // 只要不是news那就redirect
    if (newTab != 'news') {
      wx.redirectTo({ url: `/pages/${newTab}/${newTab}` })
    }
  },

  // Top Bar的重定向方法
  topBarRedirect(e) {
    const newTab = e.detail
    if (newTab != 'news') {
      wx.redirectTo({ url: `/pages/${newTab}/${newTab}` })
    }
  },

  // 即将触底时触发新的loading
  onReachBottom(e) {
    log.info('开始读取新一页的数据')

    this.loadArticles()
  },
  
  onShareAppMessage: function () {

  }
})