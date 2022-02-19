const app = getApp()
const log = require('./log')
const utils = require('./util')
const forumHelper = require('./forum')

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

// 将未读信息标记为已读
const markAsRead = function(unread_id) {
  return wx.cloud.callFunction({
    name: 'mark_as_read',
    data: {
      unread_id: unread_id
    }
  }).then(() => {
    log.info(`将_id为: ${unread_id}的unread标记为已读`)
    
    // 更新storage中的unread
    const interactions = wx.getStorageSync('interactions')

    interactions.unread = interactions.unread.filter(msg => msg._id != unread_id)
    
    wx.setStorageSync('interactions', interactions)
    app.globalData.unread --
  })
}

// 获取某个用户在论坛中的互动信息
const getUserInteractions = function() {
  return Promise.all([getAllMyPosts(), getAllMyComments(), getAllReplies(), getUnreadComments()]).then(res => {
    const posts = res[0].result.articles
    // 为文章添加信息
    posts.forEach(article => {
      article['timedistance'] = utils.getTimeDistance(article.create_gmt)
    })
    
    // 过滤出去一些测试时遗留的数据
    const comments = res[1].result.data.filter(comment => {
      return comment.aid && comment.aid != null
    })
    comments.forEach(comment => {
      comment['timedistance'] = utils.getTimeDistance(comment.update_gmt)
    })

    // 别人回复用户的
    const replies = res[2].result.data
    replies.forEach(reply => {
      reply['timedistance'] = utils.getTimeDistance(reply.update_gmt)
    })

    // 由于历史原因，这个方法也会query出来用户创建的没有添加author_id的文章，所以在model level进行过滤
    const unread = res[3].result.data.filter(msg => msg.type == 'CUCA')
    unread.forEach(msg => {
      msg['timedistance'] = utils.getTimeDistance(msg.update_gmt)
    })

    // 方便其他Page / Component显示未读信息数量
    app.globalData.unread = unread.length

    return Promise.resolve({
      posts: posts,
      comments: comments,
      replies: replies,
      unread: unread
    })
  }).then(userInteractions => {
    return Promise.all([
      getArticlesForComments(userInteractions.comments),
      getArticlesForComments(userInteractions.replies),
      getArticlesForComments(userInteractions.unread)
    ]).then(res => {
      userInteractions.comments = res[0]
      userInteractions.replies = res[1]
      userInteractions.unread = res[2]

      // 方便其他Page使用用户的互动信息
      wx.setStorageSync('interactions', userInteractions)

      return Promise.resolve(userInteractions)
    })
  })
}

// 为所有的comments找到他们的文章
const getArticlesForComments = function(comments) {
  const allProjectsFromStorage = wx.getStorageSync('allProjects')
  let allPidsAndNames = []
  allProjectsFromStorage.forEach(area => {
      area.projects.forEach(project => {
          allPidsAndNames.push({
              id: project.pId,
              name: project.pName
          })
      })
  })

  let commentsOnUserArticles = []
  // 遍历所有小区留言板，找到小区的名称
  comments.forEach(comment => {
      if (comment.aid.indexOf('pdgzf_project_') != -1) {
          // 属于小区留言板
          const pid = comment.aid.split('_')[comment.aid.split('_').length - 1]
          // const pname = allPidsAndNames.find(pair => pair.id == pid).name
          var projectId2Name = allPidsAndNames.find(pair => pair.id == pid)
          var pname =  "Wrong "+ pid;
          if(projectId2Name){
             pname = allPidsAndNames.find(pair => pair.id == pid).name
          }
          comment['pname'] = pname
      } else {
          // 属于用户创建的文章
          commentsOnUserArticles.push(comment)
      }
  })

  log.info(`准备加载${commentsOnUserArticles.length}篇文章`)

  // 如果aid以pdgzf_project开头，则为小区留言板，小区留言板不会被返回
  return forumHelper.getArticlesByIds(commentsOnUserArticles.map(comment => comment.aid)).then(res => {
      const articles = res.result.articles.data
      // 遍历所有非留言板上的评论，并为之匹配文章(多个评论可能属于同一篇文章)
      commentsOnUserArticles.forEach(comment => {
          const article = articles.find(article => article._id == comment.aid)
          if (article) {
              comment['article'] = article
          } else {
              log.error(`comment: ${comment._id} 虽然不是留言板的评论，但未找到文章`)
          }
      })

      return Promise.resolve(comments)
  })
}


module.exports = {
  hasStartDate : hasStartDate,
  getAllMyPosts: getAllMyPosts,
  getAllMyComments: getAllMyComments,
  getAllReplies: getAllReplies,
  getUserInteractions: getUserInteractions,
  getUnreadComments: getUnreadComments,
  markAsRead: markAsRead
}