// pages/forum/forum.js
const app = getApp()
const log = require('../../utils/log')
const utils = require('../../utils/util')
const forumHelper = require('../../utils/forum')

Page({
    data: {
        // 与显示相关
        CustomBar: app.globalData.CustomBar,
        title: '',
        // 与文章query相关
        pId: '',
        type: '',
        // 所有此话题下的文章
        articles: [],
        page: 0,    //分页记录数
        pageSize: 5   //分页大小
    },

    onLoad: function (options) {
        log.info(`onLoad forum with options: ${options}`)

        this.setData({
            pId: options.pid,
            type: options.type, // 如3
            title: options.pname, // 如艾东苑
            page: 0,
            pageSize: 5
        }, () => {
            this.loadArticles(options)
        })
    },

    // 读取文章
    loadArticles(options) {
        log.info(`forum页开始读取文章列表page: ${this.data.page}, pageSize: ${this.data.pageSize}`)
        
        const communityTopic = forumHelper.generateCommunityTopic(this.data.pId)
        
        wx.showLoading({ title: '读取ing~' })

        const self = this
        forumHelper.getArticles(3, communityTopic, this.data.page, this.data.pageSize).then(res => {
            if (res == null) {
                // 已经没有更多的文章了
                wx.hideLoading()
                wx.showToast({ title: '真的没了' })
            } else {
                const newArticles = res.result.articles
                newArticles.forEach(article => {
                    article['timedistance'] = utils.getTimeDistance(article.create_gmt)
                })

                self.setData({
                    page: self.data.page + 1,
                    articles: self.data.articles.concat(newArticles)
                })
                wx.hideLoading()
            }
            if(options['aid'] != undefined && options['aid'] != '') {
                let discussionType = ''
                if(options['discussionType'] != undefined && options['discussionType'] != '') {
                    discussionType = `&type=${options['discussionType']}`
                }
                wx.navigateTo({
                    url: '/pages/discussion/discussion?aid=' + options['aid'] + '&pid=' + self.data.pId + discussionType,
                })
            }
        }).catch(err => {
            log.error(err)
            console.log(err)

            wx.hideLoading()
            wx.showToast({
              title: '出问题啦',
              icon: 'error'
            })
        })
    },

    // 其他Page使用的reload方法
    reload() {
        log.info('reload forum Page')

        this.setData({
            page: 0,
            pageSize: 5,
            articles: []
        }, () => {
            this.loadArticles()
        })
    },

    // 返回上一页
    backToParent() {
        wx.navigateBack({ delta: 1 })
    },

    // 路由到创建新话题页
    goToNewDiscussion() {
        wx.navigateTo({
          url: '/pages/createDiscussion/createDiscussion?pid=' + this.data.pId + '&type=2'
        })
    },

    // 路由到留言板
    goToKanban(e) {
        let self = this
        wx.navigateTo({
          url: '/pages/discussion/discussion?aid=' + forumHelper.generateCommunityTopic(this.data.pId) + '&type=0' + '&pid=' + self.data.pId
        })
    },

    // 路由到某个文章详情
    goToDetail(e) {
        let self = this
        wx.navigateTo({
          url: '/pages/discussion/discussion?aid=' + e.currentTarget.dataset.aid + '&pid=' + self.data.pId,
        })
    },

    // 即将触底时触发新的loading
    onReachBottom(e) {
        log.info('开始读取新一页的数据')

        this.loadArticles()
    },


    // 分享该页面
    onShareAppMessage: function () {
        let self = this
        var path = '/pages/today/today'
        var params = `pid=${self.data.pId}&forum=1`
        path = path + '?' + params
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
    }
})