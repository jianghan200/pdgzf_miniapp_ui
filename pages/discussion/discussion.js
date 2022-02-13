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
        parentCommentUsername: '',
        // 评论textarea的placeholder
        textPlaceHolder: '我的评论'
    },

    onLoad: function (options) {
        log.info(`onLoad discussion with options: ${options}`)

        this.setData({
            aid: options.aid,
            type: options.type
        }, () => {
            this.init()
        })
    },

    // 初始化方法
    init() {
        this.setData({
            textPlaceHolder: '我的评论'
        })
        if (this.data.type == 0) {
            // 是小区留言板
            this.loadComments()
        } else {
            // 是一个文章
            this.loadArticle()
        }
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
                item.avatarUrl = item.avatarUrl ? item.avatarUrl : ''
                item['timedistance'] = utils.getTimeDistance(item["create_gmt"])
                // 是否是个回复
                item['isRespond'] = item.parent_comment_id ? true : false
            })

            // 为每个有parent的评论锁定那个parent comment
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

    // 根据aid拿到所有留言，仅对留言板生效
    loadComments() {
        log.info('留言板准备读取所有评论')
        
        wx.showLoading({ title: 'Loading...' })

        const self = this
        commentsHelper.getCommentsOf(self.data.aid).then(res => {
            const comments = res.result.data
            // Enrich一些信息
            comments.forEach(comment => {
                comment.avatarUrl = comment.avatarUrl ? comment.avatarUrl : ''
                comment['timedistance'] = utils.getTimeDistance(comment.create_gmt)
                // 是否是个回复
                comment['isRespond'] = comment.parent_comment_id ? true : false
            })

            // 为每个有parent的评论锁定那个parent comment
            comments.forEach(comment => {
                if (comment.isRespond) {
                    comment['parent_comment'] = comments.find(c => c._id == comment.parent_comment_id).comment
                }
            })

            // 创造一个article object，因为此处都是留言，并没有文章。
            const article = {
                user_avatar: '/assets/pdgzf.jpeg',
                user_nickname: '网管',
                update_gmt: '2022-01-01',
                content: '畅所欲言~',
                title: '留言板',
                images: [],
                comment_count: comments.length,
                comment: comments
            }

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
            parentCommentUsername: parentCommentUsername,
            textPlaceHolder: `回复${parentCommentUsername ? parentCommentUsername : '匿名者'}`
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

    // 点击发送后选择匿名还是真名
    chooseCommentMode() {
        log.info('选择匿名 / 真名模式')
        
        const self = this
        wx.showActionSheet({
          itemList: ['发送', '匿名发送'],
          success: res => {
              if (res.tapIndex == 0) {
                // 选择真名发送
                self.submitComment()
              } else {
                // 选择匿名发送
                self.submitCommentAnonymously()
              }
          }
        })
    },

    // 实名发布评论
    submitComment() {
        log.info('实名发布评论')

        if (this.data.isResponding) {
            this.respondComment(false)
        } else {
            this.submitCommentsOnArticle(false)
        }
    },

    // 匿名发布评论
    submitCommentAnonymously() {
        log.info('匿名发布评论')

        if (this.data.isResponding) {
            this.respondComment(true)
        } else {
            this.submitCommentsOnArticle(true)
        }
    },

    // 评论文章
    submitCommentsOnArticle(isAnonymous) {
        log.info('直接评论文章')

        wx.showLoading({ title: '正在上传...' })

        const self = this

        if (isAnonymous) {
            // 匿名mode
            commentsHelper.submitCommentAnonymously(self.data.aid, self.data.myComments, self.data.article.uid).then(() => {
                // 回复上传成功，将本地的数据清理干净
                self.setData({
                    myComments: ''
                }, () => {
                    // 重新加载文章以看到自己的评论
                    wx.hideLoading()
                    self.init()
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
        } else {
            // 实名mode
            commentsHelper.submitComment(self.data.aid, self.data.myComments, self.data.article.uid).then(() => {
                // 回复上传成功，将本地的数据清理干净
                self.setData({
                    myComments: ''
                }, () => {
                    // 重新加载文章以看到自己的评论
                    wx.hideLoading()
                    self.init()
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
        }
    },

    // 回复他人评论
    respondComment(isAnonymous) {
        log.info('回复他人评论')

        wx.showLoading({ title: '正在上传...' })

        const self = this

        if (isAnonymous) {
            // 匿名mode
            commentsHelper.respondAnonymously(self.data.aid, self.data.myComments, 
                self.data.parentCommentId, self.data.parentCommentUnionId, self.data.parentCommentUsername, 
                self.data.article.uid).then(() => {
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
                        self.init()
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
        } else {
            // 实名mode
            commentsHelper.respond(self.data.aid, self.data.myComments, 
                self.data.parentCommentId, self.data.parentCommentUnionId, self.data.parentCommentUsername, 
                self.data.article.uid).then(() => {
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
                        self.init()
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
        }
    },

    onShareAppMessage: function () {

    }
})