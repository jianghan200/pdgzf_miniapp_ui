// pages/report/report.js
const constants = require('./../../utils/constants')
const requestsHelper = require('./../../utils/request')
const app = getApp()
const log = require('../../utils/log')
const util = require('../../utils/util')
Page({
  data: {
    jiraTypes : constants.jiraTypes,
    jIdx : 0,
    desc : '',
    imgList: [],
    email: '',
    // 错误提示
    errorMsgs: []
  },

  onLoad: function (options) {
    log.info('进入问题反馈页')

    this.setData({
      jiraTypes : app.globalData.userinfo.type == 2 ? constants.vipJiraTypes : constants.commonJiratypes,
      jIdx : 0,
      desc : '',
      imgList : [],
      email : '',
      errorMsgs : []
    })
  },

  // 选择问题类型
  selectJiraType(e) {
    this.setData({
      jIdx : e.detail.value
    })
  },

  // 输入email
  inputEmail(e) {
    this.setData({
      email : e.detail.value.trim()
    })
  },

  // 输入问题描述
  inputDesc(e) {
    this.setData({
      desc : e.detail.value.trim()
    })
  },

  // 预览已上传的图片
  previewImg(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },

  // 删除已经上传的图片
  delImg(e) {
    wx.showModal({
      title: '删除图片',
      content: '确定要删除这张图片吗？',
      cancelText: '算了',
      confirmText: '删！',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            imgList: this.data.imgList
          })
        }
      }
    })
  },

  // 上传图片
  chooseImg(e) {
    let self = this
    wx.chooseImage({
      count: 4, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album'], // 从相册选择
      success: (res) => {
        if (self.data.imgList.length != 0) {
          this.setData({
            imgList: this.data.imgList.concat(res.tempFilePaths)
          })
        } else {
          this.setData({
            imgList: res.tempFilePaths
          })
        }
      }
    });
  },

  // 递交反馈
  submit(e) {
    // 检查描述是否为空
    if (this.data.desc.trim().length == 0) {
      log.warn('用户问题描述为空')

      wx.showToast({
        title: '描述不能为空',
        icon: 'error'
      })
    } else if (!util.validateEmail(this.data.email.trim())) {
      // 检查Email是否合法
      log.warn('用户输入的email不合法')

      wx.showToast({
        title: 'Email有误',
        icon: 'error'
      })
    } else {
      let self = this
      // 向wordpress POST Feedback
      log.info(`向wordpress发送Feedback（jiratype: ${self.data.jiraTypes[self.data.jIdx]}）`)
      log.info(`向wordpress发送Feedback（jiratype: ${self.data.desc}）`)
      log.info(`向wordpress发送Feedback（jiratype: ${self.data.email}）`)

      requestsHelper.postFeedback(
        self.data.jiraTypes[self.data.jIdx], 
        self.data.desc,
        self.data.email
      ).then((postId) => {
        // if (postId != -1) {
        //   log.info('Feedback（描述）上传成功！')
        //   console.info('Feedback（描述）上传成功！')
          
        //   // 向后端上传图片list
        //   requestsHelper.sendAllFeedbackImgs(self.data.imgList, postId).then((res) => {
        //     if (res) {
        //       log.info(`成功上传全部图片`)
        //     } else {
        //       log.error('图片list上传失败')
        //     }
        //   })
        // } else {
        //   log.error(`未能成功向wordpress后端上传Feedback（描述）`)
        // }
        wx.showToast({
          title: '反馈失败',
          icon: 'success'
        })

        wx.redirectTo({
          url: '/pages/user/user',
        })
      }).catch(err => {
        log.error(`未能成功向wordpress后端上传Feedback（描述）`)
        log.error(err)

        wx.showToast({
          title: '反馈失败',
          icon: 'error'
        })
      })
    }
  }
})