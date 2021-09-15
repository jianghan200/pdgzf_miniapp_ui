const constants = require('../../utils/constants')
const utils = require('../../utils/util')
const requestSender = require('../../utils/request')
const app = getApp()
Page({
  data: {
    pName: '',
    houses: [],
    project : {},
    areaIdx : -1,
    areaId : -1,
    pId : -1,
    // 小区详情
    descriptions : [],
    medias : [],
    equipment: '',
    // 是不是VIP？
    isVip: false
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
                // 房间的名称需要精简
                let pieces = house.fullName.split('/')
                pieces.splice(0, 1)
                let betterName = pieces.join('/')

                // 只有vip能看到预计排名
                let rank = '升级为VIP解锁'
                if (app.globalData.userinfo.type == 2) {
                  rank = house.rank
                }

                let houseInfo = {
                  name: betterName,
                  rent: house.rent,
                  size: house.area,
                  type: constants.id2Type(house.typeName),
                  rank: rank
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

        // 集体setData
        self.setData({
          pName: theProject.pName,
          houses: housesInfo,
          project: projectInfo,
          areaIdx : areaOpt.id,
          areaId : areaOpt.areaId,
          pId : pId,
          isVip : app.globalData.userinfo.type == 2
        }, () => {
          // 从后端获取小区的详情
          requestSender
            .getProjectInfo(pId)
            .then((info) => {
              if (info != null && info) {
                // 照片和视频合并称为media
                let medias = []
                JSON.parse(info.imageUrls).forEach(url => {
                  medias.push({
                    'url' : url,
                    'type' : 'image'
                  })
                })
                // 只有vip能看到视频
                if (app.globalData.userinfo.type == 2) {
                  medias.push({
                    'url' : info.videoUrl,
                    'type' : 'video'
                  })
                }

                self.setData({
                  // 如果有结果，设置小区的详情
                  descriptions : info.description.split('；'),
                  medias: medias,
                  equipment : info.equipment
                })
              }
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