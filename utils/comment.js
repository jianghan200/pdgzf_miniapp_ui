// 评论系统 API 封装
// 对应后端 comment_routes.py：/comment, /comment/list, /comment/{id}/replies, /comment/{id}/like, /comment/{id}, /comment/my

const app = getApp()
const constants = require('./constants')

const _token = () => (app.globalData.userinfo && app.globalData.userinfo.tokenStr) || ''

const _get = (path) => {
  return new Promise((resolve) => {
    wx.request({
      url: constants.server + path,
      header: { 'token': _token() },
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data)
        else { console.log(`GET ${path} failed`, res); resolve(null) }
      },
      fail: (err) => { console.log(`GET ${path} error`, err); resolve(null) }
    })
  })
}

const _post = (path, data) => {
  return new Promise((resolve) => {
    wx.request({
      url: constants.server + path,
      method: 'POST',
      header: { 'token': _token(), 'content-type': 'application/json' },
      data: data,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data)
        else { console.log(`POST ${path} failed`, res); resolve(res.data || null) }
      },
      fail: (err) => { console.log(`POST ${path} error`, err); resolve(null) }
    })
  })
}

const _delete = (path) => {
  return new Promise((resolve) => {
    wx.request({
      url: constants.server + path,
      method: 'DELETE',
      header: { 'token': _token() },
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data)
        else { console.log(`DELETE ${path} failed`, res); resolve(res.data || null) }
      },
      fail: (err) => { console.log(`DELETE ${path} error`, err); resolve(null) }
    })
  })
}

// 一级评论列表
const listComments = (targetType, targetId, page = 1, size = 20) =>
  _get(`/comment/list?target_type=${encodeURIComponent(targetType)}&target_id=${targetId}&page=${page}&size=${size}`)

// 二级回复列表
const listReplies = (parentId, page = 1, size = 50) =>
  _get(`/comment/${parentId}/replies?page=${page}&size=${size}`)

// 发评论
// data: { target_type, target_id, content, images?, parent_id?, reply_to_comment_id?, reply_to_user_id? }
const createComment = (data) => _post('/comment', data)

// 点赞 / 取消点赞
const toggleLike = (commentId) => _post(`/comment/${commentId}/like`)

// 删除评论
const deleteComment = (commentId) => _delete(`/comment/${commentId}`)

// 我的评论
const myComments = (page = 1, size = 20) =>
  _get(`/comment/my?page=${page}&size=${size}`)

// 上传评论图片（复用 /market/media/upload_token，house_id=0 隔离命名空间）
const uploadImage = (filePath) => {
  return new Promise((resolve) => {
    const ext = (filePath.split('.').pop() || 'jpg').split('?')[0].toLowerCase()
    wx.request({
      url: constants.server + '/market/media/upload_token',
      method: 'GET',
      header: { 'token': _token() },
      data: { house_id: 0, ext, media_type: 'photo' },
      success: (tokenRes) => {
        if (tokenRes.statusCode !== 200 || !tokenRes.data || tokenRes.data.status !== 0) {
          resolve(null)
          return
        }
        const { token, key, cdn_domain } = tokenRes.data.data
        wx.uploadFile({
          url: 'https://upload.qiniup.com/',
          filePath: filePath,
          name: 'file',
          formData: { token, key },
          success: (upRes) => {
            if (upRes.statusCode === 200) {
              resolve({ url: `https://${cdn_domain}/${key}` })
            } else {
              resolve(null)
            }
          },
          fail: () => resolve(null)
        })
      },
      fail: () => resolve(null)
    })
  })
}

module.exports = {
  listComments,
  listReplies,
  createComment,
  toggleLike,
  deleteComment,
  myComments,
  uploadImage
}
