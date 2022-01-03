// pages/rent/rentDetail.js
const app = getApp();
const util = require('../../utils/util.js');
const log = require('./../../utils/log');
const requests = require('../../utils/request');
const rentHelper = require('../../utils/rent')

Page({
  data: {
    aid : null,
    article: null,
    // 评论相关
    myComments: '',
    commentInputHeight : 0, // 初始化的时候尚未on focus，所以贴地板
    commentsList: []
  },

  onLoad: function (options) {
    log.info(`onLoad rentDetail with options: ${options.aid}`)

    this.loadArticle(options.aid)
  },

  // 获得文章详情
  loadArticle(aid) {
    log.info(`获取文章详情，aid(${aid})`)

    const self = this
    wx.showLoading({ title: 'Loading...' })
    rentHelper.getArticle(aid).then(article => {
      // 对原始数据进行简单处理，方便展示
      article.update_gmt = util.formatDate(new Date(article.update_gmt))
      self.setData({
        aid: aid,
        article: article
      }, () => wx.hideLoading())
    }).catch(err => {
      console.log(err)
      log.error(err)

      wx.hideLoading()
      wx.showToast({
        title: '获取失败',
        icon: 'error'
      })
    })
  },

  // 评论功能
  // Focus on评论的输入栏，需要拉高input的高度
  onFocusCommentInput(e) {
    log.info('点击了输入框')

    this.setData({
      commentInputHeight : e.detail.height
    })
  },

  // 输入结束即“blur”的时候触发，应该将input的高度还原成贴地板
  onBlurCommentInput(e) {
    log.info('完成了输入，输入框blur')

    this.setData({
      commentInputHeight : 0
    })
  },

  // 输入评论
  inputComment(e) {
    this.setData({
      myComments : e.detail.value.trim()
    })
  },

  // 拿到最新的评论列表
  loadCommentList(pid) {
    let self = this
    log.info(pid)
    // 使用pId拿到comments
    requests
      .getCommentsOf(pid)
      .then((list) => {
        log.info(`拿到评论列表${list.length}`)

        if (list != null && list.length > 0) {
          for(var j = 0, len = list.length; j < len; j++) {
            list[j]["create_gmt_simple"] = list[j].create_gmt.substr(0,10)
            list[j]["timedistance"] = util.getTimeDistance(list[j]["create_gmt"]);
          }
        }
        this.data.article.comment = list;


        self.setData({
          article : this.data.article
        })
      }).catch((err) => {
        console.error(`未成功拿到评论列表`)
        console.error(err)
        log.error(`未成功拿到评论列表`)
        log.error(err)

        wx.showToast({
          title: '获取评论失败',
          icon: 'error'
        })
      })
  },

  // 上传评论
  submitComment(e) {
    log.info('点击上传评论')
    // 用户必须授权头像和用户名才能开始评论
    requests
      .getAvatarAndNickname()
      .then((res) => {
        if (res) {
          // 用户信息上传云函数成功
          log.info('云函数调用成功（both get and post），新用户同意提供头像和昵称')
          // 评论不能为空
          if (this.data.myComments.trim() != '') {
            log.info(`用户的评论为：${this.data.myComments}`)
            
            let self = this
            wx.showLoading({
              title: '提交中',
              mask:true
            })

            requests
              .sendCommentOnSomeProject(self.data.aid, self.data.myComments.trim())
              .then((res) => {
                if (res) {
                  // 评论发表成功！
                  log.info('成功发布评论')

                  wx.hideLoading()
                  wx.showToast({
                    title: '发布成功',
                    icon: 'success'
                  })
                  self.setData({
                    myComments: ''
                  })
                  // 发表成功之后需要重新读取评论列表
                  self.loadCommentList(self.data.aid)
                } else {
                  // 失败
                  log.error('发布失败')

                  wx.hideLoading()
                  wx.showToast({
                    title: '发布失败',
                    icon: 'error'
                  })
                }
              })
              .catch((err) => {
                log.error('发布失败')
                log.error(err)

                wx.hideLoading()
                wx.showToast({
                  title: '发布失败',
                  icon: 'error'
                })
              })
          } else {
            log.warn('用户的评论为空')
            // 评论为空
            wx.showToast({
              title: '啥也没说呀',
              icon: 'error'
            })
          }
        } else {
          log.warn('云函数调用失败（both get and post）或新用户不同意提供头像和昵称')

          wx.showToast({
            title: '很遗憾',
            icon: 'error'
          })
        }
      })
      .catch((err) => {
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '微信有bug',
          icon: 'error'
        })
      })
  }
})