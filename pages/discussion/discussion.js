// pages/discussion/discussion.js
const log = require('../../utils/log')
const app = getApp()
const forumHelper = require('../../utils/forum')
const commentsHelper = require('../../utils/comments')
const utils = require('../../utils/util')

Page({

    data: {
        aid: null,
        article: null,
        // 评论
        myComments: '',
        // 改变textarea的focus状态为true会弹出虚拟键盘
        onFocus: false,
        // 回复评论
        isResponding: false,
        parentCommentId: '',
        parentCommentUnionId: '',
        parentCommentUsername: ''
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
            const article = res.result.article
            article.update_gmt = utils.formatDate(new Date(article.update_gmt))

            // 对文章的全部回复进行整理
            article.comment.forEach(item => {
                item['timedistance'] = utils.getTimeDistance(item["create_gmt"])
                // 是否是个回复
                item['isRespond'] = item.parent_comment_id ? true : false
            })

            article.comment.forEach(item => {
                if (item.isRespond) {
                    item['parent_comment'] = article.comment.find(comment => comment._id == item.parent_comment_id).comment
                }
            })

            self.setData({
                article: article
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

    // 回复某人的评论
    respond(e) {
        log.info('回复他人评论')

        const parentCommentId = e.currentTarget.dataset.id
        const parentCommentUnionId = e.currentTarget.dataset.uid
        const parentCommentUsername = e.currentTarget.dataset.username
        
        this.setData({
            onFocus: true,
            isResponding: true,
            parentCommentId: parentCommentId,
            parentCommentUnionId: parentCommentUnionId,
            parentCommentUsername: parentCommentUsername
        })
    },

    // 焦点落在输入框上面的时候
    onFocusCommentInput(e) {
        log.info('点击了输入框')

        this.setData({
            onFocus: true
        })
    },

    // 输入结束即“blur”的时候触发，应该将input的高度还原成贴地板
    onBlurCommentInput(e) {
        log.info('完成了输入，输入框blur')

        this.setData({
            onFocus: false
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

        if (this.data.isResponding) {
            this.respondComment()
        } else {
            this.submitCommentsOnArticle()
        }
    },

    // 递交评论
    submitCommentsOnArticle() {
        log.info('直接评论文章')

        wx.showLoading({ title: '正在上传...' })

        const self = this
        commentsHelper.submitComment(self.data.aid, self.data.myComments).then(() => {
            // 回复上传成功，将本地的数据清理干净
            self.setData({
                myComments: ''
            }, () => {
                // 重新加载文章以看到自己的评论
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

    // 回复他人评论
    respondComment() {
        log.info('回复他人评论')

        wx.showLoading({ title: '正在上传...' })

        const self = this
        commentsHelper.respond(self.data.aid, self.data.myComments, 
            self.data.parentCommentId, self.data.parentCommentUnionId, self.data.parentCommentUsername).then(() => {
                // 回复上传成功，将本地的数据清理干净
                self.setData({
                    myComments: '',
                    isResponding: false,
                    parentCommentId: '',
                    parentCommentUnionId: '',
                    parentCommentUsername: ''
                }, () => {
                    // 重新加载文章以看到自己的评论
                    wx.hideLoading()
                    self.loadArticle()
                })
            }).catch(err => {
                log.error(err)
                console.log(err)
                
                self.setData({
                    isResponding: false,
                    parentCommentId: '',
                    parentCommentUnionId: '',
                    parentCommentUsername: ''
                })

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