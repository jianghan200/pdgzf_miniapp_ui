const requests = require('./request')
const util = require('./util')

// 处理今日小区的rawData
const handleTodayProjects = function(projectsRawData, housesRawData, stats) {
  const projectInGroups = 
    util.groupBy(projectsRawData, function(item) {
      // 小区信息用社区id划分组别
      return item.township
    })

  const houseInGroups =
    util.groupBy(housesRawData, function(item) {
      // 房屋信息用小区id划分组别
      return item.projectId
    }).map(group => {
      let sample = group[0]
      return {
        pId : sample.projectId,
        houses : group
      }
    })

  let list = 
    projectInGroups.map(group => {
      let sampleElem = group[0]
      let areaName = sampleElem.townshipName
      
      let projects = 
        group.map(elem => {
          let hosuesOfThisProject = houseInGroups.find(g => g.pId == elem.id)
          let project = {
            pId: elem.id,
            pName: elem.name,
            updateTime: elem.updateTime,
            rentableCount: elem.rentableCount,
            raw: elem
          }
          if (stats && stats[elem.id]) {
            project['appearCounts'] = stats[elem.id]['project']
            project['houseCounts'] = stats[elem.id]['house']
          }
          if (hosuesOfThisProject) {
            project['houses'] = hosuesOfThisProject.houses
          }
          return project
        })

      return {
        id: projectInGroups.indexOf(group),
        areaId: sampleElem.township,
        areaName: areaName,
        projects: projects
      }
    })
  wx.setStorageSync('todayProjects', list)
}

// 处理全部小区的rawData
const handleAllProjects = function(projects, info, subscriptionsRawData) {
  // 将房屋信息按照小区Id分组
  let houseInfoInGroups =
    util.groupBy(info, function(item) {
      return item.projectId
    }).map(group => {
      let sample = group[0]
      let projectId = sample.projectId
      return {
        pId: projectId,
        houseInfo: group
      }
    })
  
  // 将小区按照社区Id分组
  const areas = 
    util.groupBy(projects, function(item) {
      return item.township
    })

  let list = 
    areas.map(group => {
      let sampleElem = group[0]
      // 社区名称
      let areaName = sampleElem.townshipName
      
      let projects = 
        group.map(elem => {
          // 判断该小区是否已经被订阅
          let subscriptionOpt = subscriptionsRawData.find(sub => sub.projectId == elem.id)
          // 判断该小区是否有房屋信息
          let houseInfoOpt = houseInfoInGroups.find(g => g.pId == elem.id)
          let project = {
            pId: elem.id,
            pName: elem.name,
            updateTime: elem.updateTime,
            rentableCount: elem.houseCount,
            isSubscribed: subscriptionOpt == undefined ? false : true,
            ruleId: subscriptionOpt == undefined ? '' : subscriptionOpt.id,
            houseInfo: houseInfoOpt == undefined ? [] : houseInfoOpt.houseInfo,
            raw: elem
          }
          return project
        })

      return {
        id: areas.indexOf(group),
        areaId: sampleElem.township,
        areaName: areaName,
        projects: projects
      }
    })
  wx.setStorageSync('allProjects', list)
}

// 读取所有数据
const loadAllData = function() {
  Promise
    .all([
      requests.getTodayProjects(), requests.getTodayHouses(), requests.getTodayStats(), 
      requests.loadAllProjects(), requests.loadProjectHouseInfo(),
      requests.getSubscriptions()
    ])
    .then((rs) => {
      // 今日的数据
      let todayProjectsRawData = rs[0]
      let todayHousesRawData = rs[1]
      let todayStats = rs[2]
      // 全部的数据
      let allProjectsRawData = rs[3]
      let allProjectsHouseInfoRawData = rs[4]
      // 订阅信息
      let subscriptions = rs[5]
      wx.setStorageSync('subscriptions', subscriptions)

      handleTodayProjects(todayProjectsRawData, todayHousesRawData, todayStats)
      handleAllProjects(allProjectsRawData, allProjectsHouseInfoRawData, subscriptions)

      wx.redirectTo({
        url: '/pages/today/today',
      })
    })
    .catch((err) => {
      console.log(err)
    })
}

// 读取今日房源需要的所有数据
const loadTodayData = function() {
  return Promise
    .all([requests.getTodayProjects(), requests.getTodayHouses(), requests.getTodayStats()])
    .then((rs) => {
      let todayProjectsRawData = rs[0]
      let todayHousesRawData = rs[1]
      let todayStats = rs[2]

      handleTodayProjects(todayProjectsRawData, todayHousesRawData, todayStats)
      return Promise.resolve(true)
    })
}

// 读取全部房源需要的所有数据
const loadAllProjectsData = function() {
  return Promise
    .all([requests.loadAllProjects(), requests.loadProjectHouseInfo(), requests.getSubscriptions()])
    .then((rs) => {
      // 全部的数据
      let allProjectsRawData = rs[3]
      let allProjectsHouseInfoRawData = rs[4]
      // 订阅信息
      let subscriptions = rs[5]
      wx.setStorageSync('subscriptions', subscriptions)

      handleAllProjects(allProjectsRawData, allProjectsHouseInfoRawData, subscriptions)
      Promise.resolve(true)
    })
}

// 读取用户订阅
const loadUserSubscriptions = function() {
  requests.getSubscriptions().then((res) => {
    wx.setStorageSync('subscriptions', subscriptions)
  }).catch((err) => {
    console.log(err)
  })
}

module.exports = {
  loadAllData : loadAllData,
  loadTodayData : loadTodayData,
  loadAllProjectsData : loadAllProjectsData,
  loadUserSubscriptions : loadUserSubscriptions
}