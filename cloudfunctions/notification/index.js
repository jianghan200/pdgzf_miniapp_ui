// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const result = await cloud.openapi.uniformMessage.send({
      "touser": event.openId,
      "mpTemplateMsg": {
        'appid': 'wxa34893f4a43bbc85',
        'templateId': 'oblXoyZXtoAGx-XlG8YfCCK9d7KsC0jNRuuTWj_8XRA',
        'url': event.url,
        "data": {
          "first": {
            "value": '点击卡片查看原文',
            "color": '#173177'
          },
          "keyword1": {
            "value": '文章链接',
            "color": '#173177'
          },
          "keyword2": {
            "value": event.title,
            "color": '#173177'
          },
          "keyword3": {
            "value": event.createTime,
            "color": '#173177'
          },
          "remark": {
            "value": '感谢您的使用',
            "color": '#173177'
          }
        }
      }
    })
    return result
  } catch (err) {
    return err
  }
}