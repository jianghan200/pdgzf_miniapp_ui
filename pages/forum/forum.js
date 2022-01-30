// pages/forum/forum.js
const app = getApp()
const log = require('../../utils/log')
const utils = require('../../utils/util')

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
        pageSize: 5,   //分页大小
    },

    onLoad: function (options) {
        log.info(`onLoad forum with options: ${options}`)

        this.setData({
            pId: options.pid,
            type: options.type, // 如3
            title: options.pname // 如艾东苑
        })
    },

    // 读取文章
    loadArticles() {

    },

    // 返回上一页
    backToParent() {
        wx.navigateBack({ delta: 1 })
    },

    // 路由到创建新话题页
    goToNewDiscussion() {
        wx.navigateTo({
          url: '/pages/createDiscussion/createDiscussion?pid=' + this.data.pId,
        })
    },

    // 即将触底时触发新的loading
    onReachBottom(e) {
        log.info('开始读取新一页的数据')

        this.loadArticles()
    },
})