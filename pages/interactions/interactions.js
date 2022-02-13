const app = getApp()
const log = require('../../utils/log')

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
        const interactions = wx.getStorageSync('interactions')
        if (interactions) {
            log.info(`在storage中找到了interactions: ${interactions}`)

            // 过滤出去一些测试时遗留的数据
            const validComments = interactions.comments.filter(comment => {
                return comment.aid && comment.aid != null
            })

            this.setData({
                unreadMsgs: interactions.unread,
                comments: validComments,
                replies: interactions.replies,
                posts: interactions.posts
            })
        } else {
            log.error('未能在storage中找到interactions')

            wx.showToast({ title: '数据出错', icon: 'error' })
        }
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
    }
})