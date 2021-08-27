const constants = require('../../utils/constants')
const utils = require('../../utils/util')

Page({
  data: {
    pName: '',
    houses: [],
    project : {},
    areaIdx : -1,
    areaId : -1,
    pId : -1
  },

  onLoad: function (options) {
    let self = this

    // 需要在allProjects中找
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
        let todayProjects = wx.getStorageSync('todayProjects')
        let housesInfo = []
        if (todayProjects) {
          let tps = []
          todayProjects.forEach(area => {
            tps = tps.concat(area.projects)
          })
          let thePOpt = tps.find(p => p.pId == pId)
          // 这个小区出现在今日房源中，我们才把它的今天的
          if (thePOpt) {
            // 此小区的所有房屋的信息
            housesInfo = 
              thePOpt.houses.map(house => {
                let pieces = house.fullName.split('/')
                pieces.splice(0, 1)
                let betterName = pieces.join('/')
                let houseInfo = {
                  name: betterName,
                  rent: house.rent,
                  size: house.area,
                  type: constants.id2Type(house.typeName)
                }
                return houseInfo
              })
          }
        }

        // 整理需要展示出来的小区的度量值
        let projectInfo = {}
        projectInfo['latestHouseInfo'] = 
          theProject.houseInfo.map(house => {
            return {
              area : house.area,
              rent : house.rent,
              tCount : house.typeCount,
              type : constants.id2Type(house.typeName),
              // 这个小区的所有房源最近都是在什么时候出现的。
              updateTime : utils.formatDate(new Date(house.updateTime))
            }
          })
        projectInfo['totalCount'] = theProject.rentableCount

        self.setData({
          pName: theProject.pName,
          houses: housesInfo,
          project: projectInfo,
          areaIdx : areaOpt.id,
          areaId : areaOpt.areaId,
          pId : pId
        })
      }
    }
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    wx.navigateTo({
      url: `/pages/map/map?mode=single&id=${this.data.areaIdx}&pid=${this.data.pId}&aid=${this.data.areaId}&pname=${this.data.pName}`,
    })
  }
})