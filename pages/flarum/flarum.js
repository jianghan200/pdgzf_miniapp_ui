const log = require('../../utils/log')
const utils = require('../../utils/util')
const userInfoHelper = require('../../utils/user')
Page({
  data: {
    title: '',
    url: 'https://pdbbs.vencloud.cn'
  },

  onLoad(options) {
    log.info(`用户进入论坛 onShow, ${options}`)

    if (options && options.url){
      log.info('进入论坛webview页，options中存在url，代表用户通过分享进入论坛某个文章')

      this.setData({ url: options.url })
    }

    this.ask_for_wx_nickname_and_avatar()
  },

  // 向用户索要用户名和头像
  ask_for_wx_nickname_and_avatar() {
    log.info('检查用户是否授权过头像和昵称')

    const self = this
    userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
      if (res === null) {
        // 用户没有授权头像和昵称
        log.warn(`用户没有授权头像和昵称`)
        log.info('展示弹窗告知用户如果不授权就不能进入论坛')

        wx.showModal({
          title: '请授权头像和昵称',
          content: '需要授权头像和昵称才能进入论坛',
          showCancel: true,
          cancelText: '暂时不',
          confirmText: '好的',
          confirmColor: 'green',
          success: (res) => {
            if (res.confirm) {
              log.info('用户最终同意授权头像和昵称')

              self.ask_for_wx_nickname_and_avatar()
            } else {
              log.warn(`用户始终没有同意授权头像和昵称, 跳转至today`)

              wx.switchTab({ url: '/pages/today/today' })
            }
          }
        })
      } else {
        // 用户授权了头像和昵称
        log.info(`用户授权了头像和昵称`)

        self.setUrl()
      }
    })
  },

  // 生成论坛的url
  setUrl() {
    const url = utils.generate_flarum_url(this.data.url)

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