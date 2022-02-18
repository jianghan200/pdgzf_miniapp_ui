const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (data, context) => {
  console.log("DYNAMIC_CURRENT_ENV",cloud.DYNAMIC_CURRENT_ENV)

  const db = cloud.database()
  const _ = db.command

  console.log(data);
  console.log(context);

  if (data.action == null) {
    return {
      code: 300,
      msg: '参数缺失，action is required'
    }
  }

  if (data.comment != null && data.comment != "") {
    try {
      const result = await cloud.openapi.security.msgSecCheck({
        content:  data.comment
      })
      if (result && result.errCode.toString() === '87014') {
        return {
          code: 300,
          msg: '内容含有违法违规内容',
          data: result
        }
      }
    } catch (err) {
      if (err.errCode.toString() === '87014') {
        return {
          code: 300,
          msg: '内容含有违法违规内容',
          data: err
        }
      }
      return {
        code: 400,
        msg: '调用security接口异常',
        data: err
      }
    }
  }

  // 获取某个文章的评论列表
  if (data.action=="GET_LIST") {
    comments = await cloud.database().collection('comment').where({ aid: data.aid, comment: { $nin: [null] } }).get()
    return { code: 200, msg: "评论列表获取成功", data: comments.data }
  } else if (data.action == "GET_USER_COMMENTS") {
    // 获取某个人的全部评论
    const comments = await cloud.database().collection('comment').where({ uid: data.uid }).get()
    return { code: 200, msg: '用户评论获取成功', data: comments.data }
  } else if (data.action == "NEW") {
    // 如果模式是新建评论
    ret = await db.collection('comment').add({
      data: {
        uid: data.uid, //评论者的 uid， 可以使用 unionId
        aid: data.aid, //评论对应的文章 ID, 可以使用小区的id pdgzf_8034
        article_author_id: data.article_author_id,
        comment: data.comment,
        avatarUrl: data.avatarUrl, //评论者的头像地址
        nickName: data.nickName, //评论者的昵称
        parent_comment_id: data.parent_comment_id,
        comment_to_uid: data.comment_to_uid,
        comment_to_user: data.comment_to_user,
        is_anonymous: data.is_anonymous,
        like_count: 0,
        create_gmt: new Date(),
        update_gmt: new Date(),
      },
      success: res => { 
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => { 
        console.error('[数据库] [新增记录] 失败：', err)
        return  {code: 1004, msg:"新增数据失败", err:err} 
      }
    })
 
    // 评论通知要考虑的几个点
    // 1. 文章作者要收到新评论的通知
    // 2. 评论作者要收到针对自己评论的新评论通知
    // 关注文章，那么享受文章作者待遇
    // 关注作者，那么作者发布新文章你会收到通知

    // 为作者增加一个提醒
    // 发布评论的不是文章作者自己
    if (data.uid != data.article_author_id) {
      db.collection('unread').add({
        data: {
          uid: data.article_author_id,  // 文章的作者，或者评论的作者， 如果是评论的作者，那么文章的作者也会收到通知
          type: "C",
          type_id : ret._id,
          msg: data.comment,
          has_read: false,
          create_gmt: new Date(),
          update_gmt: new Date()
        }, success: function(res) {
          console.log(res.data)
        }
      });
    }
    
    // 是回复评论而且不是给文章作者的，要给个提醒给评论作者
    if (data.comment_to_uid != null && data.comment_to_uid != data.article_author_id) {
      db.collection('unread').add({
        data: {
          uid: data.comment_to_uid,  // 文章的作者，或者评论的作者， 如果是评论的作者，那么文章的作者也会收到通知
          type: "C",
          type_id : ret._id,
          type_aid: ret._aid,
          msg: data.comment,
          has_read: false,
          create_gmt: new Date(),
          update_gmt: new Date()
        }, success: function(res) {
          console.log(res.data)
        }
      });
    }


    db.collection('article').doc(data.aid).update({
      data: {
        comment_count: _.inc(1),
      },
      success: function(res) {
        console.log(res.data)
      }
    })
  
    return  { code: 200, msg: "评论成功" }
  } else if (data.action == 'GET_REPLY') {
    // 获取某人收到的全部回复
    const replies = await cloud.database().collection('comment').where({ comment_to_uid: data.uid }).get()
    return { code: 200, msg: '获得所有的回复', data: replies.data }
  }
};


