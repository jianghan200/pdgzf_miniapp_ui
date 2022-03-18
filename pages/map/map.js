const constants = require("../../utils/constants")
let app = getApp()
const log = require('./../../utils/log')
const utils = require('./../../utils/util')

Page({
  data: {
    title: '',
    mode: '',
    selfLatitude: 31.23037,
    selfLongitude: 121.4737,
    markers: []
  },

  onLoad(options) {
    log.info('onLoad map')
    log.info(options)

    let self = this

    this.setData({
      mode: self.options.mode
    })

    // 拿到用户的坐标
    wx.getLocation({
      type: "wgs84",
      success: function (res) {
        var latitude = res.latitude
        var longitude = res.longitude

        console.log("当前位置的经纬度为：", latitude, longitude)

        self.setData({
          selfLatitude: latitude,
          selfLongitude: longitude,
        })
      }
    })

    // 不同功能使用同一个map，但是模式不一样
    let queryKey = ''
    if (this.options.mode == 'today') {
      queryKey = 'todayProjects'
      this.setData({
        title: '今日房源'
      })
    } else if (this.options.mode == 'all') {
      queryKey = 'allProjects'
      this.setData({
        title: '全部房源'
      })
    } else if (this.options.mode == 'single') {
      queryKey = 'allProjects'
      this.setData({
        title: this.options.pname,
        id: this.options.id,
        pid: this.options.pid,
        aid: this.options.aid
      })
    } else if (this.options.mode == 'singleToday') {
      queryKey = 'todayProjects'
      this.setData({
        title: this.options.pname,
        id: this.options.id,
        pid: this.options.pid,
        aid: this.options.aid
      })
    }

    let rawData = wx.getStorageSync(queryKey)

    if (rawData) {
      if (this.options.mode == 'today') {
        this.markersOfTodayMap(rawData)
      } else if (this.options.mode == 'all') {
        this.markersForAllMode(rawData)
      } else if (this.options.mode == 'single') {
        this.markerForSingleProject(rawData)
      } else if (this.options.mode == 'singleToday') {
        this.markerForTodaySingleProject(rawData)
      }
    }
  },

  // 场景为“今日地图时”
  markersOfTodayMap(rawData) {
    let newMarkers = this.data.markers

    // flatMap
    let projects = []
    rawData.forEach(area => {
      projects = projects.concat(area.projects)
    })

    for (let i = 0; i < projects.length; i++) {
      let project = projects[i]

      let marker = this.generateMarkerForTodayMap(project, i)
      newMarkers.push(marker)
    }
      
    this.setData({
      markers: newMarkers
    })
  },

  // 场景为“今日单个坐标”时
  markerForTodaySingleProject(rawData) {
    let newMarkers = this.data.markers

    let theArea = rawData.find(area => area.id == this.data.id && area.areaId == this.data.aid)
    let project = theArea.projects.find(p => p.pId == this.data.pid)

    let marker = this.generateMarkerForTodayMap(project, 0)
    newMarkers.push(marker)

    this.setData({
      markers: newMarkers
    })
  },

  // 生成今日地图上的坐标点
  generateMarkerForTodayMap(project, index) {
    let notices = project.raw.queueNotice == null ? '' : project.raw.queueNotice.split('。')
    // 今天放出的房屋数量
    let todayCountDesc = ''
    if (project.houses) {
      todayCountDesc = `今天放出${project.houses.length}套`
    }

    let recentAppearCounts = ''
    let recentHouseCounts = ''
    if (project.appearCounts) {
      recentAppearCounts = `最近30日出现: ${project.appearCounts}次`
    }
    if (project.houseCounts) {
      recentHouseCounts = `最近30日出现: ${project.houseCounts}套房源`
    }

    // 后端传过来的经纬度都是百度地图中拿到的，必须矫正后才能使用
    let coordinates = utils.convert2TecentMap(project.raw.longitude, project.raw.latitude)

    return {
      id: index, // marker 点击事件回调会返回此 id
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      width: 22,
      height: 32,
      customCallout : {
        anchorY: 10,
        anchorX: 0,
        display : 'BYCLICK'
      },
      pname: project.pName,
      todayCountDesc: todayCountDesc,
      countDesc: `拥有${project.raw.houseCount}套公租房`,
      queueNotice: notices,
      appearCounts: recentAppearCounts,
      houseCounts: recentHouseCounts
    }
  },

  // 用于生成热力图
  gradient(count) {
    // 0~50, 51~100, 101~300, 301~400, 401~inf
    if (count <= 50) {
      return './../../assets/black.png'
    } else if (count >= 51 && count <= 100) {
      return './../../assets/blue.png'
    } else if (count >= 101 && count <= 300) {
      return './../../assets/green.png'
    } else if (count >= 301 && count <= 400) {
      return './../../assets/orange.png'
    } else {
      return './../../assets/red.png'
    }
  },

  // 场景为“全部房源地图”时
  markersForAllMode(rawData) {
    let newMarkers = this.data.markers 
    // flatMap
    let projects = []
    rawData.forEach(area => {
      projects = projects.concat(area.projects)
    })

    for (let i = 0; i < projects.length; i++) {
      let marker = this.generateMarkerForAllProjectsMap(projects[i], i)
      newMarkers.push(marker)
    }

    this.setData({
      markers: newMarkers
    })
  },

  // 场景为单个坐标的时候
  markerForSingleProject(rawData) {
    let newMarkers = this.data.markers

    let theArea = rawData.find(area => area.id == this.data.id && area.areaId == this.data.aid)
    let project = theArea.projects.find(p => p.pId == this.data.pid)
    
    let marker = this.generateMarkerForAllProjectsMap(project, 0)
    newMarkers.push(marker)

    this.setData({
      markers: newMarkers
    })
  },

  // 为全部房源地图提供坐标
  generateMarkerForAllProjectsMap(project, index) {
    // 房屋类型和价格信息
    let housesInfo = 
      project.houseInfo.map(elem => {
        return {
          houseType : constants.id2Type(elem.typeName),
          houseCount : elem.typeCount,
          rent : elem.rent,
          size : elem.area,
          timestamp : elem.updateTime
        }
      })

    // 后端传过来的经纬度都是百度地图中拿到的，必须矫正后才能使用
    let coordinates = utils.convert2TecentMap(project.raw.longitude, project.raw.latitude)
    
    return {
      id: index, // marker 点击事件回调会返回此 id
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      iconPath: this.gradient(project.rentableCount),
      width: 22,
      height: 22,
      customCallout : {
        anchorY: 10,
        anchorX: 0,
        display : 'BYCLICK'
      },
      pname: project.raw.name,
      countDesc: `拥有${project.rentableCount}套公租房`,
      houseInfo: housesInfo
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    console.log(this.data)
    var path = '/pages/today/today?mode=' + this.data.mode
    return {
      title : 'PD公租房',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({
            title: '转发成功',
            icon: 'success'
          })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({
            title: '转发已取消',
          })
        } else {
          wx.showToast({
            title: '转发失败',
          })
        }
      }
    }
  }
})