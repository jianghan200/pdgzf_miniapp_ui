const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 核心入口，通过小程序生态获取 UNIONID, 返回用户对象
exports.main = async (data, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  console.log(data);
  console.log(context);

  // 数据过滤条件处理
  if(data.uid!=null){
    cloud.database().collection('unread').where({uid: data.uid}).update({
      data: {
        has_read: true
      }
    });
    return {"msg":"All user unread mark as read for " + data.uid }
  }else{
    cloud.database().collection('unread').doc(data.unread_id).update({
      data: {
        has_read: true
      }
    });
    return {"msg":"All user unread mark as read cid " + data.cid}
  }
  
};


