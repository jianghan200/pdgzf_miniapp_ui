const log = require('./log')
const requests = require('./request')


const submitComment = function(aid, userInput) {
  log.info('点击上传评论')
  // 用户必须授权头像和用户名才能开始评论
  return requests.getAvatarAndNickname().then(res => {
    if (res) {
      // 用户授权
      return Promise.resolve()
    } else {
      // 用户不授权
      wx.showToast({ title: '请授权', icon: 'error' })
      return Promise.reject()
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
      return Promise.reject()
    }
  })
}

module.exports = {
  submitComment: submitComment
}