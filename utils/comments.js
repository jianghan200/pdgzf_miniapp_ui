const log = require('./log')
const requests = require('./request')
const app = getApp()

// 根据aid拿到某个文章的所有评论
const getCommentsOf = function(aid) {
  log.info(`准备获取${aid}的所有评论`)

  return wx.cloud.callFunction({
    name: 'comment',
    data: {
      action: "GET_LIST",
      aid: aid
    }
  })
}

// 上传评论
const submitComment = function(aid, userInput) {
  log.info('点击上传评论')
  // 用户必须授权头像和用户名才能开始评论
  return requests.getAvatarAndNickname().then(res => {
    if (res) {
      // 用户授权
      return Promise.resolve()
    } else {
      // 用户不授权
      wx.showToast({ title: '请先授权', icon: 'error' })
      return Promise.reject(false)
    }
  }).then(() => {
    // 上传评论内容
    return requests.sendCommentOnSomeProject(aid, userInput)
  }).then(res => {
    if (res) {
      // 上传成功
      wx.showToast({ title: '评论成功', icon: 'success' })
      return Promise.resolve()
    } else {
      // 上传失败
      wx.showToast({ title: '上传失败', icon: 'error' })
      return Promise.reject(false)
    }
  })
}

// 匿名上传评论
const submitCommentAnonymously = function(aid, comments) {
  log.info('匿名上传评论')

  return wx.cloud.callFunction({
    name: 'comment',
    data: {
      action: "NEW",
      uid: app.globalData.userinfo.unionId,
      aid: aid, 
      comment: comments,
      is_anonymous: true
    }
  })
}

// 在哪篇文章中，回复了哪个comment？
const respond = function(aid, comments, parentCommentId, parentCommentUnionId, parentCommentUsername) {
  log.info(`回复${parentCommentId}(aid: ${aid})`)

  // 要先看用户有没有头像, 用户名
  return requests.getAvatarAndNickname().then(res => {
    if (res) {
      // 用户授权
      return Promise.resolve()
    } else {
      // 用户不授权
      wx.showToast({ title: '请先授权', icon: 'error' })
      return Promise.reject(false)
    }
  }).then(() => {
    // 授权后才能评论
    return wx.cloud.callFunction({
      name: 'comment',
      data : {
        action: "NEW",
        uid: app.globalData.userinfo.unionId,
        aid: aid, 
        comment: comments,
        avatarUrl: app.globalData.avatarUrl,
        nickName: app.globalData.nickname,
        parent_comment_id: parentCommentId,
        comment_to_uid: parentCommentUnionId,
        comment_to_user: parentCommentUsername
      }
    })
  })
}

// 匿名回复他人评论
const respondAnonymously = function(aid, comments, parentCommentId, parentCommentUnionId, parentCommentUsername) {
  log.info(`匿名回复${parentCommentId}(aid: ${aid})`)

  return wx.cloud.callFunction({
    name: 'comment',
    data : {
      action: "NEW",
      uid: app.globalData.userinfo.unionId,
      aid: aid, 
      comment: comments,
      parent_comment_id: parentCommentId,
      comment_to_uid: parentCommentUnionId,
      comment_to_user: parentCommentUsername,
      is_anonymous: true
    }
  })
}

module.exports = {
  submitComment: submitComment,
  submitCommentAnonymously: submitCommentAnonymously,
  getCommentsOf: getCommentsOf,
  respond: respond,
  respondAnonymously: respondAnonymously
}