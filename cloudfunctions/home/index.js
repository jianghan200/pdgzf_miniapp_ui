const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 核心入口，通过小程序生态获取 UNIONID, 返回用户对象
exports.main = async (data, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  console.log(data);
  console.log(context);

  // 获得用户信息，如果是新用户就创建用户信息
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

  // 数据分页参数处理
  if(data.page == null){
    data.page = 0
  }
  if(data.pageSize == null){
    data.pageSize = 100
  }
  PAGE = data.page
  PAGE_SIZE = data.pageSize

  // 数据排序参数处理
  if(data.orderBy == null){
    data.orderBy = "create_gmt"
  }

  // 数据过滤条件处理
  // 默认返回 转租信息
  if(data.type == null){
    data.type = 1
  }
  var data_filter = {is_deleted: false, type : data.type }
  if(data.topic != null){
    data_filter = {
      is_deleted: false,
      type : data.type,
      topic: data.topic
     }
  }

  //获得所有文章
  var dbResult = await cloud.database().collection('article').where(data_filter).orderBy(data.orderBy, 'desc').skip(PAGE * PAGE_SIZE).limit(PAGE_SIZE).get()
  let articles = dbResult.data;

  // 数据返回钱进行预先处理
  // for(var j = 0,len=articles.length; j < len; j++) {
  //   articles[j]["create_gmt_simple"]  = articles[j].create_gmt.substr(0,10)
  // }
  // console.log(dbResult);
  return {user:user, articles:articles}
};


