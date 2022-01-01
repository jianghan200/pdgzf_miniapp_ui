// pages/rent/rentDetail.js
var app = getApp();
var util = require('../../utils/util.js');
const log = require('./../../utils/log');
const requests = require('../../utils/request');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    aid : null,
    actionType:"SHARE"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.aid = options.aid 
    this.setData({
      aid: options.aid, 
      // 评论相关
      myComments: '',
      commentInputHeight : 0, // 初始化的时候尚未on focus，所以贴地板
      commentsList: []
    });
    // load article detail， 没有用户信息的时候 uid 为空
    wx.cloud.callFunction({
      name: 'getArticle',
      // aid 文章id
      data: {
        aid: this.data.aid
      }
    }).then(res => {
      //用户通过分享页面进入，
      // if(res.result.user != null){
      //   app.globalData.user = res.result.user;
      //   app.globalData.complex = res.result.user;
      //   this.setData({
      //     user: res.result.user,
      //     complex: res.result.complex
      //   });
      //   wx.setStorageSync('user', res.result.user)
      //   wx.setStorageSync('complex', res.result.complex)
      // }

      console.log(res);
      //set article detail
      res.result.article.timedistance = util.getTimeDistance(res.result.article.create_gmt);
      var list = res.result.article.comment;
      if(list != null && list.length > 0){
        for(var j = 0, len = list.length; j < len; j++) {
          list[j]["create_gmt_simple"] = list[j].create_gmt.substr(0,10)
          list[j]["timedistance"] = util.getTimeDistance(list[j]["create_gmt"]);
        }
      }
      this.setData({ article:res.result.article })

      // load comment 
      // this.reloadComment()
    }).catch(err => { console.error(err); });

  },

  // 评论功能
  // Focus on评论的输入栏，需要拉高input的高度
  onFocusCommentInput(e) {
    log.info('点击了输入框')

    this.setData({
      commentInputHeight : e.detail.height
    })
  },

  // 输入结束即“blur”的时候触发，应该将input的高度还原成贴地板
  onBlurCommentInput(e) {
    log.info('完成了输入，输入框blur')

    this.setData({
      commentInputHeight : 0
    })
  },

  // 输入评论
  inputComment(e) {
    this.setData({
      myComments : e.detail.value.trim()
    })
  },

  // 拿到最新的评论列表
  loadCommentList(pid) {
    let self = this
    log.info(pid)
    console.log(pid)
    // 使用pId拿到comments
    requests
      .getCommentsOf(pid)
      .then((list) => {
        let comments = []
        console.log(`拿到评论列表`)
        console.log(list)
        if(list != null && list.length > 0){
          for(var j = 0, len = list.length; j < len; j++) {
            list[j]["create_gmt_simple"] = list[j].create_gmt.substr(0,10)
            list[j]["timedistance"] = util.getTimeDistance(list[j]["create_gmt"]);
          }
        }
        this.data.article.comment = list;


        self.setData({
          article : this.data.article
        })
      }).catch((err) => {
        console.error(`未成功拿到评论列表`)
        console.error(err)
        log.error(`未成功拿到评论列表`)
        log.error(err)

        wx.showToast({
          title: '获取评论失败',
          icon: 'error'
        })
      })
  },

  // 上传评论
  submitComment(e) {
    log.info('点击上传评论')
    requests
      .getAvatarAndNickname()
      .then((res) => {
        if (res) {
          // 用户必须授权头像和用户名才能开始评论
          // 用户信息上传云函数成功
          log.info('云函数调用成功（both get and post），新用户同意提供头像和昵称')

          // 评论不能为空
          if (this.data.myComments.trim() != '') {
            log.info(`用户的评论为：${this.data.myComments}`)
            
            let self = this
            wx.showLoading({
              title: '提交中',
              mask:true
            })

            requests
              .sendCommentOnSomeProject(self.data.aid, self.data.myComments.trim())
              .then((res) => {
                if (res) {
                  // 评论发表成功！
                  log.info('成功发布评论')

                  wx.hideLoading()
                  wx.showToast({
                    title: '发布成功',
                    icon: 'success'
                  })
                  // 发表成功之后需要重新读取评论列表
                  self.loadCommentList(self.data.aid)
                } else {
                  // 失败
                  log.error('发布失败')

                  wx.hideLoading()
                  wx.showToast({
                    title: '发布失败',
                    icon: 'error'
                  })
                }
              })
              .catch((err) => {
                log.error('发布失败')
                log.error(err)

                wx.hideLoading()
                wx.showToast({
                  title: '发布失败',
                  icon: 'error'
                })
              })
          } else {
            log.warn('用户的评论为空')
            // 评论为空
            wx.showToast({
              title: '啥也没说呀',
              icon: 'error'
            })
          }
        } else {
          log.warn('云函数调用失败（both get and post）或新用户不同意提供头像和昵称')

          wx.showToast({
            title: '很遗憾',
            icon: 'error'
          })
        }
      })
      .catch((err) => {
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '微信有bug',
          icon: 'error'
        })
      })
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})