const cloud = require('../customer_notification/node_modules/wx-server-sdk')

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

  if (data.action && data.action == 'BY_UID') {
    // 拿到某个用户unionId下的全部文章（他创建的）
    const queryRes = await cloud.database().collection('article').where({ uid: data.uid }).orderBy('create_gmt', 'desc').get()
    const user_articles = queryRes.data
    console.log(user_articles)

    return {
      articles: user_articles
    }
  } else if (data.action && data.action == 'MULTI_AID') {
    // 通过多个aid找到所有文章
    const articles = await cloud.database().collection('article').where({ _id: _.in(data.ids) }).get()
    return {
      articles: articles
    }
  } else {
    // 默认行为：query文章by文章的id：aid
    // 如果云函数所在环境为 abc，则下面的调用就会请求到 abc 环境的数据库
    var dbResult = await cloud.database().collection('article').where({ _id: data.aid }).get()
    var article = dbResult.data[0]

    // get latest vote data
    latestVoteData = await cloud.database().collection('comment').where({
      aid: data.aid, 
      comment:{$nin:[null]}
    }).get()
    article['comment'] = latestVoteData.data;
    
    // increase view count of the article
    cloud.database().collection('article').doc(article._id).update({
      data: { view:  _.inc(1) },
      success: function(res) {
        console.log("increate view count of the article ", res.data)
      }
    })

    return { 
      article: article
    }
  }
};


