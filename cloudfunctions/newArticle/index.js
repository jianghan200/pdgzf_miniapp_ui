const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (data, context) => {
  const db = cloud.database()

    try {
      let result = await cloud.openapi.security.msgSecCheck({
        content: data.title + ", " + data.content
      })
      if (result && result.errCode.toString() === '87014') {
        return {
          code: 300,
          msg: '内容含有违法违规内容',
          data: result
        } //
      } else {

        if(data.action =="EDIT"){

          dbResult = await cloud.database().collection('article').doc(data.aid).update({
            data: {
              title: data.title,
              content: data.content,
              // sub_cat: data.sub_cat,
              update_gmt: new Date()
            },
            success: function(res) {
              console.log(res.data)
            }
          })
          console.log(dbResult);
          if(dbResult.errMsg == "document.update:ok"){
            return  {code:200, msg:"更新文章成功"}
          }else{
            return  {code:500, msg:"更新文章失败"}
          }

        }else{
          dbResult = await db.collection('article').add({
            data: {
              uid: data.uid,
              user_nickname: data.user_nickname,
              user_avatar: data.user_avatar,
              complex_id: data.complex_id,

              title: data.title,
              content: data.content,
              images: data.images,
              
              create_gmt: new Date(),
              update_gmt: new Date(),
              is_deleted: false,
              type: data.type,// 转租，社区，新闻
              topic: data.topic,// pdgzf_project_8445

              view_count: 0,
              comment_count: 0,
              like_count: 0,
              agree_count: 0,
              agree_weight: 0,
              disagree_count: 0,
              disagree_weight: 0,
              
              visible_to:["游客"],
              votable_to:["游客"]
            }
          })
        }

        console.log(dbResult);
        if(dbResult.errMsg == "collection.add:ok"){
          return  {code:200, msg:"新建投票成功"}
        }else{
          return  {code:500, msg:"新建投票失败"}
        }

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
};


