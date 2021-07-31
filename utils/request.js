// 读取用户的订阅信息
const app = getApp()
const constants = require('../utils/constants')

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
          // 成功
          resolve(res.data.data)
        } else {
          // 请求内容可能有误
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
  getTodayStats : getTodayStats
}