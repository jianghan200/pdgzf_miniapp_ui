// 读取用户的订阅信息
const app = getApp()
const constants = require('../utils/constants')
const log = require('./../utils/log')
const utils = require('../utils/util')

// 用户login
const login = function(jscode) {
  const url = constants.userinfoServer + '/api/user/login'
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'POST',
      data: { 'code' : jscode },
      header: { 'content-type' : 'application/x-www-form-urlencoded' },
      success: (res) => {
        if (res.data.status == 0) {
          log.info('用户login成功')
          // 成功
          resolve(res.data.data)
        } else {
          log.error('用户login失败')
          // 请求内容可能有误
          console.log(res)
          reject(res.data.data)
        }
      },
      fail: (err) => {
        log.error('用户login失败')
        console.log(err)

        reject(err)
      }
    })
  })
}

// 获取今日房源
const getTodayProjects = function() {
  let url = constants.server + '/project'
  let header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          // 请求出现异常
          console.log(res)
          resolve([])
        } else {
          // 成功
          resolve(res.data)
        }
      },
      fail: (err) => {
        console.log(err)
        resolve([])
      }
    })
  })
}

// 获取今日房间
const getTodayHouses = function() {
  const url = constants.server + '/house'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          // 请求有误
          console.log(res)
          resolve([])
        } else {
          // 请求成功
          resolve(res.data)
        }
      },
      fail: (err) => {
        console.log(err)
        resolve([])
      }
    })
  })
}

// 获取今日房源的统计信息
const getTodayStats = function() {
  const url = constants.server + '/all_project_stat'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          console.log(res)
          resolve(undefined)
        } else {
          resolve(res.data)
        }
      },
      fail: (err) => {
        console.log(err)
        resolve(undefined)
      }
    })
  })
}

// 获得用户的subscription列表
const getSubscriptions = function() {
  let token = app.globalData.userinfo.tokenStr
  const url = constants.userinfoServer + '/api/rule'

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: { 'token' : token },
      success: function(res) {
        if (res.data.status == 0) {
          // 成功
          resolve(res.data.data)
        } else {
          // 失败
          console.log(res)
          resolve(res.data.data)
        }
      },
      fail: function(err) {
        console.log(err)
        console.log('未能加载到用户的订阅信息')
        resolve(err)
      }
    })
  })
}

// 读取所有小区的信息
const loadAllProjects = function() {
  const url = constants.server + '/all_project'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: function(res) {
        resolve(res.data)
      },
      fail: function(err) {
        console.log(err)
        console.log('全小区数据请求失败！')
        resolve([])
      },
      timeout: 5000 // ms
    })
  })
}

// 读取所有小区的统计信息
const loadProjectHouseInfo = function() {
  const url = constants.server + '/project_house_type'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: function(res) {
        if (res.statusCode == 200) {
          resolve(res.data)
        } else {
          console.log(res)
          resolve([])
        }
      },
      fail: function(err) {
        console.log(err)
        console.log('全部小区的统计信息请求失败！')
        resolve([])
      },
      timeout: 5000
    })
  })
}

// 开启某个小区的订阅
const subscribe = function(pid, pname) {
  const url = constants.userinfoServer + '/api/rule/'
  const header = {
    'content-type' : 'application/x-www-form-urlencoded', 
    'token': app.globalData.userinfo.tokenStr 
  }
  return new Promise((resolve,reject) => {
    wx.request({
      url: url,
      header: header,
      method: 'POST',
      data: {
        projectId: pid,
        name: pname
      },
      success: (res) => {
        if (res.data.status == 0) {
          // 成功
          resolve(res.data.data)
        } else {
          // 请求有误
          console.log(res)
          reject(res.data.data)
        }
      },
      fail: (err) => {
        console.log(err)
        reject(err)
      }
    })
  })
}

// 关闭某个小区的订阅
const unsubscribe = function(ruleId) {
  const url = constants.userinfoServer + `/api/rule/${ruleId}/delete`
  const header = {
    'token': app.globalData.userinfo.tokenStr 
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      method: 'POST',
      success: (res) => {
        if (res.data.status == 0) {
          // 成功
          resolve(res.data.data)
        } else {
          // 请求有误
          console.log(res)
          reject(res.data.data)
        }
      },
      fail: (err) => {
        console.log(err)
        reject(err)
      }
    })
  })
}

// 更新订阅规则
const updateSubscription = function(pid, name, payload) {
  const url = constants.userinfoServer + '/api/rule/'
  const header = {
    'content-type' : 'application/x-www-form-urlencoded',
    'token': app.globalData.userinfo.tokenStr
  }
  payload['projectId'] = pid
  payload['name'] = name
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      method: 'POST',
      data : payload,
      success : (res) => {
        if (res.data.status == 0) {
          resolve(res.data.data)
        } else {
          console.log(res)
          reject(res.data.data)
        }
      },
      fail: (err) => {
        console.log(err)
        reject(err)
      }
    })
  })
}

// 获取用户的vip信息
const getVipInfo = function() {
  let token = app.globalData.userinfo.tokenStr
  const url = constants.userinfoServer + '/api/user/vip'
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: { 'token' : token },
      success: function(res) {
        if (res.data.status == 0) {
          // 成功
          resolve(res.data.data)
        } else {
          // 失败
          console.log(res)
          resolve(res.data.data)
        }
      },
      fail: function(err) {
        console.log(err)
        console.log('未能加载到用户的会员信息')
        resolve(err)
      }
    })
  })
}

// 获取预支付信息
const getPaymentInfo = function(payType) {
  let token = app.globalData.userinfo.tokenStr
  const url = constants.userinfoServer + '/api/pay?type=' + payType
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: { 'token' : token },
      success: function(res) {
        if (res.data.status == 0) {
          // 成功
          log.info('请求pre-payment信息成功！')
          log.info(res)

          resolve(res.data.data)
        } else {
          // 失败
          log.error('请求pre-payment信息失败')
          console.log(res)

          reject(res.data.data)
        }
      },
      fail: function(err) {
        console.log(err)
        reject(err)
      }
    })
  })
}

// 获得付费咨询的付款信息
const getConsultingPaymentInfo = function() {
  log.info('准备获得付费咨询的付款信息(pre-payment)')

  const url = constants.userinfoServer + '/api/pay/consult?nickName=' + app.globalData.nickname
  const header = { 'token': app.globalData.userinfo.tokenStr }
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.data.status == 0) {
          // 成功
          log.info('请求pre-payment信息成功！')
          log.info(res)

          resolve(res.data.data)
        } else {
          // 失败
          log.error('请求pre-payment信息失败')
          log.error(res)
          console.log(res)

          reject(res.data.data)
        }
      },
      fail: (err) => {
        log.error('pre-payment信息获取失败')
        log.error(err)
        console.log(err)
      
        reject(err)
      }
    })
  })
}

// 上传manualStartDate
const updateManualStartDate = function(manualStartDate) {
  const url = constants.userinfoServer + '/api/user/update'
  let token = app.globalData.userinfo.tokenStr
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: {
        'token' : token,
        'content-type' : 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data: { 'manualStartDate' : manualStartDate },
      success: function(res) {
        if (res.data.status == 0) {
          resolve(true)
        } else {
          console.log(res.data.data)
          reject(false)
        }
      },
      fail: function(err) {
        console.log(err)
        reject(false)
      }
    })
  })
}

// 上传用户的昵称(name)，用户的真实姓名(realName)是在后端填好的。
const updateUsername = function(username) {
  log.info(`向用户后端上传用户昵称(${username})`)

  const url = constants.userinfoServer + '/api/user/update'
  let token = app.globalData.userinfo.tokenStr

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: {
        'token' : token,
        'content-type' : 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data : { 'name' : username },
      success: function(res) {
        if (res.data.status == 0) {
          log.info('昵称上传成功')

          resolve(true)
        } else {
          log.error('昵称上传请求失败')
          log.error(res)

          wx.showToast({
            title: '服务器错误',
            icon: 'error'
          })
          resolve(false)
        }
      },
      fail: function(err) {
        log.error('昵称上传失败')
        log.error(err)

        resolve(false)
      }
    })
  })
}

// 上传 / 更新用户的信息
const updateUserInfo = function(email, account, password) {
  const url = constants.userinfoServer + '/api/user/update'
  let token = app.globalData.userinfo.tokenStr
  let payload = {}
  if (email && email.trim() != '') {
    payload['email'] = email.trim()
  }
  if (account && account.trim() != '') {
    payload['account'] = account.trim()
  }
  if (password && password.trim() != '') {
    payload['password'] = password.trim()
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: {
        'token' : token,
        'content-type' : 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data: payload,
      success: function(res) {
        if (res.data.status == 0) {
          // 成功
          resolve(true)
        } else {
          // 失败
          console.log(res.data.data)
          reject(false)
        }
      },
      fail: function(err) {
        console.log(err)
        reject(false)
      }
    })
  })
}

// update是否使用邮件订阅
// 0: 停止订阅，1: 开启订阅
const updateEmailSubscriptionStatus = function(code) {
  const url = constants.userinfoServer + '/api/user/update'
  let token = app.globalData.userinfo.tokenStr
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: {
        'token' : token,
        'content-type' : 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data: { 'emailSubscription' : code },
      success: function(res) {
        if (res.data.status == 0) {
          resolve(true)
        } else {
          console.log(res)
          reject(false)
        }
      },
      fail: function(err) {
        console.log(err)
        reject(false)
      }
    })
  })
}

// update是否自动选房
// 0: No，1: Yes
const updateAutoSelectionStatus = function(code) {
  const url = constants.userinfoServer + '/api/user/update'
  let token = app.globalData.userinfo.tokenStr
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: {
        'token' : token,
        'content-type' : 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data: { 'autoChoose' : code },
      success: function(res) {
        if (res.data.status == 0) {
          resolve(true)
        } else {
          console.log(res)
          reject(false)
        }
      },
      fail: function(err) {
        console.log(err)
        reject(false)
      }
    })
  })
}

// 获取某个小区的详情
const getProjectInfo = function(pid) {
  const url = constants.userinfoServer + '/api/project_detail/' + pid
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.data.status == 0) {
          let info = res.data.data
          if (info != null && info) {
            // 照片和视频合并称为media
            let medias = []
            if (info.imageUrls && info.imageUrls != null) {
              JSON.parse(info.imageUrls).forEach(url => {
                medias.push({
                  'url' : url,
                  'type' : 'image'
                })
              })
            }
            // 只有vip能看到视频
            // 或者这个小区是三湘名邸
            let isSampleProject = pid == constants.vipPid
            if (isSampleProject || app.globalData.userinfo.type == 2) {
              if (info.videoUrls && info.videoUrls != null) {
                JSON.parse(info.videoUrls).forEach(urlStr => {
                  medias.push({
                    'url' : urlStr,
                    'type' : 'video'
                  })
                })
              }
            }
            let descriptions = []
            if (info.description && info.description != null) {
              descriptions = info.description.split('；')
            }
            let equipments = []
            if (info.equipment && info.equipment != null) {
              equipments = info.equipment.split('；')
            }
            // 将处理好的info生产出来
            resolve({
              descriptions: descriptions,
              medias : medias,
              equipments : equipments
            })
          } else {
            // 此小区就没有详情
            resolve(res.data.data)
          }
        } else {
          // 失败
          console.log(res.data.data)

          resolve(res.data.data)
        }
      },
      fail: (err) => {
        console.log(err)

        resolve('请求失败，未能获得详情')
      }
    })
  })
}

// 获取某个小区的热度
const heatOfTheProject = function(pid) {
  const url = constants.server + '/daily_hot_index_for_project/' + pid
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          // 请求出现异常
          console.log(res)

          resolve([])
        } else {
          // 成功
          // 做一下简单的处理，将时间戳变成强类型Date，使用cnt制造出hex值用于热力图的显示.
          let list = 
            res.data.map(item => {
              let date = new Date(item.periodStartTime)
              return {
                date : date,
                year : date.getFullYear(),
                month : date.getMonth() + 1,
                date : date.getDate(),
                count : item.cnt,
                hex : utils.number2Hex(item.cnt)
              }
            })

          resolve(list)
        }
      },
      fail: (err) => {
        console.log(err)

        resolve([])
      }
    })
  })
}

const queuesOfHouses = function(houses) {
  const url = constants.server + '/top_rank_for_house/' + houses.join(',')
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          // 请求有误
          console.log(res)

          resolve([])
        } else {
          if (res.data && res.data != null) {
            // 整理一下数据返回 { houseId: 111, queue: [...], hotIndex: 10 }
            let queues = 
              houses.map((hid) => {
                // topRank并没有排序
                let rawRanks = res.data[hid].topRank
                let sortedRanks = []
                if (rawRanks.length > 0) {
                  sortedRanks = utils.sortByProperty(rawRanks, 'userStartDate', utils.dateStrComparator)
                }
                return {
                  houseId : hid,
                  queue : sortedRanks,
                  hotIndex : res.data[hid].hotIndex
                }
              })
            // 成功
            resolve(queues)
          } else {
            // 也算失败
            console.log(res)

            resolve([])
          }
        }
      },
      fail: (err) => {
        console.log(err)
        
        resolve([])
      }
    })
  })
}

// 每个月有多少人获得资格
const getCandidatesCounts = function() {
  const url = constants.server + '/user_apply_number'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          console.log(res)

          resolve([])
        } else {
          if (res.data && res.data != null) {
            resolve(res.data)
          } else {
            console.log(res)

            resolve([])
          }
        }
      },
      fail: (err) => {
        console.log(err)

        resolve([])
      }
    })
  })
}

// 现存的参与排队的人数（per month）
const getValidCandidatesCounts = function() {
  const url = constants.server + '/user_qualification_distribution'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          console.log(res)

          resolve([])
        } else {
          if (res.data && res.data != null) {
            resolve(res.data)
          } else {
            console.log(res)

            resolve([])
          }
        }
      },
      fail: (err) => {
        console.log(err)

        resolve([])
      }
    })
  })
}

// 每个月有多少房源
const getMonthlyHouseCount = function() {
  const url = constants.server + '/house_cnt_per_month'
  const header = {
    'content-type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        if (res.statusCode != 200) {
          console.log(res)

          resolve([])
        } else {
          if (res.data && res.data != null) {
            resolve(res.data)
          } else {
            console.log(res)

            resolve([])
          }
        }
      },
      fail: (err) => {
        console.log(err)

        resolve([])
      }
    })
  })
}

// Post用户的反馈
const postFeedback = function(jiraType, desc, email) {
  log.info(`准备post反馈（${jiraType}, ${desc}, ${email}）`)

  const url = constants.prodFeedbackServer + '/wp_pdgzf/wp-json/wp/v2/posts'
  const unionId = app.globalData.userinfo.unionId
  const nickname = app.globalData.userinfo.nickname
  const token = utils.base64_encode(constants.wordpressFeedbackUsername + ':' + constants.wordpressFeedbackPassword)
  const header = {
    'Authorization' : 'Basic ' + token
  }
  var data = {
    'title' : '意见反馈' + ': ' + jiraType + '(' + nickname + ': ' + unionId + ')' + '(' + email + ')',
    'content' : desc,
    'status': 'publish',
    'meta' : {
      'unionId' : unionId,
      'email' : email
    }
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url : url,
      header : header,
      data : data,
      method: 'POST',
      success : function(res) {
        log.info('成功上传反馈（描述）')

        resolve(res.data.id)
      },
      fail : function(err) {
        log.error('反馈上传（描述）失败')
        log.error(err)
        
        resolve(-1)
      }
    })
  })
}

// 上传反馈用到的图片（s）
const sendAllFeedbackImgs = function(imgUrls, postId) {
  log.info(`准备上传（${imgUrls.length}）张图片到postId：${postId}`)

  let promises = 
    imgUrls.map(url => {
      return sendFeedbackImg(url, postId)
    })

  return Promise.all(promises).then((res) => {
    log.info(`成功上传全部（${imgUrls.length}）张图片到postId：${postId}`)

    return Promise.resolve(true)
  }).catch(err => {
    log.error(err)

    return Promise.resolve(false)
  })
}

// 发送一张图片到wordpress
const sendFeedbackImg = function(imgUrl, postId) {
  log.info(`准备上传图片：${imgUrl}到post id：${postId}`)
  
  // 获取图片文件后缀
  const index= imgUrl.lastIndexOf(".");
  const ext = imgUrl.substr(index + 1);
  // 获取文件名
  const filename = imgUrl.substr(imgUrl.lastIndexOf('/') + 1)

  var fs = wx.getFileSystemManager()
  
  const url = constants.prodFeedbackServer + '/wp_pdgzf/wp-json/wp/v2/media' + '?post=' + postId
  const token = utils.base64_encode(constants.wordpressFeedbackUsername + ':' + constants.wordpressFeedbackPassword)
  const header = {
    'Authorization' : 'Basic ' + token,
    'content-type' : 'image/' + ext,
    'Content-Disposition' : `attachment; filename=${filename}`,
    'cache-control' : 'no-cache'
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url : url,
      header : header,
      // 这里的编码方式只能是默认的
      data : fs.readFileSync(imgUrl),
      method : 'POST',
      success : function(res) {
        if (res.statusCode == 201 || res.statusCode == 200) {
          // 说明post成功了，通常为201
          log.info(`图片上传成功(${imgUrl})`)

          resolve(true)
        } else {
          log.error(`图片上传失败(${imgUrl})`)
          log.error(res)
          console.log(res)

          reject(res)
        }
      },
      fail : function(err) {
        log.error(`图片上传失败(${imgUrl})`)
        log.error(err)
        console.log(err)

        reject(err)
      }
    })
  })
}

// 向腾讯云后台get用户的头像和昵称
const getAvatarAndNickname = function() {
  log.info('向云后台请求用户的头像和昵称')

  // 1. 先GET云后台的的头像和昵称
  // 2.1 后台有该用户的头像和昵称，返回
  // 2.2 后台没有该用户的头像和昵称，prompt用户授权头像和昵称
  // 3.1 用户授权自己的头像和昵称，可以使用
  // 3.2 用户不授权自己的头像和昵称，不能使用
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name : 'user',
      data : {
        action : 'GET'
      },
      success: function(res) {
        log.info(res)

        if (!res.result || res.result == null) {
          log.info('云后台未存储用户的头像和昵称')
          log.info('向用户索要昵称和头像url')
          // 没有这个用户的头像和昵称
          wx.showModal({
            title: '需要您的昵称和头像才能使用',
            content: '请点击同意按钮开始使用本程序',
            success: function(res) {
              log.info(res)
              log.info('用户点击了授权弹窗中的按钮')

              if (res.confirm) {
                // 用户点击了“同意”
                log.info('用户点击了同意')
                // 调用getUserProfile接口获得用户的头像和昵称
                wx.getUserProfile({
                  desc: '需要您的昵称和头像',
                  success : function(res) {
                    // 用户同意提供昵称和头像
                    let nickname = res.userInfo.nickName
                    let avatarUrl = res.userInfo.avatarUrl
                    // 像后端post用户的昵称和头像
                    wx.cloud.callFunction({
                      name : 'user',
                      data : {
                        'action' : 'POST',
                        'userInfo' : {
                          'nickName' : nickname,
                          'avatarUrl' : avatarUrl
                        }
                      }
                    }).then((res) => {
                      log.info('成功向云后台post用户的昵称和头像')
      
                      // 在globalData中写入用户的昵称和头像
                      app.globalData.nickname = nickname
                      app.globalData.avatarUrl = avatarUrl
      
                      wx.showToast({
                        title: '信息更新成功',
                        icon: 'success'
                      })
      
                      resolve(true)
                    }).catch((err) => {
                      console.log(err)
                      log.error('未能成功向云后台post用户的昵称和头像')
                      log.error(err)
      
                      wx.showToast({
                        title: '信息更新失败',
                        icon: 'error'
                      })
                      
                      resolve(false)
                    })
                  },
                  fail: function(err) {
                    log.error('用户拒绝了授权')
                    log.error(err)
                    console.log(err)
                    // Profile获取失败
                    wx.showToast({
                      title: '很遗憾',
                      icon: 'error'
                    })
      
                    resolve(false)
                  }
                })
              } else {
                log.error('用户拒绝了授权（Modal中点击了cancel）')
                log.error(err)
                // Profile获取失败
                wx.showToast({
                  title: '很遗憾',
                  icon: 'error'
                })
  
                resolve(false)
              }
            },
            fail: function(err) {
              log.error('程序错误，wx.showModal未能成功')
              log.error(err)

              wx.showToast({
                title: '微信错误',
                icon: 'error'
              })

              resolve(false)
            }
          })
        } else {
          // 拿到了用户的头像和昵称
          log.info('在后端找到了用户的昵称和头像并成功返回')
          log.info(res)

          app.globalData.avatarUrl = res.result.avatarUrl
          app.globalData.nickname = res.result.nickName
          resolve(true)
        }
      },
      fail: function(err) {
        log.error(`调用云函数失败（GET user）`)
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '信息获取失败',
          icon: 'error'
        })

        reject(err)
      }
    })
  })
}

// 评论
const generateArticleIdOf = function(pid) {
  return `pdgzf_project_${pid}`
}

// 向腾讯云后台上传用户在某个小区下的评论
const sendCommentOnSomeProject = function(pid, comments) {
  log.info(`向云后台发布评论：${comments} (${generateArticleIdOf(pid)})`)
  
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name : 'comment',
      data : {
        action: "NEW",
        uid: app.globalData.userinfo.unionId,
        aid: pid, 
        comment: comments,
        avatarUrl: app.globalData.avatarUrl,
        nickName: app.globalData.nickname,
      },
      success: function(res) {
        // request发送成功
        log.info(res)
        if (res.result.code == 200 || res.result.code == 201) {
          log.info('评论发布成功！')

          resolve(true)
        } else {
          log.error('评论发布失败')
          log.error(res)
          
          resolve(false)
        }
        resolve(true)
      },
      fail: function(err) {
        log.error('评论发送失败')
        log.error(err)

        resolve(false)
      }
    })
  })
}

// 获取某个小区的全部评论
const getCommentsOf = function(pid) {
  log.info(`向云后台索要${pid}的全部评论`)

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'comment',
      data: {
        action: "GET_LIST",
        aid: pid
      },
      success: function(res) {
        log.info('收到云后台回复')
        log.info(res)
        
        if (res.result.code == 200 || res.result.code == 201) {
          log.info(`成功获得评论列表(${res.result.data.length})`)
  
          resolve(res.result.data)
        } else {
          log.error(`未能获得评论列表，云后台出现错误`)
          log.error(res)
          
          wx.showToast({
            title: '微信错误',
            icon: 'error'
          })
  
          resolve([])
        }
      },
      fail: function(err) {
        log.error(`未能获得评论列表（${pid}）`)
        log.error(err)
  
        reject([])
      }
    })
  })
}

// 获取公告
const getBroadcastMsgs = function() {
  log.info('准备获取公告信息')

  const url = constants.prodFeedbackServer + '/wp_pdgzf/wp-json/wp/v2/posts?categories=7&_fields=author,id,content,title,link'

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      success: function(res) {
        if (res.statusCode == 200 || res.statusCode == 201) {
          log.info('公告获取成功')
          log.info(res)

          resolve(res.data)
        } else {
          log.error('公告获取失败，WP返回error')
          log.error(res)

          resolve([])
        }
      },
      fail: function(err) {
        log.error('公告获取出现错误')
        log.error(err)

        resolve([])
      }
    })
  })
}

// 获得付费咨询信息
const getConsultStatus = function() {
  log.info(`获取是否付费咨询的信息`)
  
  const url = constants.userinfoServer + '/api/user/consult'
  const header = { 'token' : app.globalData.userinfo.tokenStr }

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: header,
      success: (res) => {
        log.info(res)
        
        if (res.data.status == 0) {
          // 请求成功
          log.info('请求成功')
          log.info(res.data.data)

          // 存入全局变量
          if (res.data.data.code == '') {
            // 尚未开通付费咨询
            log.info('尚未开通付费咨询')

            app.globalData.userinfo.openConsult = false
          } else {
            // 已经开通了付费咨询
            log.info('已经开通了付费咨询')

            app.globalData.userinfo.openConsult = true
            app.globalData.userinfo.payDay = res.data.data.payDay
            app.globalData.userinfo.consultCode = res.data.data.code
          }

          // 其实返回什么不重要
          resolve(res.data.data)
        } else {
          // 请求失败
          log.error('请求失败')
          log.error(res)

          wx.showToast({
            title: '请求失败',
            icon: 'error'
          })
          
          reject(res)
        }
      },
      fail: (err) => {
        log.error('获取咨询信息失败')
        log.error(err)
        console.log(err)
        
        reject(err)
      }
    })
  })
}

module.exports = {
  login : login,
  getSubscriptions : getSubscriptions,
  loadAllProjects : loadAllProjects,
  loadProjectHouseInfo : loadProjectHouseInfo,
  subscribeProject : subscribe,
  unsubscribe: unsubscribe,
  updateSubscription : updateSubscription,
  getTodayProjects : getTodayProjects,
  getTodayHouses : getTodayHouses,
  getTodayStats : getTodayStats,
  getVipInfo : getVipInfo,
  getPaymentInfo : getPaymentInfo,
  updateUsername : updateUsername,
  updateManualStartDate : updateManualStartDate,
  updateUserInfo : updateUserInfo,
  updateEmailSubscriptionStatus : updateEmailSubscriptionStatus,
  updateAutoSelectionStatus : updateAutoSelectionStatus,
  getProjectInfo : getProjectInfo,
  heatOfTheProject : heatOfTheProject,
  queuesOfHouses : queuesOfHouses,
  getCandidatesCounts : getCandidatesCounts,
  getValidCandidatesCounts : getValidCandidatesCounts,
  getMonthlyHouseCount : getMonthlyHouseCount,
  postFeedback : postFeedback,
  sendAllFeedbackImgs : sendAllFeedbackImgs,
  sendCommentOnSomeProject : sendCommentOnSomeProject,
  getAvatarAndNickname : getAvatarAndNickname,
  getCommentsOf : getCommentsOf,
  getBroadcastMsgs : getBroadcastMsgs,
  getConsultStatus : getConsultStatus,
  getConsultingPaymentInfo : getConsultingPaymentInfo
}