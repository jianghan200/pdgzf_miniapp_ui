const requests = require('./request')
const app = getApp()
const log = require('./log')

// 订阅信息的更新需要手动更新session中的数据
const manualUpdateProjects = function(sessionData, aid, pid, changeTo, sessionKey, rid) {
  // 锁定要更新的社区
  let areaToBeUpdated = 
    sessionData.find(area => {
      // 数据可能出现areaId为空的情况或者小区Id为空的情况
      let projectOpt = area.projects.find(p => p.pId == pid)
      return projectOpt && area.areaId == aid
    })
  if (areaToBeUpdated) {
    let indexOfAreaToBeUpdated = sessionData.indexOf(areaToBeUpdated)
    // 锁定要更新的社区
    let projectToBeUpdated = areaToBeUpdated.projects.find(p => p.pId == pid)
    let indexOfProjectToBeUpdated = areaToBeUpdated.projects.indexOf(projectToBeUpdated)
    // 更新小区
    projectToBeUpdated.isSubscribed = changeTo
    projectToBeUpdated.ruleId = rid
    // 换掉小区
    areaToBeUpdated.projects[indexOfProjectToBeUpdated] = projectToBeUpdated
    // 换掉社区
    sessionData[indexOfAreaToBeUpdated] = areaToBeUpdated
  
    // 更新session
    wx.setStorageSync(sessionKey, sessionData)
  }
}

// 取消订阅并且同步sessions
const unsubscribeThenSyncUp = function(ruleId, aid, pid) {
  // 首先调用后端接口
  return requests.unsubscribe(ruleId).then((res) => {
    // 调用成功后开始手动更新session中的数据
    const curAllProjects = wx.getStorageSync('allProjects')
    const curTodayProjects = wx.getStorageSync('todayProjects')
    // 手动更新所有的缓存
    manualUpdateProjects(curAllProjects, aid, pid, false, 'allProjects', '')
    manualUpdateProjects(curTodayProjects, aid, pid, false, 'todayProjects', '')
    // 将subscription的缓存同步为更新后的状态
    let subscriptions = wx.getStorageSync('subscriptions')
    if (subscriptions) {
      // 不同的场景下通常会在更新了数据后各自处理，为了他们的方便，这里return一个Promise
      const toBeRemovedRule = subscriptions.find(rule => rule.id == ruleId)
      if (toBeRemovedRule) {
        const idxOfToBeRemoved = subscriptions.indexOf(toBeRemovedRule)
        // 注意splice是一个不RT的method，会对数组本身改动，返回被删掉的元素
        subscriptions.splice(idxOfToBeRemoved, 1)
        wx.setStorageSync('subscriptions', subscriptions)

        return Promise.resolve(true)
      } else {
        // 未能在subscriptions中找到ruleId
        log.error(`未能在subscriptions中找到: ${ruleId}`)

        return Promise.resolve(false)
      }
      
    } else {
      // 未能在缓存中找到subscriptions
      log.error('未能在缓存中找到subscriptions')

      return Promise.resolve(false)
    }
  })
}

// 开启订阅并同步session
// 通常使用在今日房源 / 全部房源页面
const subscribeThenSyncUp = function(aid, pid, pname) {
  // 首先调用后端接口
  return requests.subscribeProject(pid, pname).then((res) => {
    // load最新的订阅信息
    return requests
            .getSubscriptions()
            .then((subscriptions) => {
              let subscription = subscriptions.find(s => s.projectId == pid)
              let ruleId = subscription.id
              // 调用成功后手动更新session中的数据
              const curAllProjects = wx.getStorageSync('allProjects')
              const curTodayProjects = wx.getStorageSync('todayProjects')
              // 手动更新所有的缓存
              wx.setStorageSync('subscriptions', subscriptions)
              manualUpdateProjects(curAllProjects, aid, pid, true, 'allProjects', ruleId)
              manualUpdateProjects(curTodayProjects, aid, pid, true, 'todayProjects', ruleId)
              // 不同的场景下通常会在更新了数据后各自处理，为了他们的方便，这里return一个Promise
              return Promise.resolve(ruleId)
            })
  })
}

module.exports = {
  unsubscribeThenSyncUp : unsubscribeThenSyncUp,
  subscribeThenSyncUp : subscribeThenSyncUp
}