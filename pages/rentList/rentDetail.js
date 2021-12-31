// pages/rent/rentDetail.js
var app = getApp();
var util = require('../../utils/util.js');
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
      app: app
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
      this.setData({ article:res.result.article })

      // load comment 
      this.reloadComment()
    }).catch(err => { console.error(err); });
    

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