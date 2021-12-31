const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (data, context) => {
  const db = cloud.database()
  const _ = db.command
  const wxContext = cloud.getWXContext()
  
  console.log("input", data);
  console.log("context", context);
  let user = null;
  let complex = null;
  
  // // 通过分享页面请求，没有用户信息
  // if(data.uid == null){
  //   var dbResult = await cloud.database().collection('user').where({_openid: wxContext.OPENID, is_default: true}).get()
  //     console.log(dbResult)
  //     let user = dbResult.data[0]
  //     if(user == null){
  //       dbResult = await db.collection('user').add({
  //         data: {
  //           _openid: wxContext.OPENID,
  //           unionid: wxContext.UNIONID,
  //           is_multi_owner:false,
  //           is_default:true,
  //           complex_name: "金融家",
  //           complex_id: "28ee4e3e603a3bd807eb86802f96ecc8",
  //           create_gmt: new Date(),
  //           update_gmt: new Date(),
  //         }
  //       })
  //       dbResult = await cloud.database().collection('user').where({_openid: wxContext.OPENID, is_default: true}).get();
  //       user = dbResult.data[0];
  //     }
  //     var dbResult = await cloud.database().collection('complex').where({_id: "28ee4e3e603a3bd807eb86802f96ecc8"}).get()
  //     complex = dbResult.data[0]
  // }
  
  // 如果云函数所在环境为 abc，则下面的调用就会请求到 abc 环境的数据库
  var dbResult = await cloud.database().collection('article').where({_id: data.aid}).get()
  var article = dbResult.data[0]

  // // get user's vote data
  // voteData = await cloud.database().collection('vote').where({aid: data.aid, uid: data.uid }).get()

  // console.log("voteData", voteData)
  // if(voteData.data.length == 0){
  //   article['canvote'] = true;
  // }else{
  //   article['canvote'] = false;
  // }

  // get latest vote data
  latestVoteData = await cloud.database().collection('comment').where({aid: data.aid, 
    comment:{$nin:[null]}
  }).get()
  article['comment'] = latestVoteData.data;
  
  // increase view count of the article
  cloud.database().collection('article').doc(article._id).update({
    data: {
      view:  _.inc(1)
    },
    success: function(res) {
      console.log("increate view count of the article ",res.data)
    }
  })

  return { 
    // user:user,
    // complex:complex,
    article:article
  }
};


