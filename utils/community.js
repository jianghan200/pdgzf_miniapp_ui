const log = require('./log')
const requests = require('./request')
const utils = require('./util')
const constants = require('./constants')

// 为小区详情页准备好所有数据
const loadDataForCommunity = function(pid) {
  const articleId = utils.generateArticleIdOf(pid)
  return Promise
    .all([loadDataFromStorage('todayProjects'), loadDataFromStorage('allProjects'), loadDataFromStorage('subscriptions'),
          requests.getProjectInfo(pid), requests.heatOfTheProject(pid), 
          requests.getCommentsOf(articleId)]
    ).then(res => {
      // 这一步主要看请求是否都正常
      log.info('请求一切正常')

      const todayProjects = res[0].data
      const allProjects = res[1].data
      const subscriptions = res[2].data
      const rawMedias = res[3]
      const rawHeatInfo = res[4]
      const rawComments = res[5]

      // allProjects是必须的，不能不存在
      if (allProjects == null || allProjects.length === 0) {
        log.error(`Failed to load allProjects from server`)

        return Promise.reject('请求有误')
      } else {
        log.info('处理数据ing')

        const payload = {
          todayProjects: todayProjects,
          allProjects: allProjects,
          subscriptions: subscriptions,
          rawMedias: rawMedias,
          rawHeatInfo: rawHeatInfo,
          rawComments: rawComments
        }

        return Promise.resolve(payload)
      }
    }).then(payload => {
      // 这一步为了resolve出来社区和小区
      const { allProjects } = payload
      const area = allProjects.find(area => {
        // 数据可能出现areaId为空的情况或者小区Id为空的情况
        const projectOpt = area.projects.find(p => p.pId == pid)
        return projectOpt
      })
      
      if (area) {
        const project = area.projects.find(p => p.pId == pid)
        if (project) {
          // 拿到所有近期租出去的房间的ID
          const idsOfRecentHouses = project.houseInfo.map(house => house.houseId)

          payload['area'] = area
          payload['project'] = project
          payload['idsOfRecentHouses'] = idsOfRecentHouses

          return Promise.resolve(payload)
        } else {
          log.error(`在全部房源中未找到: ${pid}`)
          return Promise.reject('数据有误')
        }
      } else {
        log.error(`未找到任何街道有这个小区(${pid})`)
        return Promise.reject('数据有误')
      }
    }).then(payload => {
      // 这一步生成每个户型的数据，以及可能会有的今日数据
      const { area, project, todayProjects, subscriptions, rawMedias, rawHeatInfo, rawComments, idsOfRecentHouses } = payload
      return getQueuesForEveryHouseTypes(idsOfRecentHouses).then(res => {
        const todayData = getDataFromTodayProject(pid, todayProjects)
        // 文章链接
        let articleUrl = ''
        if (project.raw.wp_url && project.raw.wp_url.trim() != '') {
          log.info(`找到了文章链接：${project.raw.wp_url}（${project.pId}）`)

          articleUrl = project.raw.wp_url
        }
        const statsOfRecentHousesOfAllTypes = populateStatsForAllHouseTypes(project, res)
        // 评论数据
        const comments = handleComments(rawComments)
        // 小区的坐标
        const coordinate = utils.convert2TecentMap(project.raw.longitude, project.raw.latitude)

        // 是否订阅过这个小区
        let subscribed = false
        let ruleId = ''
        const idxOfThisProjectInSubscriptionList = subscriptions.findIndex(item => item.projectId == pid)
        if (idxOfThisProjectInSubscriptionList != -1) {
          subscribed = true
          ruleId = subscriptions[idxOfThisProjectInSubscriptionList].id
        }

        let payload = {
          pId: pid,
          pName: project.pName,
          areaIdx: area.id,
          areaId: area.areaId,
          subscribed: subscribed,
          ruleId: ruleId,
          coordinate: coordinate,
          recentHouseInfo: statsOfRecentHousesOfAllTypes,
          totalCount: project.rentableCount,
          heatMap: rawHeatInfo,
          descriptions: (rawMedias == null) ? null : rawMedias.descriptions,
          medias: (rawMedias == null) ? [] : rawMedias.medias,
          equipments: (rawMedias == null) ? null : rawMedias.equipments,
          todayHouses: [],
          comments: comments,
          articleUrl: articleUrl
        }
        // 根据是否有今日房源populate payload
        if (todayData) {
          // 出现在今日
          log.info(`${project.pName}(${pid})出现在今日房源中`)
  
          const todayHouses = housesOfToday(todayData)
          payload['todayHouses'] = todayHouses

          // 热力图数据需要添加今日的
          let queueLength = 0
          todayHouses.forEach(house => {
            queueLength += house.queueLength
          })
          const date = new Date()
          const heatOfToday = {
            date : date,
            year : date.getFullYear(),
            month : date.getMonth() + 1,
            date : date.getDate(),
            count : queueLength,
            hex : utils.number2Hex(queueLength)
          }
          const newHeatMap = payload.heatMap
          newHeatMap.push(heatOfToday)
          payload.heatMap = newHeatMap

          return Promise.resolve(payload)
        } else {
          // 未出现在今日
          log.info(`${project.pName}(${pid})未出现在今日房源中`)

          return Promise.resolve(payload)
        }
      })
    })
}

// 异步读取localStorage中的数据, 返回Promise
const loadDataFromStorage = function(key) {
  return new Promise((resolve, reject) => {
    wx.getStorage({
      'key': key,
      success: (res) => {
        log.info(`Found ${key} from local storage`)

        resolve(res)
      },
      fail: (err) => {
        log.error(`Failed to find ${key} in local storage`)
        log.error(err)

        console.log(err)

        reject()
      }
    })
  })
}

// 确认今日房源中是否有该小区
const getDataFromTodayProject = function(pid, todayProjects) {
  log.info(`在今日房源中查找: ${pid}`)

  let projects = []
  todayProjects.forEach(area => {
    projects = projects.concat(area.projects)
  })

  return projects.find(p => p.pId == pid)
}

// 处理从今日房源中的房源信息
const housesOfToday = function(project) {
  log.info(`正解析${project.pName}(${project.pId})今日房源的房间信息`)

  const houses = 
    project.houses.map(house => {
      // 房间的名称需要精简
      let pieces = house.fullName.split('/')
      pieces.splice(0, 1)
      let betterName = pieces.join('/')
      // 在今日房源上的排名信息
      // 今日房源的队列（用startDate表达）
      let sortedStartDates = []
      let displayedQueue = '暂无'
      if (house.queue.length != 0) {
        // 按照排队人的资格日的【由远及近】对每个房源的队伍排序
        sortedStartDates = 
          utils.sortByProperty(house.queue, 'position', utils.numberComparator).map(item => item.startDate)
        if (sortedStartDates.length > 3) {
          // 不想显示特别长的队列，只取前三名
          displayedQueue = sortedStartDates.slice(0, 3).join('，')
        } else {
          // 显示出来的队列是一个String，用中文逗号连接
          displayedQueue = sortedStartDates.join('，')
        }
      }

      const houseInfo = {
        name: betterName,
        rent: house.rent,
        size: house.area,
        type: constants.id2Type(house.typeName),
        rank: house.rank,
        displayedQueue : displayedQueue,
        queueLength : house.queue.length,
        // 与显示相关的flag
        hide : false,
        emoveInDate: utils.formatDate(new Date(house.emoveInDate)), 
      }
      return houseInfo
    })

  return houses
}

// 获得小区的各个户型最近一次选房的排队信息
const getQueuesForEveryHouseTypes = function(houseIds) {
  return requests.queuesOfHouses(houseIds).then(queues => {
    log.info(`成功获得各个户型最近一次选房的排队信息`)
    
    return Promise.resolve(queues)
  }).catch(err => {
    log.error(`各个户型最近一次选房的排队信息获取失败`)
    log.error(err)

    return Promise.resolve([])
  })
}

// 准备所有房型的统计数据
const populateStatsForAllHouseTypes = function(project, queuesForHouseTypes) {
  log.info('准备所有房型的统计数据')

  return project.houseInfo.map(house => {
    let queueOpt = queuesForHouseTypes.find(info => info.houseId == house.houseId)

    let ownerStartDate = '暂无数据'
    let hotIndexOnPickedDate = '暂无数据'
    let ownerWaitingDays = '暂无数据'
    if (queueOpt && queueOpt.queue.length > 0) {
      ownerStartDate = utils.formatDate(new Date(queueOpt.queue[0].userStartDate))
      hotIndexOnPickedDate = queueOpt.hotIndex
      ownerWaitingDays = utils.daysInBtw(new Date(queueOpt.queue[0].userStartDate), new Date(house.updateTime))
    }

    return {
      houseId : house.houseId,
      area : house.area,
      rent : house.rent,
      tCount : house.typeCount,
      type : constants.id2Type(house.typeName),
      // 这个小区的所有房源最近都是在什么时候出现的。
      updateTime : utils.formatDate(new Date(house.updateTime)),
      ownerStartDate : ownerStartDate,
      hotIndexOnPickedDate : hotIndexOnPickedDate,
      ownerWaitingDays : ownerWaitingDays,
      // 与显示相关
      hide : true
    }
  })
}

// 处理评论内容
const handleComments = function(rawComments) {
  let comments = []
  rawComments.forEach(comment => {
    comments.push({
      'avatarUrl' : comment.avatarUrl,
      'nickname' : comment.nickName,
      'content' : comment.comment,
      'timestamp' : utils.getTimeDistanceOf(comment.update_gmt)
    })
  })

  log.info(`该小区有${comments.length}条评论`)

  return comments
}

module.exports = {
  loadCommunityDetails: loadDataForCommunity
}