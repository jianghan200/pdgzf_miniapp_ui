// pages/user/edit-user-info.js
const app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const user = require('../../utils/user')
const userApi = require('../../utils/user')
const log = require('./../../utils/log')

Page({
  data: {
    avatarUrl: '',
    nickname: ''
  },
  onLoad(options) {
    const userinfo = app.globalData.userinfo
    if (userApi.has_weixin_nickNameAndAvatar()) {
      log.info('这个用户有微信头像和昵称')

      this.setData({
        avatarUrl: userinfo['wxAvatarUrl'],
        nickname: userinfo['wxNickName']
      })
    } else {
      log.info('这个用户没有头像和微信昵称')

      this.setData({ avatarUrl: '', nickname: '' })
    }
  },

  onChooseAvatar(e) {
    log.info('用户上传了头像')
    log.info(e)

    if (e.detail.avatarUrl && e.detail.avatarUrl != null && e.detail.avatarUrl.trim() != '') {
      this.setData({ avatarUrl: e.detail.avatarUrl })
    }
  },

  handleNickname(e) {},

  // 返回我的页面
  navigateBack(e) {
    // 会返回本页和之前的所有页面，本页为返回 array 的最后一个 element
    const currentPages = getCurrentPages()
    const prev_page_idx = currentPages.length - 2
    const prev_page = currentPages[prev_page_idx]

    if (prev_page.route == 'pages/user/user') {
      log.info('应该 navigate back 回 /pages/user/user ...')

      if (this.data.nickname.trim() != '' && this.data.avatarUrl.trim() != '') {
        prev_page.setAvatarAndNickname({
          'wxNickName': this.data.nickname.trim(),
          'wxAvatarUrl': this.data.avatarUrl.trim()
        })
      }
      wx.navigateBack({ delta: 1 })
    } else if (prev_page.route == 'pages/flarum/flarum') {
      log.info('应该 navigate back 回 /pages/flarum/flarum ...')

      if (this.data.nickname.trim() != '' && this.data.avatarUrl.trim() != '') {
        wx.navigateBack({ delta: 1 })
      } else {
        log.info('nickname or avatarUrl is empty, navigate to the main page: /pages/today/today')

        wx.switchTab({ url: '/pages/today/today' })
      }
    }
  },

  // 上传头像和昵称
  confirmChange(e) {
    if (this.data.nickname.trim() != '' && this.data.avatarUrl.trim() != '') {
      const self = this

      // 首先获得我们自己服务器生成的可以从公网访问的 url
      userApi.uploadAvatar(self.data.avatarUrl.trim()).then(publicUrl => {
        if (publicUrl != '') {
          userApi.upload_weixin_nickNameAndAvatar(self.data.nickname.trim(), publicUrl).then(() => {
            // 用户信息上传成功，完成了用户信息采集
            log.info(`完成了微信昵称和头像的采集`)
    
            app.globalData.userinfo.wxNickName = self.data.nickname.trim()
            app.globalData.userinfo.wxAvatarUrl = publicUrl
    
            wx.showToast({ title: '信息修改成功', icon: 'success' })
          }).catch(err => {
            log.error(`基于微信接口的方法，upload_weixin_nickNameAndAvatar 报错`)
            log.error(err)
            console.log(err)
            wx.showToast({ title: '信息上传失败', icon: 'error' })
          })
        } else {
          log.error('上传头像失败，不能完成用户昵称和头像的修改.')
          wx.showToast({ title: '信息上传失败', icon: 'error' })
        }
      })
    }
  }
})