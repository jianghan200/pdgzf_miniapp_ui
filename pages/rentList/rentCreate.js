const app = getApp();
const utils = require('../../utils/util.js');
const log = require('../../utils/log')

// account: null
// autoChoose: 1
// email: "18825169013@163.com"
// emailExpireDate: null
// emailSubscription: 1
// id: 11
// loginDate: "2021-12-30 21:40:50"
// manualStartDate: "2020-10-12"
// name: "星空冰淇淋"
// openConsult: false
// openId: "o4Sva5AWDNq6ZAqUEAP8lQkTz72M"
// password: null
// realName: null
// serverAccountId: null
// startDate: null
// tokenStr: "34dc9091-756b-42a2-910f-fb5061ea0514"
// type: 0
// unionId: "oTmbiwqdRX59s99WzvROiqYljNho"

Page({
  data: {
    app: app.globalData,
    type: app.TYPE_POST,
    // 表单的fields
    title: '',
    content: '',
    maxfile: 3,
    files: [],
    cloudFilesPath:[],
    isPosting: false,
  },

  onLoad: function (options) {
    log.info('onLoad rentCreate')
  },

  // 处理title
  setTitle(e) {
    this.setData({
      title: e.detail.value
    })
  },

  // 处理content
  setContent(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 发布
  post: function () {
    log.info('开始发布图文信息')

    if (this.data.isPosting) {
      log.warn('isPosting is true，故不能执行此次发布')

      return;
    }

    const that = this;
    that.setData({ isPosting: true });
    // 输入检查
    if (that.data.content.trim() == '' || that.data.title.trim() == '') {
      log.warn('用户输入为空')

      wx.showModal({
        title: '内容为空',
        content: '带点干货，更多点赞哦',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            that.setData({ isPosting: false })
          }
        }
      });
      return;
    }

    // 是否有图片检查
    if (that.data.files.length <= 0) {
      log.warn('用户没有上传图片')

      wx.showModal({
        title: '没有图片',
        content: '请至少上传一张照片',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            that.setData({ isPosting: false })
          }
        }
      });
      return;
    }

    // 确认弹窗
    wx.showModal({
      title: '确认发布',
      content: '确定发布 ' + that.data.title + ' 吗？',
      success: (res) => {
        if (res.confirm) {
          log.info('用户确认发布')
          // 用户确认发布
          wx.showLoading({ title: '发布中...' })
          that.uploadContentsAndImages();
        } else {
          // 用户取消发布
          log.info('用户取消发布')
          that.setData({ isPosting: false })
        }
      }
    })
  },

  // 发布成功之后
  postPublish() {
    log.info('发布成功，即将redirect到rentList')

    wx.showToast({
      title: '发布成功',
      icon: 'success'
    })
    wx.redirectTo({
      url: '/pages/rentList/rentList',
    })
  },

  // 上传文章 + 图片
  uploadContentsAndImages() {
    log.info('开始上传图文')

    const that = this;
    // populate promises for image uploading
    var promises = [];
    for (var i = 0; i < that.data.files.length ; i++) {
      promises.push(
        wx.cloud.uploadFile({
          cloudPath: utils.generateUuid() + '.png',
          filePath: that.data.files[i],
          name: 'picture'
        })
      );
    }
    Promise.all(promises).then(res => {
      res.forEach((v, index) => {
        if (v == 'error') {
          log.error(`第${index + 1}个请求失败`)
          console.log('第' + (index + 1) + '个请求失败')
        } else {
          that.data.cloudFilesPath.push(v.fileID);
          that.setData({
            cloudFilesPath: that.data.cloudFilesPath
          });
        }
      })

      log.info(`图片上传完成`)

      that.postNewArticle()
    }).catch(error => {
      log.error(error)
      console.log(error)

      wx.showToast({
        title: '发布失败',
        icon: 'error'
      })

      wx.hideLoading()
    })
  },

  // 发布文章
  postNewArticle() {
    log.info('准备上传article')

    const that = this;
    const payload = {
      uid: app.globalData.userinfo.unionId,
      user_nickname: app.globalData.nickname,
      user_avatar: app.globalData.avatarUrl,
      complex_id: 1,
      title: that.data.title,
      content: that.data.content,
      type: 1,
      images: that.data.cloudFilesPath
    }

    wx.cloud.callFunction({
      name: 'newArticle',
      data: payload
    }).then(() => {
      log.info('文章发布成功')

      that.setData({ isPosting: false });
      that.postPublish()
      wx.hideLoading()
    }).catch(err => {
      console.log(err)
      log.error(err)

      wx.hideLoading()
    })
  },
 
  // 让用户选择一张图片
  chooseImage: function (e) {
    const that = this;
    wx.chooseImage({
      sizeType: ['original','compressed'], //'original', 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var files = that.data.files;
        var curLenth = files.length;

        log.info("本次选择:" + res.tempFilePaths.length);
        log.info("可选总数，当前总数:" + that.data.maxfile + curLenth);

        for (var i = 0; i < that.data.maxfile - curLenth; i++) {
          if (res.tempFilePaths[i]) {
            log.info("Add to files", i, res.tempFilePaths[i]);

            files.push(res.tempFilePaths[i]);
          }
        }
        that.setData({ files: files });
      }
    })
  },

  // 用户预览图片
  previewImage: function (e) {
    const that = this;
    const index = e.currentTarget.id.substr(4, e.currentTarget.id.length);
    wx.showActionSheet({
      itemList: ["预览", "删除此照片"],
      success: function (res) {
        if (res.tapIndex == 0) {
          wx.previewImage({
            current: that.data.files[index], // 当前显示图片的http链接
            urls: that.data.files // 需要预览的图片http链接列表
          })
        } else if (res.tapIndex == 1) {
          var files = that.data.files;
          files.splice(index, 1);
          that.setData({
            files: files
          });
        }
      }
    });
  }
})