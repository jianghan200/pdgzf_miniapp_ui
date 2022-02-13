// pages/rent/rentList.js
const app = getApp();
const util = require('../../utils/util');
const log = require('../../utils/log')
const requestHelper = require('../../utils/request')
const rentHelper = require('../../utils/rent');

Page({
  data: {
    allArticles: [],
    page: 0,    //分页记录数
    pageSize: 5,   //分页大小
    refreshData: true,
    // 未读信息数量
    unreadCount: 0
  },

  onLoad: function (options) {
    log.info('onLoad rentList')

    // 设置未读信息数量
    this.setData({ unreadCount: app.globalData.unread })

    const self = this
    let aid = options['aid']
    // 用户必须提供头像和昵称
    requestHelper.getAvatarAndNickname().then((res) => {
      if (res) {
        // 得到了用户的头像和昵称 或 用户授权
        self.getRentListOfCurrentPage(aid)
      } else {
        // 用户未授权
        wx.redirectTo({
          url: '/pages/today/today',
        })
      }
    }).catch((err) => {
      log.error(err)
      log.error('回到首页')
      
      wx.redirectTo({
        url: '/pages/today/today',
      })
    })
  },

  // 获取某页的文章列表
  getRentListOfCurrentPage(aid) {
    const openId = app.globalData.userinfo.openId
    const self = this
    
    if (self.data.refreshData) {
      wx.showLoading({ title: '加载ing～' })

      rentHelper.loadRentList(openId, self.data.page, self.data.pageSize).then((res) => {
        if (res == null) {
          // 没有任何信息
          wx.showToast({
            title: '真的没了',
            icon: 'none'
          })
        } else {
          // 有信息
          const newArticles = res.result.articles
          // 为每一个文章添加一些辅助信息
          newArticles.forEach(article => {
            article['create_gmt_simple'] = util.formatDate(new Date(article.create_gmt))
            article['timedistance'] = util.getTimeDistance(article.create_gmt)
          });
  
          self.setData({
            page: self.data.page + 1,
            allArticles: self.data.allArticles.concat(newArticles)
          })
        }
        wx.hideLoading()


        if(aid != undefined && aid != '') {
          // 来自分享
          wx.navigateTo({
            url: '../rentList/rentDetail?aid=' + aid,
          })
        }
      }).catch((err) => {
        console.log(err)
        self.setData({
          refreshData: false
        })
  
        wx.showToast({
          title: '获取失败',
          icon: 'error'
        })
  
        wx.hideLoading()
      })
    }
  },

  // 即将触底时触发新的loading
  onReachBottom(e) {
    log.info('开始读取新一页的数据')
    this.getRentListOfCurrentPage()
  },

  // 导航至房屋卡片详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../rentList/rentDetail?aid=' + id
    })
  },

  // 跳转到发布租房信息页
  goToAddNewPage () {
    wx.navigateTo({
      url: '../rentList/rentCreate'
    })
  },

  // Bottom Bar的方法, 导航至其他tab
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'rentList') {
      const url = `/pages/${newTab}/${newTab}`
      wx.redirectTo({
        url: url
      })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/rentList/rentList'
    return {
      title : 'PD公租房',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({
            title: '转发成功',
            icon: 'success'
          })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({
            title: '转发已取消',
          })
        } else {
          wx.showToast({
            title: '转发失败',
          })
        }
      }
    }
  },

})