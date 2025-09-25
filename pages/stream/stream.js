// pages/stream/stream.js
const app = getApp()
const wpHelper = require('../../utils/wp')
const log = require('../../utils/log')
const userInfoHelper = require('../../utils/user')
const constants = require('../../utils/constants')
const utils = require('../../utils/util')

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
    avatarUrl: '',
    // 筛选器抽屉
    openDrawer: false,
    // 筛选器
    selected_categories: [],
    all_categories: [],
    // 用于name2id，保留了WP支持的类目的全集，且为原始数据
    full_set_of_wp_categories: [],
    // 打开筛选器之前的selected_categories
    before_selected_categories: []
  },

  onLoad(options) {
    // 继承自newbee页面
    if (options['curComponentId'] && options['curComponentId'] != '') {
      this.setData({ curComponentId: options['curComponentId'] })
      this.initCategories()
    }
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
    this.initCategories()
    this.loadArticles(this.data.pageNum, [])
    this.loadArticles(this.data.vipPageNum, [constants.vip_wp_category])
    this.initNewbee()
  },
  
  onShow(){
    this.initNewbee()
  },

  // init categories
  initCategories() {
    const self = this
    wpHelper.wp_article_categories().then(categories => {
      const category_names = 
        categories.filter(c => {
          return c.count > 0 && constants.excluded_wp_category_ids.indexOf(c.id) == -1
        }).map(c => c.id == 1 ? '通用' : c.name)

      self.setData({ 
        full_set_of_wp_categories: categories,
        all_categories: category_names, 
        selected_categories: category_names.concat([]) 
      })
    }).catch(err => {
      console.log(err)
    })
  },

  // 从wp端读取文章列表
  loadArticles(pageNum, categoryIds) {
    log.info(`正在读取文章(pageNum: ${pageNum}, categoryIds: ${categoryIds})`)
    wx.showLoading({ title: '加载中...' })

    const self = this
    wpHelper.get_WP_articles(pageNum, categoryIds).then(res => {
      if (res == null) {
        // resolve了但是为null，说明request得到了响应，但是后端出现了一些问题
        wx.showToast({ title: '服务器出错', icon: 'none' })
      } else if (res.length == 0) {
        // resolve了但是结果为空[], 说明request得到了响应，但是找不到更多的文章了
        wx.showToast({ title: '找不到更多内容了', icon: 'none' })
      } else {
        // 正常，有文章返回
        if (categoryIds.length == 1 && categoryIds[0] == constants.vip_wp_category) {
          // 在读取VIP内容
          const newArticles = self.data.vipArticles.concat(res)
          self.setData({ vipArticles: newArticles, vipPageNum: pageNum })
        } else {
          // 在读取一般内容
          const newArticles = self.data.articles.concat(res)
          // vip文章有可能带着别的类别，所以还是要甄别一下。
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
        }
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
        // 根据用户选择的类别重新获取WP文章
        const selected_categoryIds = 
          this.data.selected_categories.map(cname => this.category_name2id(cname)).filter(id => id != -1)
        if (selected_categoryIds.length == 0) {
          this.loadArticles(this.data.pageNum + 1, [])
        } else {
          this.loadArticles(this.data.pageNum + 1, selected_categoryIds)
        }
      } else if (e.currentTarget.dataset.atype == constants.vip_wp_category) {
        // 加载另一页vip文章
        this.loadArticles(this.data.vipPageNum + 1, [constants.vip_wp_category])
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
    // userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
    //   if (res !== null) {
    //     self.setData({ nickname: res.wxNickName, avatarUrl: res.wxAvatarUrl })
    //   }
    // })

    if (userInfoHelper.has_weixin_nickNameAndAvatar()) {
      self.setData({ 
        nickname: app.globalData.userinfo.wxNickName, 
        avatarUrl: app.globalData.userinfo.wxAvatarUrl 
      })
    } else {
      // 使用默认值
      self.setData({ 
        nickname: '游客', 
        avatarUrl: '../../assets/cat.jpeg' 
      })
    }
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
          wx.navigateTo({ url: '/pages/article/article?url=' + e.currentTarget.dataset.link + '&curComponentId=' + this.data.curComponentId})
        } else {
          log.info('非VIP，进入VIP权益页')
          // 非VIP，进入权益页
          wx.navigateTo({ url: '/pages/rights/rights' })
        }
      } else {
        log.info('非VIP内容，打开文章内容')
        // 非VIP内容，打开文章
        wx.navigateTo({ url: '/pages/article/article?url=' + e.currentTarget.dataset.link + '&curComponentId=' + this.data.curComponentId})
      }
    }
  },

  // 点击TabItem触发的handler
  selectTab(e) {
    this.setData({ curComponentId: e.currentTarget.dataset.id })
  },

  // 搜索文章名
  searchArticle(e) {
    console.log(e.detail.value)
  },

  // 打开筛选器
  openFilterDrawer(e) {
    if (e.currentTarget.dataset.beforecategorynames) {
      this.setData({ before_selected_categories: e.currentTarget.dataset.beforecategorynames })
    }
    this.setData({ openDrawer: true })
  },

  // 关闭筛选器
  closeFilterDrawer(e) {
    // 如果用户的selected_categories没有任何变化，不需要做任何操作，关闭drawer即可
    if (e.currentTarget.dataset.selectedcategorynames) {
      const after_selected_category_names = e.currentTarget.dataset.selectedcategorynames
      if (!utils.equ_array(after_selected_category_names, this.data.before_selected_categories)) {
        this.applyFilter()
      }
    }
    this.setData({ openDrawer: false })
  },

  // 应用筛选器
  applyFilter() {
    // 根据用户选择的类别重新获取WP文章
    const selected_categoryIds = 
      this.data.selected_categories.map(cname => this.category_name2id(cname)).filter(id => id != -1)
    const self = this
    if (selected_categoryIds.length == 0) {
      // 用户有可能没有选择任何类别，然后apply了filter，此时应该默认用户是误操作，将状态reset成初始状态，然后加载文章
      self.setData({ selected_categories: self.data.all_categories, articles: [] })
      self.loadArticles(1, [])
    } else {
      // pageNum需要被reset成1, 文章列表也要被清空
      this.setData({ articles: [] })
      this.loadArticles(1, selected_categoryIds)
    }
  },

  // 根据类目名称找到类目ID
  category_name2id(categoryName) {
    if (categoryName.trim() == '通用') {
      // 由于显示原因，我们对Uncategory做了处理，显示为“通用”。
      return constants.vip_wp_category
    } else {
      const candidates = 
        this.data.full_set_of_wp_categories.filter(c => {
          if (c.name.indexOf(categoryName) == -1) {
            return false
          } else {
            return true
          }
        })
      if (candidates.length > 0) {
        return candidates[0].id
      } else {
        return -1
      }
    }
  },

  // 选择了文章类别
  tapCategory(e) {
    const tappedCategoryName = e.currentTarget.dataset.categoryname
    if (tappedCategoryName == 'all') {
      // 选择了全部类别
      // 可能是deselect All或者select All
      if (this.data.all_categories.length != this.data.selected_categories.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({ selected_categories : this.data.all_categories })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({ selected_categories : [] })
      }
    } else {
      // tap的并不是all
      const cur_selected_categories = this.data.selected_categories.concat([])
      if (cur_selected_categories.indexOf(tappedCategoryName) == -1) {
        // 是选中
        cur_selected_categories.push(tappedCategoryName)
        this.setData({ selected_categories : cur_selected_categories })
      } else {
        // 是deselect
        cur_selected_categories.splice(cur_selected_categories.indexOf(tappedCategoryName), 1)
        this.setData({ selected_categories : cur_selected_categories })
      }
    }
  },

  // 新手村导航至某个页面
  goToNewbeePage(e) {
    const page = e.currentTarget.dataset.page
    const url = `/pages/${page}/${page}?curComponentId=${this.data.curComponentId}`
    wx.navigateTo({ url: url })
  },

  // 转发
  onShareAppMessage: function(options) {
    const path = '/pages/stream/stream?curComponentId=' + this.data.curComponentId
    return {
      title : '公租房新鲜事',
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