const log = require('../../utils/log')
const utils = require('../../utils/util')
const userInfoHelper = require('../../utils/user')
const constants = require('../../utils/constants')
Page({
  data: {
    title: '',
    url: ''
  },

  onLoad(options) {
    log.info(`用户进入论坛 onLoad, ${options}`)
    this.promptUserToSetNicknameAndAvatar()
    if (options && options.url){
      log.info('进入论坛webview页，options中存在url，代表用户通过分享进入论坛某个文章')

      this.setData({ url: options.url })
    }
    
  },

  // Switch tab, navigateBack 时触发
  onShow() {
    log.info('flarum switchTab 触发')
    this.promptUserToSetNicknameAndAvatar()
  },

  promptUserToSetNicknameAndAvatar() {
    if (userInfoHelper.has_weixin_nickNameAndAvatar()) {
      // 用户授权过头像和昵称
      log.info(`用户授权过头像和昵称`)

      this.setUrl()
    } else {
      log.info(`用户没有头像和昵称`)

      // 自动设置一个默认昵称与头像
      try {
        const names = constants.randomNikName || []
        const pickedName = names.length > 0 ? names[Math.floor(Math.random() * names.length)] : constants.randomUserName()
        const defaultAvatar = '../../assets/cat.jpeg'

        log.info(`自动分配昵称与头像: ${pickedName}, ${defaultAvatar}`)

        userInfoHelper.upload_weixin_nickNameAndAvatar(pickedName, defaultAvatar).then(() => {
          // 写入全局，保持与user.js一致
          const app = getApp()
          app.globalData.userinfo.wxNickName = pickedName
          app.globalData.userinfo.wxAvatarUrl = defaultAvatar

          this.setUrl()
        }).catch(err => {
          log.error('自动上传默认昵称头像失败')
          console.log(err)
        })
      } catch (e) {
        log.error('分配默认昵称头像时发生异常')
        console.log(e)
  
      }
    }
  },

  // 向用户索要用户名和头像
  // 旧版 API，已经不支持
  // ask_for_wx_nickname_and_avatar() {
  //   log.info('检查用户是否授权过头像和昵称')

  //   const self = this
  //   userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
  //     if (res === null) {
  //       // 用户没有授权头像和昵称
  //       log.warn(`用户没有授权头像和昵称`)
  //       log.info('展示弹窗告知用户如果不授权就不能进入论坛')

  //       wx.showModal({
  //         title: '请授权头像和昵称',
  //         content: '需要授权头像和昵称才能进入论坛',
  //         showCancel: true,
  //         cancelText: '暂时不',
  //         confirmText: '好的',
  //         confirmColor: 'green',
  //         success: (res) => {
  //           if (res.confirm) {
  //             log.info('用户最终同意授权头像和昵称')

  //             self.ask_for_wx_nickname_and_avatar()
  //           } else {
  //             log.warn(`用户始终没有同意授权头像和昵称, 跳转至today`)

  //             wx.switchTab({ url: '/pages/today/today' })
  //           }
  //         }
  //       })
  //     } else {
  //       // 用户授权了头像和昵称
  //       log.info(`用户授权了头像和昵称`)

  //       self.setUrl()
  //     }
  //   })
  // },

  // 生成论坛的url
  setUrl() {
    const url = utils.generate_flarum_url()

    log.info(`生成了论坛的url为: ${url}`)

    this.setData({ url: url })
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'flarum') {
      const url = `/pages/${newTab}/${newTab}`
      wx.redirectTo({ url: url })
    }
  },

  // 支持使用小程序的分享功能分享论坛中某个页面
  onShareAppMessage: function (options) {
    const path = '/pages/flarum/flarum?url=' + options.webViewUrl

    log.info(`用户分享了论坛文章，分享的完整路径为: ${path}`)

    return {
      title: this.data.title,
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({ title: '转发成功', icon: 'success' })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({ title: '转发已取消' })
        } else {
          wx.showToast({ title: '转发失败' })
        }
      }
    }
  },
  
  // 接收web-view传递的页面标题参数
  bindmessage(e) {
    log.info(`用户分享论坛文章，触发了bindmessage，试图从event中找到被分享文章的标题`)
    log.info(e)

    const length = e.detail.data.length;
    if (length == 0) {
      log.info('被分享的页面没有发现标题')
      // 存储状态
      this.setData({ title: "PD公租房社区" })
    } else {
      const title = e.detail.data[length-1].title

      log.info(`被分享的页面发现了标题: ${title}`)
      // 存储状态
      this.setData({ title: title })
    }
  },

  // 网页加载成功的钩子函数，此处仅用来向后台传递用户使用行为信息。
  webviewReady: function(params) {
    log.info(`webviewReady方法，网页加载成功`)
    log.info(params)
  },

})