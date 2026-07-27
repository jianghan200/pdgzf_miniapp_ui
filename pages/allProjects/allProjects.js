// pages/allProjects/allProjects.js
let app = getApp()
const log = require('./../../utils/log')
const dataHelper = require('../../utils/data')
const subHelper = require('../../utils/subscripton')
const contants = require('../../utils/constants')
const constants = require('../../utils/constants')
const pinyinMatch = require('pinyin-match')
const market = require('../../utils/market')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    StatusBar: app.globalData.StatusBar,
    list : [],
    reqSuccessful: false,
    // 顶部数据源 Tab：gzf=公租房 shbzf=保租房 market=市场房源
    sourceTab: 'gzf',
    // 保租房/市场房源列表
    shbzfList: [],
    shbzfLoaded: false,
    marketList: [],
    marketLoaded: false,
    marketPage: 1,
    marketHasMore: true,
    marketLoading: false,
    // 筛选器抽屉
    openDrawer: false,
    // 以下均为筛选器
    // 全部的areaName
    areas : [],
    chosenAreas : [],
    hideAreaFilter: false,
    // 按照小区房源数量筛选
    rentableCountCategory : [],
    chosenRentableCountCategory : [],
    hideRentableCountFilter: false,
    // 按照小区可选的户型筛选
    roomTypes: [],
    chosenRoomTypes: [],
    hideRoomTypesFilter: false,
    // 按照价格筛选
    priceIntervals: [],
    chosenPriceIntervals: [],
    hidePriceFilter: false
  },

  onLoad: function (options) {
    log.info('onLoad allProjects')

    this.preprocess()
  },

  // 重新请求全部房源的数据。
  refresh() {
    log.info('重新请求全部房源的数据')

    let self = this
    dataHelper
      .loadAllProjectsData()
      .then(() => {
        log.info('loadAllProjectsData 成功')

        wx.showToast({ title: '数据读取成功！', icon: 'success' })
        // 跟onload一样
        self.preprocess()
      })
      .catch((err) => {
        log.error('loadAllProjectsData 失败')
        log.error(err)
        console.log(err)

        wx.showToast({ title: '数据获取失败', icon: 'error' })
      })
  },

  // 切换顶部数据源 Tab
  switchSourceTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.sourceTab) return
    this.setData({ sourceTab: tab })
    if (tab === 'shbzf' && !this.data.shbzfLoaded) this.loadShbzfList()
    if (tab === 'market' && !this.data.marketLoaded) this.loadMarketList(true)
  },

  // 加载保租房项目列表
  loadShbzfList() {
    const self = this
    market.getShbzfList({ page: 1, size: 50 }).then((res) => {
      if (res && res.status === 0) {
        self.setData({ shbzfList: (res.data && res.data.list) || [], shbzfLoaded: true })
      }
    }).catch(() => {})
  },

  // 加载市场房源列表
  loadMarketList(reset) {
    if (this.data.marketLoading) return
    const page = reset ? 1 : this.data.marketPage
    if (!reset && !this.data.marketHasMore) return
    const self = this
    self.setData({ marketLoading: true })
    market.getMarketList({ page, size: 20 }).then((res) => {
      if (res && res.status === 0) {
        const list = (res.data && res.data.list) || []
        self.setData({
          marketList: reset ? list : self.data.marketList.concat(list),
          marketPage: page + 1,
          marketHasMore: list.length >= 20,
          marketLoaded: true,
          marketLoading: false
        })
      } else {
        self.setData({ marketLoading: false })
      }
    }).catch(() => { self.setData({ marketLoading: false }) })
  },

  // 滚动到底加载更多市场房源
  onMarketReachBottom() {
    if (this.data.sourceTab === 'market') this.loadMarketList(false)
  },

  // 跳转保租房详情
  navToShbzf(e) {
    wx.navigateTo({ url: '/pages/shbzf/detail?id=' + e.currentTarget.dataset.id })
  },

  // 跳转市场房源详情
  navToMarket(e) {
    wx.navigateTo({ url: '/pages/market/detail?id=' + e.currentTarget.dataset.id })
  },

  // 重新读取缓存中的allProjects
  preprocess() {
    const self = this
    const allProjects = wx.getStorageSync('allProjects')
    if (allProjects && allProjects.length > 0) {
      log.info('allProjects获取成功')

      allProjects.forEach(area => {
        area['display'] = true
        area.projects.forEach(project => { project['display'] = true });
      })
      const areaNames = allProjects.map(area => area.areaName == null ? '未知街道' : area.areaName)
      const rentableCountCategoryNames = contants.rentableCountCategory
      const priceCapOfAll = self.priceCapFloorOfAllProjects(allProjects)[0]
      const priceFloorOfAll = self.priceCapFloorOfAllProjects(allProjects)[1]
      const priceIntervals = self.generatePriceIntervals(priceFloorOfAll, priceCapOfAll)
      self.setData({
        list : allProjects,
        areas : areaNames,
        chosenAreas : areaNames.concat([]),
        rentableCountCategory : rentableCountCategoryNames,
        chosenRentableCountCategory : rentableCountCategoryNames.concat([]),
        roomTypes: constants.allRoomTypes,
        chosenRoomTypes: constants.allRoomTypes.concat([]),
        reqSuccessful : true,
        priceIntervals: priceIntervals,
        chosenPriceIntervals: priceIntervals.concat([])
      })
    } else {
      log.error('allProjects 获取失败')
      // 没有缓存则主动加载（启动时不再预加载全量数据，改为按需加载）
      this.setData({ reqSuccessful : false })
      this.refresh()
    }
  },

  // 找到最高和最低价格
  priceCapFloorOfAllProjects(list) {
    const priceCaps = []
    const priceFloors = []
    list.forEach(element => { element.projects.forEach(p => { 
      if (p.cap > 0) { priceCaps.push(p.cap) }
      if (p.floor > 0) { priceFloors.push(p.floor) }
    })})
    return [Math.max(...priceCaps), Math.min(...priceCaps)]
  },

  // 生成房屋价格区间
  generatePriceIntervals(priceFloor, priceCap) {
    const intervals = []
    const intervalsInText = []
    if (priceFloor <= 2000) {
      intervals.push(priceFloor)
      intervals.push(2000)
    }
    for (let newCapOfThisInterval = 4000; newCapOfThisInterval < priceCap; newCapOfThisInterval += 2000) {
      intervals.push(newCapOfThisInterval)
    }
    intervals.push(priceCap)
    if (intervals.length < 2) {
      log.error(`未能正确生成价格区间，floor: ${priceFloor}, cap: ${priceCap}`)
      
      return []
    } else {
      for (let i = 1; i < intervals.length; i++) {
        const cur_floor = intervals[i - 1]
        const cur_cap = intervals[i]
        intervalsInText.push([cur_floor, cur_cap])
      }
      return intervalsInText
    }
  },

  // 点开筛选器抽屉
  openFilterDrawer(e) {
    this.setData({ openDrawer : true })
  },

  // 关闭筛选器抽屉
  closeFilterDrawer(e) {
    this.applyFilters()
    this.setData({ openDrawer : false })
  },

  // hide/unhide社区筛选器
  changeAreaFilterDisplayStatus(e) {
    const curStatus = this.data.hideAreaFilter
    this.setData({ hideAreaFilter: !curStatus })
  },

  // hide/unhide房源数量筛选器
  changeRentableCountsFilterDisplayStatus(e) {
    const curStatus = this.data.hideRentableCountFilter
    this.setData({ hideRentableCountFilter: !curStatus })
  },

  // hide/unhide户型筛选器
  changeRoomTypesFilterDisplayStatus(e) {
    const curStatus = this.data.hideRoomTypesFilter
    this.setData({ hideRoomTypesFilter: !curStatus })
  },

  // hide/unhide价格筛选器
  changePriceFilterDisplayStatus(e) {
    const curStatus = this.data.hidePriceFilter
    this.setData({ hidePriceFilter: !curStatus })
  },

  // 重置所有的筛选器
  resetFilter(e) {
    log.info('重置筛选器')

    this.setData({
      chosenAreas: this.data.areas,
      chosenRentableCountCategory: this.data.rentableCountCategory,
      chosenRoomTypes: this.data.roomTypes,
      chosenPriceIntervals: this.data.priceIntervals
    })
  },

  // 根据最新的筛选器对当前的房源进行筛选
  applyFilters() {
    const chosenAreas = this.data.chosenAreas
    // 每次apply Filter的起点都是原始的allProjects
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects) {
      let displayed_project_counts = 0
      // 逐个检查社区 / 小区是否需要显示
      for (let aIdx = 0; aIdx < allProjects.length; aIdx++) {
        let thisArea = allProjects[aIdx]
        if (chosenAreas.indexOf(thisArea.areaName) == -1) {
          // 这个社区不需要显示
          thisArea['display'] = false
          thisArea.projects.forEach(project => { project['display'] = false })
        } else {
          // 这个社区需要显示，逐个检查它的每个小区
          let needToDisplayThisArea = false
          for (let pIdx = 0; pIdx < thisArea.projects.length; pIdx++) {
            let thisProject = thisArea.projects[pIdx]
            if (this.eligible_for_rentableCounts(thisProject.rentableCount) && this.eligible_for_room_type(thisProject.available_room_type_ids) && this.eligible_for_price_intervals(thisProject.floor, thisProject.cap)) {
              // 这个小区需要显示
              thisProject['display'] = true
              needToDisplayThisArea = true
              displayed_project_counts++
            } else {
              // 这个小区不能显示
              thisProject['display'] = false
            }
          }
          thisArea['display'] = needToDisplayThisArea
        }
      }
      wx.showToast({ title: `找到${displayed_project_counts}个小区` })

      this.setData({ list : allProjects })
    }
  },

  // Given a count, decide whether this count falls into any chosen rentable count category
  eligible_for_rentableCounts(count) {
    let res = false
    const chosenCategory = this.data.chosenRentableCountCategory

    for (let idx = 0; idx < chosenCategory.length; idx++) {
      let limit = constants.rentableCountLimits(chosenCategory[idx])
      if (limit.length > 0) {
        let low = limit[0]
        let high = limit[1]
        if (count >= low && count < high) {
          res = true
          break;
        }
      }
    }
    return res
  },

  // 根据户型筛选, 返回boolean
  eligible_for_room_type(roomTypeArray) {
    let res = false
    for (let i = 0; i < roomTypeArray.length; i++) {
      const roomType = roomTypeArray[i]
      if (this.data.chosenRoomTypes.indexOf(roomType) !== -1) {
        // 这个小区存在用户选中的户型
        res = true
        break;
      }
    }
    return res
  },

  // 根据价格筛选，返回boolean
  eligible_for_price_intervals(floor, cap) {
    let res = false
    for (let i = 0; i < this.data.chosenPriceIntervals.length; i++) {
      const curPriceInterval = this.data.chosenPriceIntervals[i]
      const low = curPriceInterval[0]
      const high = curPriceInterval[1]
      if (!(floor > high || cap < low)) {
        res = true
        break
      }
    }
    return res
  },

  // 筛选器中选择社区
  tapArea(e) {
    let tappedAreaName = e.currentTarget.dataset.areaname
    if (tappedAreaName == 'all') {
      // 选中了all，即全选
      // 可能是deselect All或者select All
      if (this.data.areas.length != this.data.chosenAreas.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({ chosenAreas : this.data.areas })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({ chosenAreas : [] })
      }
    } else {
      // tap的并不是all
      let curChosenAreas = this.data.chosenAreas.concat([])
      if (curChosenAreas.indexOf(tappedAreaName) == -1) {
        // 是选中
        curChosenAreas.push(tappedAreaName)
        this.setData({ chosenAreas : curChosenAreas })
      } else {
        // 是deselect
        curChosenAreas.splice(curChosenAreas.indexOf(tappedAreaName), 1)
        this.setData({ chosenAreas : curChosenAreas })
      }
    }
  },

  // 筛选器中选择小区房源数量
  tapRentableCounts(e) {
    const tappedCategory = e.currentTarget.dataset.category
    if (tappedCategory == 'all') {
      if (this.data.rentableCountCategory.length != this.data.chosenRentableCountCategory.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({ chosenRentableCountCategory : this.data.rentableCountCategory })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({ chosenRentableCountCategory : [] })
      }
    } else {
      // tap的并不是all
      let curRentableCountCategory = this.data.chosenRentableCountCategory.concat([])
      if (curRentableCountCategory.indexOf(tappedCategory) == -1) {
        // 是选中
        curRentableCountCategory.push(tappedCategory)
        this.setData({ chosenRentableCountCategory : curRentableCountCategory })
      } else {
        // 是deselect
        curRentableCountCategory.splice(curRentableCountCategory.indexOf(tappedCategory), 1)
        this.setData({ chosenRentableCountCategory : curRentableCountCategory })
      }
    }
  },

  // 筛选器中选择户型
  tapRoomTypes(e) {
    const tappedRoomType = e.currentTarget.dataset.rtid
    if (tappedRoomType == 'all') {
      if (this.data.roomTypes.length != this.data.chosenRoomTypes.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({ chosenRoomTypes: this.data.roomTypes })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({ chosenRoomTypes: [] })
      }
    } else {
      // tap的并不是all
      let curRoomTypes = this.data.chosenRoomTypes.concat([])
      if (curRoomTypes.indexOf(tappedRoomType) == -1) {
        // 是选中
        curRoomTypes.push(tappedRoomType)
        this.setData({ chosenRoomTypes: curRoomTypes })
      } else {
        // 是deselect
        curRoomTypes.splice(curRoomTypes.indexOf(tappedRoomType), 1)
        this.setData({ chosenRoomTypes: curRoomTypes })
      }
    }
  },

  // 筛选器选中了价格区间
  tapPriceIntervals(e) {
    const tappedPriceFloor = e.currentTarget.dataset.floor
    const tappedPriceCap = e.currentTarget.dataset.cap
    if (tappedPriceCap == 'all') {
      if (this.data.priceIntervals.length != this.data.chosenPriceIntervals.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({ chosenPriceIntervals: this.data.priceIntervals })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({ chosenPriceIntervals: [] })
      }
    } else {
      // tap的并不是all
      let curPriceIntervals = this.data.chosenPriceIntervals.concat([])
      if (curPriceIntervals.filter(interval => interval[0] == tappedPriceFloor).length == 0) {
        // 是选中
        curPriceIntervals.push([tappedPriceFloor, tappedPriceCap])
        this.setData({ chosenPriceIntervals: curPriceIntervals })
      } else {
        // 是deselect
        const selectedInterval = curPriceIntervals.filter(interval => interval[0] == tappedPriceFloor)[0]
        curPriceIntervals.splice(curPriceIntervals.indexOf(selectedInterval), 1)
        this.setData({ chosenPriceIntervals: curPriceIntervals })
      }
    }
  },

  // 搜索小区的名字
  searchProject(e) {
    this.resetFilter()
    const key = e.detail.value
    let newList = this.data.list
    if (key.trim() !== '') {
      // 遍历社区
      for (let areaIdx = 0; areaIdx < newList.length; areaIdx++) {
        let areaDisplay = false
        // 某个社区的小区
        const projectsOfThisArea = newList[areaIdx].projects
        // 遍历小区
        for (let pIdx = 0; pIdx < projectsOfThisArea.length; pIdx++) {
          const targetString = projectsOfThisArea[pIdx].pName
          const testRes = pinyinMatch.match(targetString, key)
          if (testRes === false) {
            // 没匹配成功
            newList[areaIdx].projects[pIdx].display = false
          } else {
            // 有这个关键字
            newList[areaIdx].projects[pIdx].display = true
            areaDisplay = true
          }
        }
        newList[areaIdx].display = areaDisplay
      }

      this.setData({ list : newList })
    } else {
      // 输入空字符或者remove了搜索输入
      for (let areaIdx = 0; areaIdx < newList.length; areaIdx++) {
        for (let pIdx = 0; pIdx < newList[areaIdx].projects.length; pIdx++) {
          newList[areaIdx].projects[pIdx].display = true
        }
        newList[areaIdx].display = true
      }
      this.setData({ list : newList })
    }
  },

  // 导航到某个小区
  navToProject(e) {
    wx.navigateTo({ url: '../community/community?pid=' + e.currentTarget.dataset.pid })
  },

  // 在地图上查看所有房源
  openMap(e) {
    wx.navigateTo({ url: '/pages/map/map?mode=all' })
  },

  // 判断这个用户是否需要授权我们获得ta的昵称
  // 这个用户是一般用户，我们后端没有这个用户的name信息
  needToGetUserProfile() {
    return app.globalData.userinfo.type == 0 && app.globalData.userinfo.name == null
  },

  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    log.info('用户点击订阅')
    // 从event中获取定位数据
    const pid = e.currentTarget.dataset.pid
    const pname = e.currentTarget.dataset.pname
    const aid = e.currentTarget.dataset.aid
    // 如果这个用户是初次使用【订阅】功能的普通用户，需要授权我们使用他的昵称
    const self = this
    if (self.needToGetUserProfile()) {
      log.info('未找到用户的昵称，需要ask用户提供昵称权限')

      wx.getUserProfile({
        desc: '需要您的昵称，才能使用订阅功能',
        success: (res) => {
          log.info('用户同意提供昵称')
          // 从微信的接口中获得用户的昵称作为标识，主要是为了后端管理方便
          let newUsername = res.userInfo.nickName
          requests
            .updateUsername(newUsername)
            .then((r) => {
              log.info('updateUsername 成功')
              // 本地更新一下用户名
              app.globalData.userinfo.name = newUsername
              self.doSubscribe(pid, pname, aid)
            }).catch((err) => {
              log.error('updateUsername 失败')
              log.error(err)
              console.log(err)

              wx.showToast({ title: '未能成功录入昵称', icon: 'error' })
            })
        },
        fail: (err) => {
          log.error('用户拒绝提供昵称')
          log.error(err)
          console.log(err)
          
          wx.showToast({ title: '没有昵称，无法收藏', icon: 'error' })
        }
      })
    } else {
      // 无需授权昵称，执行订阅的业务逻辑
      self.doSubscribe(pid, pname, aid)
    }
  },

  // 专注于订阅的业务逻辑代码
  doSubscribe(pid, pname, aid) {
    log.info(`用户subscribe: pid: ${pid}, pname: ${pname}, aid: ${aid}`)

    const self = this
    // 找所属到街道
    let area = 
      self.data.list.find(area => {
        // 数据可能出现areaId为空的情况或者小区Id为空的情况
        const projectOpt = area.projects.find(p => p.pId == pid)
        return projectOpt && area.areaId == aid
      })
    let indexOfThisArea = self.data.list.indexOf(area)

    // 找到小区
    let projectsOfThisArea = area.projects
    let projectOnChange = projectsOfThisArea.find(p => p.pId == pid)
    let indexOfProjectOnChange = projectsOfThisArea.indexOf(projectOnChange)
    
    if (!projectOnChange.isSubscribed) {
      log.info('开启订阅')
      // 开启订阅
      subHelper
        .subscribeThenSyncUp(aid, pid, pname)
        .then((rid) => {
          log.info('subscribeThenSyncUp 成功')
          // 替换
          projectOnChange.isSubscribed = true
          projectOnChange.ruleId = rid
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          const updatedArea = {
            id: area.id,
            areaId: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea,
            display: true
          }
          // 更新list
          self.setData({ ['list[' + indexOfThisArea + ']']: updatedArea })
        })
        .catch((err) => {
          log.error('subscribeThenSyncUp 失败')
          log.error(err)
          console.log(err)
        })
    } else {
      log.info('关闭订阅')
      // 关闭订阅
      subHelper
        .unsubscribeThenSyncUp(projectOnChange.ruleId, aid, pid)
        .then((res) => {
          log.info('unsubscribeThenSyncUp 成功')
          // 替换
          projectOnChange.isSubscribed = false
          projectOnChange.ruleId = ''
          projectsOfThisArea[indexOfProjectOnChange] = projectOnChange
          const updatedArea = {
            id: area.id,
            areaId: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea,
            display: true
          }
          // 更新list
          self.setData({ ['list[' + indexOfThisArea + ']']: updatedArea })
        })
        .catch((err) => {
          log.error('unsubscribeThenSyncUp 失败')
          log.error(err)
          console.log(err)
        })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    const path = '/pages/allProjects/allProjects'
    return {
      title : '全部房源',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
      imageUrl : '',
      success : function(res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          // 用户转发成功
          wx.showToast({ title: '转发成功', icon: 'success' })
        }
      },
      fail : function(err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') {
          wx.showToast({ title: '转发已取消' })
        } else {
          wx.showToast({ title: '转发失败' })
        }
      }
    }
  }
})