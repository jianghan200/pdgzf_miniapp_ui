// app.js
var log = require('./utils/log')
const userInfoHelper = require('./utils/user')
const constants = require('./utils/constants')

App({
  onLaunch: function (options) {
    log.info(options)
    this.globalData.scene = options.scene
    
    log.info('用户onLaunch')
    // 最开始要prompt用户升级程序（if any）
    this.updateApp()
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
          this.globalData.CustomBar = result.statusBarHeight + capsule.height + (capsule.top - result.statusBarHeight) * 2;
        } else {
          this.globalData.CustomBar = result.statusBarHeight + 50;
        }
        /*
          在小程序中需要使用大量图片，为了加速图片的加载，在非IOS的环境中将使用webp格式的图片。
        */
        log.info(result.system)
        
        if (result.system.indexOf('iOS') != -1) {
          this.globalData.IOS = true
        }
      },
      fail: (result) => {}
    })
  },

 

  // 检查版本，prompt用户下载新版本
  updateApp() {
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      if (res.hasUpdate) {
        wx.showLoading({
          title:'更新下载中...',
        })
      }
    })

    updateManager.onUpdateReady(function () {
      wx.hideLoading();
      wx.showModal({
        title:'更新提示',
        content:'新版本已经准备好，是否重启应用？',
        success:function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })

    updateManager.onUpdateFailed(function () {
      // 新的版本下载失败
      wx.hideLoading();
      wx.showToast({ title:'下载失败...', icon:"none" });
    })
  },

  globalData: {
    userinfo: {
      wxNickName: '',
      wxAvatarUrl: ''
    }
  },
  

})
