// pages/stream/stream.js
const app = getApp()
const wpHelper = require('../../utils/wp')
const log = require('../../utils/log')
const userInfoHelper = require('../../utils/user')
const constants = require('../../utils/constants')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    pageNum: 1,
    vipPageNum: 1,
    articles: [],
    vipArticles: [],
    // Scroll行为的控制器
    curComponentId: 0,
    // Vip相关
    vipInfo: null,
    // 用户的头像和昵称
    nickname: '未知用户',
    avatarUrl: ''
  },

  onLoad(options) {
    // 继承自newbee页面
    if (options['tab'] && options['tab'] != '') {
      const tab = options['tab']
      let articleUrl = ''
      if (options['articleUrl'] && options['articleUrl'] != '') {
        articleUrl = '?articleUrl=' + options['articleUrl']
      }
      // 来自分享
      wx.navigateTo({ url: `/pages/${tab}/${tab}` + articleUrl })
    }

    // 不同身份看到的初始tab是不同的
    if (userInfoHelper.isNewUser()) {
      log.info('发现新用户，默认tab为新手村')
      // 新人，进入新手村tab
      this.setData({ curComponentId: 2 })
    }
    this.loadArticles(this.data.pageNum, 0)
    this.loadArticles(this.data.vipPageNum, constants.vip_wp_category)
    this.initNewbee()
  },

  // 从wp端读取文章列表
  loadArticles(pageNum, categoryType) {
    log.info(`正在读取文章(pageNum: ${pageNum}, categoryType: ${categoryType})`)
    wx.showLoading({ title: '加载中...' })

    const self = this
    wpHelper.get_WP_articles(pageNum, categoryType).then(res => {
      if (categoryType == 0) {
        // 在读取一般内容
        const newArticles = self.data.articles.concat(res)
        newArticles.forEach(article => {
          if (article['categories'].indexOf(constants.vip_wp_category) == -1) {
            // 一般文章
            article['isVipArticle'] = false
          } else {
            // VIP文章
            article['isVipArticle'] = true
          }
        })
        self.setData({ articles: newArticles, pageNum: pageNum })
      } else if (categoryType == constants.vip_wp_category) {
        // 在读取VIP内容
        const newArticles = self.data.vipArticles.concat(res)
        self.setData({ vipArticles: newArticles, vipPageNum: pageNum })
      }
      wx.hideLoading()
    }).catch(err => {
      log.error(err)
      wx.showToast({ title: '服务器出错', icon: 'error' })
      wx.hideLoading()
    })
  },

  // 加载更多文章
  loadMoreArticles(e) {
    log.info('点击加载更多文章')
    log.info(e)

    if (e.currentTarget.dataset.atype) {
      if (e.currentTarget.dataset.atype == 0) {
        // 加载另一页一般文章
        this.loadArticles(this.data.pageNum + 1, 0)
      } else if (e.currentTarget.dataset.atype == constants.vip_wp_category) {
        // 加载另一页vip文章
        this.loadArticles(this.data.vipPageNum + 1, constants.vip_wp_category)
      }
    }
  },
  
  // 新手村的初始化方法
  initNewbee() {
    log.info('初始化新手村模块')
    log.info(app.globalData.userinfo)

    this.setData({ vipInfo : app.globalData.userinfo })
    // open-id被禁用，只能向用户请求权限
    const self = this
    userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
      if (res !== null) {
        self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
      }
    })
  },

  // 打开某个文章
  openArticle(e) {
    log.info(`用户点击一个文章链接`)
    log.info(e)

    if (e.currentTarget.dataset.link) {
      log.info(`文章链接是: ${e.currentTarget.dataset.link}`)

      if (e.currentTarget.dataset.isvip) {
        log.info(`是一个VIP内容`)

        if (app.globalData.userinfo.type == 2) {
          log.info('是VIP，打开文章内容')
          // 是VIP打开文章
          wx.navigateTo({ url: '/pages/article/article?url=' + e.currentTarget.dataset.link })
        } else {
          log.info('非VIP，进入VIP权益页')
          // 非VIP，进入权益页
          wx.navigateTo({ url: '/pages/rights/rights' })
        }
      } else {
        log.info('非VIP内容，打开文章内容')
        // 非VIP内容，打开文章
        wx.navigateTo({ url: '/pages/article/article?url=' + e.currentTarget.dataset.link })
      }
    }
  },

  // 点击TabItem触发的handler
  selectTab(e) {
    this.setData({ curComponentId: e.currentTarget.dataset.id })
  },

  // 新手村导航至某个页面
  goToNewbeePage(e) {
    const page = e.currentTarget.dataset.page
    const url = `/pages/${page}/${page}`
    wx.navigateTo({ url: url })
  },

  // 转发
  onShareAppMessage: function(options) {
    const path = '/pages/stream/stream'
    return {
      title : 'PD公租房',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({ title: '转发成功', icon: 'success' })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({ title: '转发已取消' })
        } else {
          wx.showToast({ title: '转发失败', icon: 'error' })
        }
      }
    }
  }
})