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
  var data_filter = {has_read: false, uid : data.uid }
  
  //获得所有文章
  var dbResult = await cloud.database().collection('unread').where(data_filter).orderBy(data.orderBy, 'desc').skip(PAGE * PAGE_SIZE).limit(PAGE_SIZE).get()
  let unread = dbResult.data;
  return {data:unread}
};


