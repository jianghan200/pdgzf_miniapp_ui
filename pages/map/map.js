const constants = require("../../utils/constants")
let app = getApp()
const log = require('./../../utils/log')
const utils = require('./../../utils/util')
const market = require('../../utils/market')
const dataHelper = require('../../utils/data')

Page({
  data: {
    title: '',
    mode: '',
    selfLatitude: 31.23037,
    selfLongitude: 121.4737,
    markers: [],
    // 新增：数据源 Tab（仅 all 模式显示），gzf/shbzf/market
    sourceTab: 'gzf',
    // 半屏列表
    showList: false,
    listData: [],
    // 三类房源分别的 markers
    gzfMarkers: [],
    shbzfMarkers: [],
    marketMarkers: []
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
    } else if (this.options.mode == 'market') {
      this.setData({ title: '市场房源地图' })
      this.loadMarketMarkers()
      return
    } else if (this.options.mode == 'shbzf') {
      this.setData({ title: '保租房地图' })
      this.loadShbzfMarkers()
      return
    }

    let rawData = wx.getStorageSync(queryKey)

    if (rawData) {
      this._renderMapData(rawData)
    } else {
      // 没有缓存则主动加载（启动时不再预加载，改为按需加载）
      const self = this
      const loader = (this.options.mode === 'today' || this.options.mode === 'singleToday')
        ? dataHelper.loadTodayData()
        : dataHelper.loadAllProjectsData()
      loader.then(() => {
        const data = wx.getStorageSync(queryKey)
        if (data) self._renderMapData(data)
      }).catch(() => {
        wx.showToast({ title: '数据加载失败', icon: 'error' })
      })
    }
  },

  _renderMapData(rawData) {
    log.info('_renderMapData mode=' + this.options.mode + ' rawData length=' + (rawData ? rawData.length : 0))
    if (this.options.mode == 'today') {
      this.markersOfTodayMap(rawData)
    } else if (this.options.mode == 'all') {
      this.markersForAllMode(rawData)
    } else if (this.options.mode == 'single') {
      this.markerForSingleProject(rawData)
    } else if (this.options.mode == 'singleToday') {
      this.markerForTodaySingleProject(rawData)
    }
    log.info('_renderMapData done, markers count=' + this.data.markers.length)
  },

  // 切换数据源 Tab（仅 all 模式）
  switchSourceTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ sourceTab: tab })
    let markers = []
    if (tab === 'gzf') markers = this.data.gzfMarkers
    else if (tab === 'shbzf') markers = this.data.shbzfMarkers
    else if (tab === 'market') markers = this.data.marketMarkers
    this.setData({ markers, listData: markers })
  },

  // 加载市场房源 markers
  loadMarketMarkers() {
    const self = this
    market.getMarketList({ page: 1, size: 200 }).then((res) => {
      if (res && res.status === 0) {
        const list = (res.data && res.data.list) || []
        const markers = list.map((item, idx) => {
          return {
            id: 10000 + idx,
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            iconPath: '/assets/marker-deep-orange.png',
            width: 24,
            height: 24,
            customCallout: { anchorY: 10, anchorX: 0, display: 'BYCLICK' },
            pname: item.title || item.address_name,
            countDesc: `${item.rent_display || (item.rent != null ? '¥' + item.rent : '价格待定')}/月 · ${item.house_type || ''} · ${item.area || ''}㎡`,
            sourceType: 'market',
            sourceId: item.id
          }
        }).filter(m => !isNaN(m.latitude) && !isNaN(m.longitude) && m.latitude && m.longitude)
        self.setData({ marketMarkers: markers, markers, listData: list, showList: true })
      }
    }).catch(() => {})
  },

  // 加载保租房 markers
  loadShbzfMarkers() {
    const self = this
    market.getShbzfList({ page: 1, size: 200 }).then((res) => {
      if (res && res.status === 0) {
        const list = (res.data && res.data.list) || []
        const markers = list.map((item, idx) => {
          return {
            id: 20000 + idx,
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            iconPath: '/assets/marker-teal.png',
            width: 24,
            height: 24,
            customCallout: { anchorY: 10, anchorX: 0, display: 'BYCLICK' },
            pname: item.project_name,
            countDesc: `保租房 · ${item.district || ''}`,
            sourceType: 'shbzf',
            sourceId: item.id
          }
        })
        self.setData({ shbzfMarkers: markers, markers, listData: list, showList: true })
      }
    }).catch(() => {})
  },

  // 切换半屏列表显示
  toggleList() {
    this.setData({ showList: !this.data.showList })
  },

  // 点击 marker
  onMarkerTap(e) {
    const markerId = e.markerId
    const marker = this.data.markers.find(m => m.id === markerId)
    if (marker && marker.sourceType === 'market') {
      wx.navigateTo({ url: '/pages/market/detail?id=' + marker.sourceId })
    } else if (marker && marker.sourceType === 'shbzf') {
      wx.navigateTo({ url: '/pages/shbzf/detail?id=' + marker.sourceId })
    }
  },

  // 场景为"今日地图时"
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
      if (marker) newMarkers.push(marker)
    }

    this.setData({
      markers: newMarkers
    })
  },

  // 场景为"今日单个坐标"时
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

    // 坐标不合法则跳过（避免基础库校验失败导致整批 marker 不显示）
    if (!coordinates.lat || !coordinates.lng
        || coordinates.lat < -90 || coordinates.lat > 90
        || coordinates.lng < -180 || coordinates.lng > 180) {
      return null
    }

    // 计算今日房源数量用于图标判断
    let todayCount = project.houses ? project.houses.length : 0
    let markerIcon = this._getMarkerIcon(todayCount)

    return {
      id: index, // marker 点击事件回调会返回此 id
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      width: 24,
      height: 24,
      iconPath: markerIcon,
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

  // 场景为"全部房源地图"时
  markersForAllMode(rawData) {
    let newMarkers = this.data.markers 
    // flatMap
    let projects = []
    rawData.forEach(area => {
      projects = projects.concat(area.projects)
    })

    for (let i = 0; i < projects.length; i++) {
      let marker = this.generateMarkerForAllProjectsMap(projects[i], i)
      if (marker) newMarkers.push(marker)
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

    // 坐标不合法则跳过（避免基础库校验失败导致整批 marker 不显示）
    if (!coordinates.lat || !coordinates.lng
        || coordinates.lat < -90 || coordinates.lat > 90
        || coordinates.lng < -180 || coordinates.lng > 180) {
      return null
    }

    // 根据房源数量判断图标
    let markerIcon = this._getMarkerIcon(project.rentableCount)

    return {
      id: index, // marker 点击事件回调会返回此 id
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      iconPath: markerIcon,
      width: 24,
      height: 24,
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

  // 点击半屏列表项
  onListItemTap(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.mode === 'market') {
      wx.navigateTo({ url: '/pages/market/detail?id=' + id })
    } else if (this.data.mode === 'shbzf') {
      wx.navigateTo({ url: '/pages/shbzf/detail?id=' + id })
    }
  },

  // 根据数量返回 marker 对应的图标路径
  _getMarkerIcon(count) {
    // 0~50, 51~100, 101~300, 301~400, 401~inf
    if (count <= 50) {
      return '/assets/marker-indigo.png'
    } else if (count >= 51 && count <= 100) {
      return '/assets/marker-blue.png'
    } else if (count >= 101 && count <= 300) {
      return '/assets/marker-green.png'
    } else if (count >= 301 && count <= 400) {
      return '/assets/marker-orange.png'
    } else {
      return '/assets/marker-red.png'
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    console.log(this.data)
    var path = '/pages/pudong/pudong?mode=' + this.data.mode
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
