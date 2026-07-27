// 读取用户的订阅信息
const app = getApp()
const constants = require('../utils/constants')
const log = require('./../utils/log')
const utils = require('../utils/util')

// 用户login
const login = function(jscode) {
  const url = constants.userinfoServer + '/user/login'
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
        log.error('用户login失败, 可能因为网络原因')
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
  const url = constants.userinfoServer + '/rule'

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
  const url = constants.userinfoServer + '/rule/'
  const header = {
    'content-type' : 'application/json',
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
  const url = constants.userinfoServer + '/rule/'
  const header = {
    'content-type' : 'application/json',
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
  const url = constants.userinfoServer + '/user/vip'
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
  const url = constants.userinfoServer + '/pay?type=' + payType
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

  const url = constants.userinfoServer + '/pay/consult?nickName=' + app.globalData.nickname
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
  const url = constants.userinfoServer + '/user/update'
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

// 更新用户默认首页 tab
const updateDefaultTab = function(tab) {
  log.info(`更新用户默认首页 tab: ${tab}`)

  const url = constants.userinfoServer + '/user/update'
  let token = app.globalData.userinfo.tokenStr

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      header: {
        'token' : token,
        'content-type' : 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data: { 'defaultTab' : tab },
      success: function(res) {
        if (res.data.status == 0) {
          // 同步更新全局数据
          app.globalData.userinfo.defaultTab = tab
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

  const url = constants.userinfoServer + '/user/update'
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
  const url = constants.userinfoServer + '/user/update'
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
  const url = constants.userinfoServer + '/user/update'
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
  const url = constants.userinfoServer + '/user/update'
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
  const url = constants.userinfoServer + '/project_detail/' + pid
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
            // let isSampleProject = pid == constants.vipPid
            // if (isSampleProject || app.globalData.userinfo.type == 2) {
              if (info.videoUrls && info.videoUrls != null) {
                JSON.parse(info.videoUrls).forEach(urlStr => {
                  medias.push({
                    'url' : urlStr,
                    'type' : 'video'
                  })
                })
              }
            // }
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

// 评论
const generateArticleIdOf = function(pid) {
  return `pdgzf_project_${pid}`
}

// 获得付费咨询信息
const getConsultStatus = function() {
  log.info(`获取是否付费咨询的信息`)
  
  const url = constants.userinfoServer + '/user/consult'
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

// python接口获得mode
const getAppMode = function() {
  log.info('请求app的mode')

  const url = constants.server + '/config'
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      success: res => {
        log.info(`App的mode为: ${res.data.result.isNormalMode}`)

        app.globalData.isNormalMode = res.data.result.isNormalMode;
        app.globalData.iosModeMsg = res.data.result.iosModeMsg;
        
        resolve(true)
      },
      fail: err => {
        console.log(err)
        log.error(err)
  
        app.globalData.isNormalMode = false
        resolve(false)
      }
    })
  })
}

const getStatusByServerId = function(server_account_id) {
  const url = constants.server + '/user_status/' + server_account_id;
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
  updateDefaultTab : updateDefaultTab,
  updateUserInfo : updateUserInfo,
  updateEmailSubscriptionStatus : updateEmailSubscriptionStatus,
  updateAutoSelectionStatus : updateAutoSelectionStatus,
  getProjectInfo : getProjectInfo,
  heatOfTheProject : heatOfTheProject,
  queuesOfHouses : queuesOfHouses,
  getCandidatesCounts : getCandidatesCounts,
  getValidCandidatesCounts : getValidCandidatesCounts,
  getMonthlyHouseCount : getMonthlyHouseCount,
  getConsultStatus : getConsultStatus,
  getConsultingPaymentInfo : getConsultingPaymentInfo,
  getAppMode: getAppMode,
  getStatusByServerId:getStatusByServerId
}