// pages/createDiscussion/createDiscussion.js
const app = getApp()
const log = require('../../utils/log')
const forumHelper = require('../../utils/forum')

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

    // 发布问题
    post() {
        log.info('开始发布问题')

        wx.showLoading()

        const self = this
        forumHelper.postArticle(
            3, 
            forumHelper.generateCommunityTopic(self.data.pId), 
            self.data.title, 
            self.data.contents, 
            self.data.imageUrls, 
            false
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

    // 返回论坛
    backToForum() {
        wx.navigateBack({
          delta: 1,
        })
    }
})