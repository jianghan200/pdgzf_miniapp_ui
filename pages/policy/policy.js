// pages/policy/policy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关
    curTab : 0,
    scrollLeft : 0
  },

  onLoad: function (options) {

  },

  // 导航栏上选择不同的tab
  tabSelect(e) {
    this.setData({
      curTab: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1 )* 60
    })
  },
})