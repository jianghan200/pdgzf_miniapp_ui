// pages/createDiscussion/createDiscussion.js
const app = getApp()
const log = require('../../utils/log')
const forumHelper = require('../../utils/forum')
const requestHelper = require('../../utils/request')

Page({
    data: {
        pId: '',
        title: '',
        contents: '',
        imageUrls: [],
        upperLimit: 9
    },

    onLoad: function (options) {
        this.setData({
            pId: options.pid,
            title: '',
            contents: '',
            imageUrls: [],
            upperLimit: 9
        })
    },

    // 处理title
    setTitle(e) {
        this.setData({ title: e.detail.value })
    },

    // 处理content
    setContents(e) {
        this.setData({ contents: e.detail.value })
    },

    // 让用户选择一张图片
    chooseImage: function (e) {
        const that = this;
        wx.chooseImage({
            sizeType: ['original','compressed'], //'original', 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                var files = that.data.imageUrls;
                var curLenth = files.length;

                log.info("本次选择:" + res.tempFilePaths.length);
                log.info("可选总数/当前总数:" + that.data.upperLimit + '/' + curLenth);

                for (var i = 0; i < that.data.upperLimit - curLenth; i++) {
                    if (res.tempFilePaths[i]) {
                        log.info("Add to files", i, res.tempFilePaths[i]);

                        files.push(res.tempFilePaths[i]);
                    }
                }
                that.setData({ imageUrls: files });
            }
        })
    },

    // 预览某一个图片
    previewImg(e) {
        const url = this.data.imageUrls[e.currentTarget.dataset.idx]
        const self = this
        wx.previewImage({
            urls: self.data.imageUrls,
            current: url,
            showmenu: false
        })
    },

    // 匿名发布问题
    postToCloud(anonymous) {
        log.info(`准备发布问题(${anonymous})`)

        wx.showLoading({ title: '发布中~' })

        const self = this
        forumHelper.postArticle(
            3, 
            forumHelper.generateCommunityTopic(self.data.pId), 
            self.data.title, 
            self.data.contents, 
            self.data.imageUrls, 
            anonymous
        ).then(() => {
            log.info('问题发布成功')

            wx.hideLoading()
            wx.showToast({
              title: '发布成功',
              icon: 'success'
            })

            self.backToForum()
        }).catch(err => {
            log.error(err)
            console.log(err)

            wx.hideLoading()
            wx.showToast({
              title: '发布失败',
              icon: 'error'
            })
        })
    },

    // 匿名发布问题
    anonymousPost() {
        log.info('准备匿名发布问题')

        this.postToCloud(true)
    },

    // 发布问题
    post() {
        log.info('准备实名发布问题')

        const self = this
        requestHelper.getAvatarAndNickname().then(res => {
            log.info('已经获得用户授权')

            if (res) {
                // 已经获得用户的头像和用户名
                self.postToCloud(false)
            } else {
                // 未获得用户的用户名和头像
                wx.showToast({
                  title: '授权失败',
                  icon: 'error'
                })
            }
        }).catch(err => {
            log.error(err)
            console.log(err)

            wx.showToast({
              title: '出错啦',
              icon: 'error'
            })
        })
    },

    // 返回论坛
    backToForum() {
        wx.navigateBack({
          delta: 1,
        })
    }
})