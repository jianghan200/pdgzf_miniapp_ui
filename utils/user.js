var app = getApp()
const log = require('./log')

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

// 获得某个用户发布过的所有文章
const getAllMyPosts = function() {
  return wx.cloud.callFunction({
    name: 'getArticle',
    data: {
      action: 'BY_UID',
      uid: app.globalData.userinfo.unionId
    }
  })
}

// 获取某个用户发布过的所有评论
const getAllMyComments = function() {
  return wx.cloud.callFunction({
    name: 'comment',
    data: {
      action: 'GET_USER_COMMENTS',
      uid: app.globalData.userinfo.unionId
    }
  })
}

// 获取某个用户所有的回复
const getAllReplies = function() {
  return wx.cloud.callFunction({
    name: 'comment',
    data: {
      action: 'GET_REPLY',
      uid: app.globalData.userinfo.unionId
    }
  })
}

// 拿到自己所有的unread的评论 (type: A, 别人评论我的文章, type: C, 别人回复我)
const getUnreadComments = function() {
  return wx.cloud.callFunction({
    name: 'unread',
    data: {
      uid: app.globalData.userinfo.unionId
    }
  })
}

// 获取某个用户在论坛中的互动信息
const getUserInteractions = function() {
  return Promise.all([getAllMyPosts(), getAllMyComments(), getAllReplies(), getUnreadComments()]).then(res => {
    const posts = res[0].result.articles
    const comments = res[1].result.data
    const replies = res[2].result.data
    const unread = res[3].result.data

    const userInteractions = {
      posts: posts,
      comments: comments,
      replies: replies,
      unread: unread
    }

    // 方便其他Page / Component显示未读信息数量
    app.globalData.unread = unread.length

    // 方便其他Page使用用户的互动信息
    wx.setStorageSync('interactions', userInteractions)
    
    return Promise.resolve(true)
  })
}

module.exports = {
  hasStartDate : hasStartDate,
  getAllMyPosts: getAllMyPosts,
  getAllMyComments: getAllMyComments,
  getAllReplies: getAllReplies,
  getUserInteractions: getUserInteractions,
  getUnreadComments: getUnreadComments
}