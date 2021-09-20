const requests = require('./request')
const util = require('./util')
const app = getApp()

// 处理今日小区的rawData
const handleTodayProjects = function(projectsRawData, housesRawData, stats, subscriptionsRawData) {
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

  // 是不是vip
  let isVip = app.globalData.userinfo.type == 2
  // 是vip，但是也要保证一定有startDate
  let needToCalculateRank = 
    isVip && (app.globalData.userinfo.startDate) && (app.globalData.userinfo.startDate != '')

  let list = 
    projectInGroups.map(group => {
      let sampleElem = group[0]
      let areaName = sampleElem.townshipName
      
      let projects = 
        group.map(elem => {
          let housesOfThisProject = houseInGroups.find(g => g.pId == elem.id)
          // 判断该小区是否已经被订阅
          let subscriptionOpt = subscriptionsRawData.find(sub => sub.projectId == elem.id)
          let project = {
            pId: elem.id,
            pName: elem.name,
            updateTime: elem.updateTime,
            rentableCount: elem.rentableCount,
            raw: elem,
            isSubscribed: subscriptionOpt == undefined ? false : true,
            ruleId: subscriptionOpt == undefined ? '' : subscriptionOpt.id,
          }
          if (stats && stats[elem.id]) {
            project['appearCounts'] = stats[elem.id]['project']
            project['houseCounts'] = stats[elem.id]['house']
          }
          if (housesOfThisProject) {
            if (needToCalculateRank) {
              // 如果是VIP，每个house里面要有用户的预计排名
              housesOfThisProject.houses.forEach(house => {
                let sortedQueue = []
                
                // 先对queue的position进行排序
                sortedQueue = util.sortByProperty(house.queue, 'position', util.numberComparator)

                // 后端传过来的时间不能直接使用 "yyyy-MM-dd hh:mm:ss"
                let userStartDate = app.globalData.userinfo.startDate.split(' ')[0]
                // 用户的资格日
                let userStartDateTime = new Date(userStartDate).getTime()
                // 找到第一个比用户startDate.getTime()更新的
                let rank = 1
                for (let i = 0; i < sortedQueue.length; i++) {
                  let item = sortedQueue[i]
                  // 队伍中某人的资格日
                  let itemStartDateTime = new Date(item.startDate).getTime()
                  // 直到有个人的资格比用户的新，这个人的position就该是用户的
                  if (itemStartDateTime > userStartDateTime) {
                    rank = item.position
                    break
                  } else if (i == sortedQueue.length - 1) {
                    // 已经遍历过整个queue，用户是倒数第一
                    rank = sortedQueue.length + 1
                  }
                }
                house['rank'] = rank
              })
              // 把一个小区houses的最高（最小数字）排名输入
              project['bestRank'] = Math.min.apply(Math, housesOfThisProject.houses.map(house => house.rank))
            }
            project['houses'] = housesOfThisProject.houses
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
        id: areas.indexOf(group), // 这个社区的相对位置, 有的社区是找不到id的
        areaId: sampleElem.township, // 社区的id
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

      // 处理数据
      handleTodayProjects(todayProjectsRawData, todayHousesRawData, todayStats, subscriptions)
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
    .all([requests.getTodayProjects(), requests.getTodayHouses(), requests.getTodayStats(), requests.getSubscriptions()])
    .then((rs) => {
      let todayProjectsRawData = rs[0]
      let todayHousesRawData = rs[1]
      let todayStats = rs[2]
      let subscriptions = rs[3]

      handleTodayProjects(todayProjectsRawData, todayHousesRawData, todayStats, subscriptions)
      return Promise.resolve(true)
    })
}

// 读取全部房源需要的所有数据
const loadAllProjectsData = function() {
  return Promise
    .all([requests.loadAllProjects(), requests.loadProjectHouseInfo(), requests.getSubscriptions()])
    .then((rs) => {
      // 全部的数据
      let allProjectsRawData = rs[0]
      let allProjectsHouseInfoRawData = rs[1]
      // 订阅信息
      let subscriptions = rs[2]
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