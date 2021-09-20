const constants = require('../../utils/constants')
const utils = require('../../utils/util')
const requests = require('../../utils/request')
const app = getApp()
Page({
  data: {
    pName: '',
    todayHouses: [],
    project : {},
    areaIdx : -1,
    areaId : -1,
    pId : -1,
    // 小区详情
    descriptions : [],
    medias : [],
    equipments: [],
    // 小区的统计信息
    heatMap : [],
    // 是不是VIP？
    isVip: false
  },

  onLoad: function (options) {
    let self = this
    // 需要在allProjects中找到这个小区
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects) {
      let pId = options.pid
      // 首先locate社区
      let areaOpt = 
        allProjects.find(area => {
          // 数据可能出现areaId为空的情况或者小区Id为空的情况
          let projectOpt = area.projects.find(p => p.pId == pId)
          return projectOpt
        })

      if (areaOpt) {
        // 再找到小区
        let theProject = areaOpt.projects.find(p => p.pId == pId)
        // 看看这个小区有没有出现在今日房源中
        let todayProjectsDictionary = wx.getStorageSync('todayProjects')
        let todayHousesInfo = []
        if (todayProjectsDictionary) {
          let tps = []
          todayProjectsDictionary.forEach(area => {
            tps = tps.concat(area.projects)
          })
          let todayProjectOpt = tps.find(p => p.pId == pId)
          // 这个小区出现在今日房源中，我们才把它的今天的信息populate进去
          if (todayProjectOpt) {
            // 此小区的所有房屋的信息
            todayHousesInfo = 
              todayProjectOpt.houses.map(house => {
                // 房间的名称需要精简
                let pieces = house.fullName.split('/')
                pieces.splice(0, 1)
                let betterName = pieces.join('/')

                // 只有vip能看到预计排名
                let rank = '升级为VIP解锁'
                if (app.globalData.userinfo.type == 2) {
                  rank = house.rank
                }
                // 今日房源的队列（用startDate表达）
                let sortedStartDates = []
                let displayedQueue = '暂无'
                if (house.queue.length != 0) {
                  sortedStartDates = 
                    utils.sortByProperty(house.queue, 'position', utils.numberComparator).map(item => item.startDate)
                  if (sortedStartDates.length > 3) {
                    // 不想显示特别长的队列，只取前三名
                    displayedQueue = sortedStartDates.slice(0, 3).join('，')
                  } else {
                    displayedQueue = sortedStartDates.join('，')
                  }
                }

                let houseInfo = {
                  name: betterName,
                  rent: house.rent,
                  size: house.area,
                  type: constants.id2Type(house.typeName),
                  rank: rank,
                  displayedQueue : displayedQueue,
                  queueLength : house.queue.length
                }
                return houseInfo
              })
          }
        }

        // 集体setData
        self.setData({
          pName: theProject.pName,
          todayHouses: todayHousesInfo,
          areaIdx : areaOpt.id,
          areaId : areaOpt.areaId,
          pId : pId,
          isVip : app.globalData.userinfo.type == 2
        }, () => {
          // 拿到所有近期租出去的房间的ID
          let idsOfRecentHouses = theProject.houseInfo.map(house => house.houseId)
          // 从后端获取小区的详情
          // 1. 小区的详情如多媒体信息。
          // 2. 小区的热度信息。
          // 3. 小区的近期房源的排队信息。
          Promise
            .all([requests.getProjectInfo(pId), requests.heatOfTheProject(pId), requests.queuesOfHouses(idsOfRecentHouses)])
            .then((rs) => {
              let details = rs[0] // 已经处理好的信息包括多媒体的url，描述，设施简介等
              let heatMap = rs[1] // 是个obj的array
              let queuesOfHouses = rs[2] // 所有house的排队队列（前四名）
              
              // 整理需要展示出来的小区的度量值
              let projectInfo = {}
              projectInfo['latestHouseInfo'] = 
                theProject.houseInfo.map(house => {
                  let queueOpt = queuesOfHouses.find(info => info.houseId == house.houseId)

                  let ownerStartDate = '暂无数据'
                  let hotIndexOnPickedDate = '暂无数据'
                  if (queueOpt && queueOpt.queue.length > 0) {
                    ownerStartDate = utils.formatDate(new Date(queueOpt.queue[0].userStartDate))
                    hotIndexOnPickedDate = queueOpt.hotIndex
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
                    hotIndexOnPickedDate : hotIndexOnPickedDate
                  }
                })

              projectInfo['totalCount'] = theProject.rentableCount
              self.setData({
                heatMap : heatMap,
                project : projectInfo
              }, () => {
                if (details && details != null) {
                  // 大部分小区都是没有详情的
                  self.setData({
                    descriptions : details.descriptions,
                    medias : details.medias,
                    equipments : details.equipments
                  })
                }
              })
            })
            .catch((err) => {
              console.log(err)
            })
        })
      }
    }
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    wx.navigateTo({
      url: `/pages/map/map?mode=single&id=${this.data.areaIdx}&pid=${this.data.pId}&aid=${this.data.areaId}&pname=${this.data.pName}`,
    })
  },

  // 预览某个照片
  preview(e) {
    let item = e.target.dataset.item
    let idx = this.data.medias.indexOf(item)
    wx.previewMedia({
      sources : this.data.medias,
      current : idx,
      showmenu : false
    })
  }
})