// app.js
App({
  onLaunch: function (options) {
    /*
      在程序刚刚launch的时候画导航栏
    */
    wx.getSystemInfo({
      success: (result) => {
        this.globalData.StatusBar = result.statusBarHeight;
        /*
          通过 wx.qy.getMenuButtonBoundingClientRect() 获取胶囊按钮的信息 
          capsule: 胶囊
        */
        let capsule = wx.getMenuButtonBoundingClientRect();
        if (capsule) {
          this.globalData.Custom = capsule;
          // (capsule.top - result.statusBarHeight)过小，本来要乘2，为了让其饱满一些，乘四
        	this.globalData.CustomBar = result.statusBarHeight + capsule.height + (capsule.top - result.statusBarHeight) * 4;
        } else {
        	this.globalData.CustomBar = result.statusBarHeight + 50;
        }
        /*
          在小程序中需要使用大量图片，为了加速图片的加载，在非IOS的环境中将使用webp格式的图片。
        */
        if (result.system.indexOf('iOS') != -1) {
          this.globalData.iOS = true
        }
      },
      fail: (result) => {}
    })
  },
  globalData: {
    projects: []
  }
})
