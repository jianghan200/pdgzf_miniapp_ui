// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async () => {
  const db = cloud.database()
  res = await db.collection('admin').get()

  return {
    isNormalMode: res.data[0].normalMode
  }
}