// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
// 获取云端用户信息 {action:"GET"}
// 创建用户个人信息，包含昵称，头像地址 {action:"POST", userInfo:""}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("DYNAMIC_CURRENT_ENV", cloud.DYNAMIC_CURRENT_ENV)
  const wxContext = cloud.getWXContext();
  const db = cloud.database()
  const _ = db.command

  var data = event;
  console.log("Input: ", data);
  console.log("unionId", wxContext.UNIONID)
  
  if(data == null || data.action == "GET" || data.action == null){
    var dbResult = await cloud.database().collection('user').where({ unionid: wxContext.UNIONID}).get();
    let user = dbResult.data[0];
    console.log("GET user", user)
    return user;
  }

  if(data.action == "POST"){
    //必须携带用户信息
    if(data.userInfo == null){
      return {
        code: 100,
        msg: '参数不全'
      } 
    }
    var dbResult = await cloud.database().collection('user').where({unionid: wxContext.UNIONID}).get()
    console.log(dbResult)
    let user = dbResult.data[0]

    //用户信息不存在的时候才创建
    if(user == null && data.userInfo != null){
      dbResult = await db.collection('user').add({
        data: {
          openid: wxContext.OPENID,
          unionid: wxContext.UNIONID,
          avatarUrl: data.userInfo.avatarUrl,
          city: data.userInfo.city,
          country: data.userInfo.country,
          gender: data.userInfo.gender,
          language: data.userInfo.language,
          nickName: data.userInfo.nickName,
          province: data.userInfo.province,
          create_gmt: new Date(),
          update_gmt: new Date(),
        },
        success: res => { console.log('用户信息增加成功，记录 _id: ', res._id); return  {code: 200, msg:"用户信息增加成功"}},
        fail: err => { console.error('用户信息增加失败：', err); return  {code: 1004, msg:"用户信息增加失败", err:err} }
      })
      // dbResult = await cloud.database().collection('user').where({unionid: wxContext.UNIONID}).get();
      // user = dbResult.data[0]; 
  }
}
// cloud.init()

// // 云函数入口函数
// exports.main = async (event, context) => {
//   const wxContext = cloud.getWXContext()

//   return {
//     event,
//     openid: wxContext.OPENID,
//     appid: wxContext.APPID,
//     unionid: wxContext.UNIONID,
//   }
// }
  
  // var action = data.action;
  // if(action == 'UPDATE_USER_WX_INFO'){
  // }
  
  // cloud.database().collection('user').doc(data._open_id).update({
  //   data: {
  //     avatarUrl: data.userInfo.avatarUrl,
  //     city: data.userInfo.city,
  //     country: data.userInfo.country,
  //     gender: data.userInfo.gender,
  //     language: data.userInfo.language,
  //     nickName: data.userInfo.nickName,
  //     province: data.userInfo.province
  //   },
  //   success: function(res) {
  //     console.log(res.data)
  //   }
  // })




  // db.collection('user').add({
  //   data: {
  //     uid: data.uid, //评论者的 uid， 可以使用 unionId
  //     aid: data.aid, //评论对应的文章 ID, 可以使用小区的id pdgzf_8034
  //     comment: data.comment,
  //     avatarUrl: data.avatarUrl, //评论者的头像地址
  //     nickName: data.nickName, //评论者的昵称
  //     status: "PENDING",
  //     create_gmt: new Date(),
  //     update_gmt: new Date(),
  //   },
  //   success: res => { console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id);},
  //   fail: err => { console.error('[数据库] [新增记录] 失败：', err); return  {code: 1004, msg:"新增数据失败", err:err} }
  // })

  // try {
  //   return await db.collection('user').where({
  //     _openid: wxContext.OPENID,
  //   })
  //   .update({
  //     data: {
  //       avatarUrl: data.userInfo.avatarUrl,
  //       city: data.userInfo.city,
  //       country: data.userInfo.country,
  //       gender: data.userInfo.gender,
  //       language: data.userInfo.language,
  //       nickName: data.userInfo.nickName,
  //       province: data.userInfo.province
  //     },
  //   })
  // } catch(e) {
  //   console.error(e)
  // }

  // //console.log(event.weRunData.data);
  // var moblie = event.weRunData.data.phoneNumber;
  // return moblie
}
