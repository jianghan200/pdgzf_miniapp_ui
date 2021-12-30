const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 核心入口，通过小程序生态获取 open_id， 返回用户对象和用户在本小区的文章信息
// 云函数入口函数
exports.main = async (data, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  console.log(data);
  console.log(context);
  var dbResult = await cloud.database().collection('user').where({unionid: wxContext.UNIONID}).get()
  console.log(dbResult)
  let user = dbResult.data[0]
  if(user == null){
    dbResult = await db.collection('user').add({
      data: {
        openid: wxContext.OPENID,
        unionid: wxContext.UNIONID,
        avatarUrl: data.userInfo.avatarUrl,
        nickName: data.userInfo.nickName,
        create_gmt: new Date(),
        update_gmt: new Date(),
      }
    })
    dbResult = await cloud.database().collection('user').where({unionid: wxContext.UNIONID}).get()
    user = dbResult.data[0];
  }
  // var query = { 
  //   complex_id : user.complex_id
  // };
  // if(data.type != null){
  //   query["type"] = data.type;
  // }
  // console.log(query);

  if(data.page == null){
    data.page = 0
  }
  if(data.pageSize == null){
    data.pageSize = 100
  }
  PAGE = data.page
  PAGE_SIZE = data.pageSize

  if(data.orderBy == null){
    data.orderBy = "create_gmt"
  }

  var dbResult = await cloud.database().collection('article').orderBy(data.orderBy, 'desc').skip(PAGE * PAGE_SIZE).limit(PAGE_SIZE).get()
  let articles = dbResult.data;

  // for(var j = 0,len=articles.length; j < len; j++) {
  //   articles[j]["create_gmt_simple"]  = articles[j].create_gmt.substr(0,10)
  // }
  console.log(dbResult);
  return {user:user, articles:articles}
};


