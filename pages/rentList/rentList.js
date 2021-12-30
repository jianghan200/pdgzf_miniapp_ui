// pages/rent/rentList.js
var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    isCard:true,
    articles: [1, 2],
    allArticles: [],
    page: 0,    //分页记录数
    pageSize: 20,   //分页大小
    refreshData: true,
  },
  isCard(e) {
    this.setData({
      isCard: e.detail.value
    })
  },
  goToDetail (event) {
    var passIn = event.currentTarget.dataset;
    var target = null;
    target = "../rentList/rentDetail?aid=" + passIn.id;
    wx.navigateTo({
      url: target
    })
  },

  addNewRent () {

    var target = null;
    target = "../rentList/rentCreate";
    wx.navigateTo({
      url: target
    })
  },

  loadHomePageData(){
    var that = this;
    wx.cloud.callFunction({
        name: 'home',
        data: {
          openid : this.data.openid,
          page: this.data.page,
          pageSize : this.data.pageSize,
        }
      }).then(res => {
        console.log(res);
        if(res.result.articles != null && res.result.articles.length > 0){
          for(var j = 0,len = res.result.articles.length; j < len; j++) {
            res.result.articles[j]["create_gmt_simple"] = res.result.articles[j].create_gmt.substr(0,10)
            res.result.articles[j]["timedistance"] = util.getTimeDistance(res.result.articles[j]["create_gmt"]);
          }
          that.setData({
            page: that.data.page + 1,
            user: res.result.user
          });

          if(that.data.refreshData){//true为重新刷新数据，false为分页累加数据
            console.log("fully refresh data")
            that.setData({
              articles: res.result.articles, //重新覆盖list,
              page: that.data.page + 1,
              user: res.result.user
            });
            // this.setRoleForUser(that.data.user);
            that.setData({
              user: that.data.user
            });
          }else{
            console.log("load more data")
            that.setData({
              articles: that.data.articles.concat(res.result.articles), //累加list,
              page: that.data.page + 1,
            });
          }
        }else{
          wx.showToast({ title:'没有更多数据了', icon:'none' })
          that.setData({ isloading:true })
        }
        
        wx.hideLoading();
      }
    ).catch(err => {
      console.error(err);
      wx.hideLoading();
    });
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userinfo = app.globalData.userinfo;
    this.setData({
      userinfo: userinfo
    });
    console.log(userinfo)

    this.loadHomePageData()
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