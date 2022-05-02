const app = getApp()
const requestHelper = require('../../utils/request')
const log = require('../../utils/log')
const utils = require('../../utils/util')
Page({

  data: {
    unreadCount: 0,
    url: ''
  },

  onShow() {
    log.info(`用户进入论坛 onShow`)

    const self = this
    requestHelper.getAvatarAndNickname().then((response) => {
      if (response) {
        // 用户授权了头像和昵称
        log.info(`用户授权了头像和昵称`)

        self.setUrl()
      } else {
        // 用户没有授权头像和昵称
        log.warn(`用户没有授权头像和昵称`)

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

              self.setUrl()
            } else {
              log.warn(`用户始终没有同意授权头像和昵称, 跳转至today`)

              wx.switchTab({
                url: '/pages/today/today',
              })
            }
          }
        })
      }
    })
  },

  // 生成论坛的url
  setUrl() {
    const url = utils.generate_flarum_url()

    log.info(`生成了论坛的url为: ${url}`)

    this.setData({ 
      unreadCount: app.globalData.unread,
      url: url
    })
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'flarum') {
      const url = `/pages/${newTab}/${newTab}`
      wx.redirectTo({ url: url })
    }
  },

  onShareAppMessage: function () {

  }
})