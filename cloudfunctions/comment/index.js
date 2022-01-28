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

  if(data.action == null){
    return {
      code: 300,
      msg: '参数缺失，action is required'
    }
  }

  if(data.comment!=null && data.comment != ""){
    try {
      let result = await cloud.openapi.security.msgSecCheck({
        content:  data.comment
      })
      if (result && result.errCode.toString() === '87014') {
        return {
          code: 300,
          msg: '内容含有违法违规内容',
          data: result
        } //
      } else {
      }
    } catch (err) {
      if (err.errCode.toString() === '87014') {
        return {
          code: 300,
          msg: '内容含有违法违规内容',
          data: err
        } //
      }
      return {
        code: 400,
        msg: '调用security接口异常',
        data: err
      }
    }
  }

  if(data.action=="GET_LIST"){
      comments = await cloud.database().collection('comment').where({aid: data.aid, comment:{$nin:[null]}}).get()
      return  {code: 200, msg:"评论列表获取成功", data:comments.data }
  }

  if(data.action=="GET"){

  }

  if(data.action=="NEW"){

    db.collection('comment').add({
      data: {
        uid: data.uid, //评论者的 uid， 可以使用 unionId
        aid: data.aid, //评论对应的文章 ID, 可以使用小区的id pdgzf_8034
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
      success: res => { console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id);},
      fail: err => { console.error('[数据库] [新增记录] 失败：', err); return  {code: 1004, msg:"新增数据失败", err:err} }
    })
  
    db.collection('article').doc(data.aid).update({
      data: {
        comment_count: _.inc(1),
      },
      success: function(res) {
        console.log(res.data)
      }
    })
  
    return  {code: 200, msg:"评论成功"}
  }
  // var dbResult = await cloud.database().collection('user').where({_id: data.uid}).get()
  // let user = dbResult.data[0]
};


