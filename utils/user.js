const app = getApp()
const log = require('./log')
const constants = require('./constants')

// 通过用户的userinfo判断该用户是否有资格日或者资格日是模拟的
// 0：是个VIP；1：模拟过资格日；-1：不是vip也没有模拟资格日
const hasStartDate = function() {
  log.info(`判断用户是否有资格日`)
  log.info(app.globalData.userinfo)

  if (app.globalData.userinfo.type == 2 && app.globalData.userinfo.startDate && app.globalData.userinfo.startDate != null) {
    // 开启了自动选房的Vip，现在Vip也有可能没有选房资格日的信息。
    return 0
  } else if (!app.globalData.userinfo.manualStartDate || app.globalData.userinfo.manualStartDate == null) {
    // 不是vip，也没有输入过资格日
    return -1
  } else {
    // 输入过自己资格日
    return 1
  }
}

// 判断后端是否有用户的微信昵称和头像
// 不是undefined，不是null，不是空字符串, 不是叫"undefined"的字符串
const has_weixin_nickNameAndAvatar = function() {
  return app.globalData.userinfo.wxNickName && app.globalData.userinfo.wxNickName !== null && app.globalData.userinfo.wxNickName.trim() !== '' && app.globalData.userinfo.wxAvatarUrl && app.globalData.userinfo.wxAvatarUrl !== null && app.globalData.userinfo.wxAvatarUrl.trim() !== '' && app.globalData.userinfo.wxAvatarUrl.trim() !== 'undefined' && app.globalData.userinfo.wxNickName.trim() !== 'undefined'
}

// 使用弹窗以及调用微信的接口向用户索要微信昵称和头像
const ask_for_weixin_nickNameAndAvatar = function() {
  log.info(`即将向用户索要微信名和头像`)

  return new Promise((resolve) => {
    wx.showModal({
      title: '需要您的昵称和头像才能使用',
      content: '请点击同意按钮开始使用本程序',
      success: function(res) {
        log.info('授权弹窗成功出现, 用户点击的结果如下')
        log.info(res)
  
        if (res.confirm) {
          // 用户点击了“同意”
          log.info('用户点击了同意')
          log.info('调用微信getUserProfile, 需要用户二次点击同意')
          // 调用getUserProfile接口获得用户的头像和昵称
          wx.getUserProfile({
            desc: '需要您的昵称和头像',
            success : function(res) {
              // 用户同意提供昵称和头像
              const nickname = res.userInfo.nickName
              const avatarUrl = res.userInfo.avatarUrl

              log.info(`用户同意授权了昵称: ${nickname}和头像: ${avatarUrl}`)

              resolve({ 'wxNickName': nickname, 'wxAvatarUrl': avatarUrl })
            },
            fail: function(err) {
              log.error('用户拒绝了授权')
              log.error(err)
              console.log(err)
              // Profile获取失败
              wx.showToast({ title: '很遗憾', icon: 'error' })
  
              resolve(null)
            }
          })
        } else {
          log.error('用户拒绝了授权（Modal中点击了cancel）')
          // Profile获取失败
          wx.showToast({ title: '很遗憾', icon: 'error' })
  
          resolve(null)
        }
      },
      fail: function(err) {
        log.error('程序错误，wx.showModal未能成功')
        log.error(err)
        wx.showToast({ title: '微信接口报错', icon: 'error' })
  
        resolve(null)
      }
    })
  })
}

// 向后端上传用户的微信昵称和头像
const upload_weixin_nickNameAndAvatar = function(nickName, avatar) {
  log.info(`向后端上传用户的微信昵称: ${nickName}和头像的url: ${avatar}`)

  const url = constants.userinfoServer + '/api/user/update'
  const token = app.globalData.userinfo.tokenStr
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: { 'token' : token, 'content-type' : 'application/x-www-form-urlencoded' },
      method: 'POST',
      data: { 'wxNickName' : nickName, 'wxAvatarUrl': avatar },
      success: function(res) {
        if (res.data.status == 0) {
          log.info('信息上传成功！')

          resolve(true)
        } else {
          log.error(`接口调用失败，后端返回${res.data}`)
          console.log(res.data)
          reject(res.data)
        }
      },
      fail: function(err) {
        log.error(`微信request接口报错!`)
        console.log(err)
        reject(err)
      }
    })
  })
}

// 向后端请求用户的头像和昵称，如果没有，则请求用户授权
const get_tencent_nicknameAndAvatar = function() {
  log.info('请求获取用户的头像和昵称')

  return new Promise((resolve) => {
    if (!has_weixin_nickNameAndAvatar()) {
      // 说明没有微信昵称和头像
      log.info('没有该用户的昵称和头像，需要用户授权')
      ask_for_weixin_nickNameAndAvatar().then(wxNickNameAndAvatar_from_user_auth => {
        if (wxNickNameAndAvatar_from_user_auth === null) {
          log.info('用户拒绝了授权或者出现了报错')
          resolve(null)
        } else {
          log.info('用户完成了授权')
          const { wxNickName, wxAvatarUrl } = wxNickNameAndAvatar_from_user_auth
          // 将用户的微信头像和昵称url上传到后端
          upload_weixin_nickNameAndAvatar(wxNickName, wxAvatarUrl).then(() => {
            // 用户信息上传成功，完成了用户信息采集
            log.info(`完成了微信昵称和头像的采集`)

            app.globalData.userinfo.wxNickName = wxNickName
            app.globalData.userinfo.wxAvatarUrl = wxAvatarUrl

            resolve(wxNickNameAndAvatar_from_user_auth)
          }).catch(err => {
            console.log(err)
            log.error(`Future返回了错误: ${err}`)
            wx.showToast({ title: '信息上传失败', icon: 'error' })
  
            resolve(null)
          })
        }
      })
    } else {
      log.info('该用户已经拥有微信昵称和头像, 继续')
      resolve({ 
        'wxNickName' : app.globalData.userinfo.wxNickName, 
        'wxAvatarUrl': app.globalData.userinfo.wxAvatarUrl 
      })
    }
  })
}

// 一个用户是否为新人？
const isNewUser = function() {
  return app.globalData.userinfo.type == 0 && app.globalData.userinfo.email == null && app.globalData.userinfo.startDate == null
}


// {statusCode: 200, data: "https://cdn.pdgzf.cn/upload/default/087b0012-7bc2-48b0-824c-6a3acba6bdbb.jpeg", header: {…}, cookies: Array(0), errMsg: "uploadFile:ok"}
// 用于用户上传头像
const uploadAvatar = function(filePath) {
  return new Promise((resolve) => {
    wx.uploadFile({
      filePath: filePath,
      name: 'file',
      url: 'https://api.pdgzf.cn/upload_api/upload?path=default',
      success(res) {
        const avatar_url = res.data
        resolve(avatar_url)
      },
      fail(err) {
        log.error(`上传失败 (filePath: ${filePath})`)
        log.error(err)

        resolve('')
      }
    })
  })
}

module.exports = {
  hasStartDate : hasStartDate,
  get_tencent_nicknameAndAvatar: get_tencent_nicknameAndAvatar,
  has_weixin_nickNameAndAvatar: has_weixin_nickNameAndAvatar,
  upload_weixin_nickNameAndAvatar: upload_weixin_nickNameAndAvatar,
  isNewUser: isNewUser,
  uploadAvatar: uploadAvatar
}