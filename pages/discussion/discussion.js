// pages/discussion/discussion.js
const log = require('../../utils/log')
const app = getApp()
const forumHelper = require('../../utils/forum')
const commentsHelper = require('../../utils/comments')

Page({

    data: {
        aid: null,
        article: null,
        // 评论
        myComments: '',
        commentInputHeight : 0 // 初始化的时候尚未on focus，所以贴地板
    },

    onLoad: function (options) {
        log.info(`onLoad discussion with options: ${options}`)

        this.setData({
            aid: options.aid
        }, () => {
            this.loadArticle()
        })
    },

    // 根据aid拿到文章详情
    loadArticle() {
        log.info(`即将query文章(${this.data.aid})`)

        wx.showLoading({ title: 'Loadng ...' })

        const self = this
        forumHelper.getArticle(self.data.aid).then(res => {
            self.setData({
                article: res.result.article
            })

            wx.hideLoading()
        }).catch(err => {
            log.error(err)
            console.log(err)

            wx.hideLoading()
            wx.showToast({
              title: '出错啦',
              icon: 'error'
            })
        })
    },

    // 根据aid拿到文章的所有评论
    loadComments() {
        log.info('读取评论')
        
        wx.showLoading({ title: '加载评论' })

        const self = this
        commentsHelper.getCommentsOf(self.data.aid).then(res => {
            if (res.result.code == 200) {
                // 加载成功
                self.setData({
                    comments: res.result.data
                })
                wx.hideLoading()
            } else {
                // 加载失败
                log.error(res)

                wx.hideLoading()
                wx.showToast({
                  title: '加载失败',
                  icon: 'error'
                })
            }
        }).catch(err => {
            log.error(err)
            console.log(err)

            wx.hideLoading()
            wx.showToast({
              title: '加载失败',
              icon: 'error'
            })
        })
    },

    // 焦点落在输入框上面的时候
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

    // 发布评论
    submitComment() {
        log.info('点击发布评论')

        wx.showLoading({ title: '正在上传...' })

        const self = this
        commentsHelper.submitComment(self.data.aid, self.data.myComments).then(() => {
            self.setData({
                myComments: ''
            }, () => {
                wx.hideLoading()
                self.loadArticle()
            })
        }).catch(err => {
            log.error(err)
            console.log(err)
            
            wx.hideLoading()
            wx.showToast({
              title: '上传失败',
              icon: 'error'
            })
        })
    },

    onShareAppMessage: function () {

    }
})