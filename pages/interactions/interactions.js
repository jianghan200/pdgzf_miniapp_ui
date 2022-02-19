const app = getApp()
const log = require('../../utils/log')
const userInteractionHelper = require('../../utils/user')

Page({
    data: {
        // 内容列表的标题
        title: '未读回复（0条）',
        // 当前的模式：0: 未读; 1: 评论; 3: 回复; 4: 文章
        mode: 0,
        // 0: 未读; 1: 评论; 3: 回复; 4: 文章
        unreadMsgs: [],
        comments: [],
        replies: [],
        posts: []
    },

    onLoad: function (options) {
        log.info('onLoad interactions')

        this.populateInteractions()
    },

    // 从storage中读取出来interactions
    populateInteractions() {
        wx.showLoading({ title: 'Loading...' })

        userInteractionHelper.getUserInteractions().then(interactions => {
            log.info(`在storage中找到了interactions`)

            this.setData({
                unreadMsgs: interactions.unread,
                comments: interactions.comments,
                replies: interactions.replies,
                posts: interactions.posts
            }, () => {
                wx.hideLoading()
            })
        }).catch(err => {
            log.error(err)
            console.log(err)

            wx.showToast({ title: '数据出错', icon: 'error' })
            wx.hideLoading()
        })
    },

    // 点击顶层按钮
    handleIconClick(e) {
        this.setData({ 
            mode: e.currentTarget.dataset.mode 
        }, () => this.resolveTitle())
    },

    // 根据mode code生成内容的标题
    resolveTitle() {
        switch(this.data.mode) {
            case '0': 
                this.setData({ title: `未读回复（${this.data.unreadMsgs.length}条）` })
                break;
            case '1':
                this.setData({ title: `我的评论（${this.data.comments.length}条）` })
                break;
            case '2':
                this.setData({ title: `回复我的（${this.data.replies.length}条）` })
                break;
            case '3':
                this.setData({ title: `我的文章（${this.data.posts.length}条）` })
                break;
            default:
                log.error(`不支持此mode：${this.data.mode}`)
                break;
        }
    },

    // 进入文章
    gotoDiscussion(e) {
        const aid = e.currentTarget.dataset.aid
        const unreadid = e.currentTarget.dataset.unreadid

        if (unreadid) {
            // 因为是未读消息，点击卡片唤起mark as read
            userInteractionHelper.markAsRead(unreadid).catch(err => {
                console.log(err)
                log.error(err)
                
                wx.showToast({ title: '请求有误', icon: 'error' })
            })
        }

        log.info(`跳转到文章：${aid}`)

        if (aid.indexOf('pdgzf_project_') != -1) {
            // 是留言板
            wx.navigateTo({
              url: '/pages/discussion/discussion?aid=' + aid + '&type=0',
            })
        } else {
            // 是用户创建文章
            wx.navigateTo({
              url: '/pages/discussion/discussion?aid=' + aid,
            })
        }
    }
})