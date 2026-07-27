// pages/pudong/pudong.js
const dataHelper = require('../../utils/data')
const util = require('../../utils/util')
let app = getApp()
const subHelper = require('../../utils/subscripton')
const constants = require('../../utils/constants')
const log = require('./../../utils/log')
const userHelper = require('../../utils/user')
const wpHelper = require('../../utils/wp')
const pinyinMatch = require('pinyin-match')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom,
    StatusBar: app.globalData.StatusBar,
    activeSubTab: 'today',

    // ========== 今日房源 ==========
    todayList: [],
    todayMilestone: '',
    todayTimeStamp: '',
    todayProjectCount: 0,
    todayHouseCount: 0,
    todayShowModal: false,
    todayOpenDrawer: false,
    todaySortBy: 'hotness',
    todaySortOrder: 'desc',
    todayHideSortFilter: false,
    todayProjectNames: [],
    todayChosenProjects: [],
    todayHideProjectFilter: false,
    todayCountCategories: ['1套', '2-5套', '6-10套', '10套以上'],
    todayChosenCountCategories: [],
    todayHideCountFilter: false,
    todayDisable: false,
    todayIsVip: false,
    todayHasStartDate: false,
    todayBroadcastMsgs: [],
    todayOriginalList: [],

    // ========== 全部房源 ==========
    allList: [],
    allReqSuccessful: false,
    allOpenDrawer: false,
    allAreas: [],
    allChosenAreas: [],
    allHideAreaFilter: false,
    allRentableCountCategory: [],
    allChosenRentableCountCategory: [],
    allHideRentableCountFilter: false,
    allRoomTypes: [],
    allChosenRoomTypes: [],
    allHideRoomTypesFilter: false,
    allPriceIntervals: [],
    allChosenPriceIntervals: [],
    allHidePriceFilter: false
  },

  onLoad: function (options) {
    log.info('onLoad pudong')
    this.loadToday()
    this.loadAll()

    if (options['pid'] != undefined && options['pid'] != '') {
      let forum = options['forum'] ? `&forum=${options['forum']}` : ''
      let aid = options['aid'] ? `&aid=${options['aid']}` : ''
      let dt = options['discussionType'] ? `&discussionType=${options['discussionType']}` : ''
      wx.navigateTo({ url: '../community/community?pid=' + options['pid'] + forum + aid + dt })
    } else if (options['mode'] != undefined && options['mode'] != '') {
      wx.navigateTo({ url: '../map/map?mode=' + options['mode'] })
    }
  },

  // ==================== 子 Tab 切换 ====================
  switchSubTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeSubTab) return
    this.setData({ activeSubTab: tab })
  },

  // ==================== 今日房源 ====================
  loadToday() {
    this.getBroadcastMsgs()
    const date = new Date()
    if ((date.getHours() == 9 && date.getMinutes() >= 30) || (date.getHours() == 10 && date.getMinutes() <= 3)) {
      this.setData({
        todayDisable: true,
        todayIsVip: app.globalData.userinfo.type == 2,
        todayHasStartDate: this.hasStartDate()
      })
    } else {
      this.setData({ todayDisable: false }, () => { this.useTodayProjectsInStorage() })
    }
  },

  getBroadcastMsgs() {
    wpHelper.getBroadcastMsgs().then((res) => {
      this.setData({ todayBroadcastMsgs: res })
    }).catch((err) => { log.error(err) })
  },

  todayRefresh() {
    dataHelper.loadTodayData().then(() => {
      this.useTodayProjectsInStorage()
      this.setData({ todayShowModal: true })
    }).catch(err => { console.log(err) })
  },

  todayHideModal() { this.setData({ todayShowModal: false }) },
  todayOpenFilterDrawer() { this.setData({ todayOpenDrawer: true }) },

  todayCloseFilterDrawer() {
    this.todayApplyFilters()
    this.setData({ todayOpenDrawer: false })
  },

  todayChangeSortFilterDisplayStatus() {
    this.setData({ todayHideSortFilter: !this.data.todayHideSortFilter })
  },
  todayChangeProjectFilterDisplayStatus() {
    this.setData({ todayHideProjectFilter: !this.data.todayHideProjectFilter })
  },
  todayChangeCountFilterDisplayStatus() {
    this.setData({ todayHideCountFilter: !this.data.todayHideCountFilter })
  },

  todaySetSortBy(e) {
    const newSortBy = e.currentTarget.dataset.sort
    let newSortOrder = 'desc'
    if (newSortBy === this.data.todaySortBy) {
      newSortOrder = this.data.todaySortOrder === 'asc' ? 'desc' : 'asc'
    }
    this.setData({ todaySortBy: newSortBy, todaySortOrder: newSortOrder }, () => { this.todayApplyFilters() })
  },

  todayResetFilter() {
    this.setData({
      todayChosenProjects: this.data.todayProjectNames,
      todayChosenCountCategories: this.data.todayCountCategories,
      todaySortBy: 'hotness',
      todaySortOrder: 'desc'
    })
  },

  todayTapProject(e) {
    let tapped = e.currentTarget.dataset.project
    if (tapped == 'all') {
      this.setData({
        todayChosenProjects: this.data.todayProjectNames.length != this.data.todayChosenProjects.length
          ? this.data.todayProjectNames : []
      })
    } else {
      let cur = this.data.todayChosenProjects.concat([])
      if (cur.indexOf(tapped) == -1) cur.push(tapped)
      else cur.splice(cur.indexOf(tapped), 1)
      this.setData({ todayChosenProjects: cur })
    }
  },

  todayTapCountCategory(e) {
    const tapped = e.currentTarget.dataset.category
    if (tapped == 'all') {
      this.setData({
        todayChosenCountCategories: this.data.todayCountCategories.length != this.data.todayChosenCountCategories.length
          ? this.data.todayCountCategories : []
      })
    } else {
      let cur = this.data.todayChosenCountCategories.concat([])
      if (cur.indexOf(tapped) == -1) cur.push(tapped)
      else cur.splice(cur.indexOf(tapped), 1)
      this.setData({ todayChosenCountCategories: cur })
    }
  },

  todayEligibleForCountCategory(count) {
    const chosen = this.data.todayChosenCountCategories
    for (let i = 0; i < chosen.length; i++) {
      let ok = false
      switch (chosen[i]) {
        case '1套': ok = count === 1; break
        case '2-5套': ok = count >= 2 && count <= 5; break
        case '6-10套': ok = count >= 6 && count <= 10; break
        case '10套以上': ok = count > 10; break
      }
      if (ok) return true
    }
    return false
  },

  todayApplyFilters() {
    const { todayOriginalList, todayChosenProjects, todayChosenCountCategories } = this.data
    if (!todayOriginalList || todayOriginalList.length === 0) return

    let all = []
    todayOriginalList.forEach(area => {
      if (area.projects && area.projects.length > 0) {
        area.projects.forEach(project => {
          let copy = JSON.parse(JSON.stringify(project))
          copy.areaId = area.areaId
          copy.areaName = area.areaName
          copy.areaIdForMap = area.id
          all.push(copy)
        })
      }
    })

    let filtered = all.filter(p => {
      const nm = todayChosenProjects.length === 0 || todayChosenProjects.indexOf(p.pName) !== -1
      const cm = todayChosenCountCategories.length === 0 || this.todayEligibleForCountCategory(p.houses ? p.houses.length : 0)
      return nm && cm
    })

    this.todaySortProjects(filtered)
    wx.showToast({ title: `找到${filtered.length}个小区`, icon: 'none', duration: 1500 })
  },

  todaySortProjects(projects) {
    const { todaySortBy, todaySortOrder } = this.data
    projects.sort((a, b) => {
      let va, vb
      switch (todaySortBy) {
        case 'name': va = a.pName || ''; vb = b.pName || ''; break
        case 'count': va = a.houses ? a.houses.length : 0; vb = b.houses ? b.houses.length : 0; break
        case 'rank': va = a.bestRank || 999999; vb = b.bestRank || 999999; break
        case 'hotness': va = a.hotness || 0; vb = b.hotness || 0; break
        default: return 0
      }
      if (todaySortBy === 'name') {
        return todaySortOrder === 'asc' ? va.localeCompare(vb, 'zh-CN') : vb.localeCompare(va, 'zh-CN')
      }
      return todaySortOrder === 'asc' ? va - vb : vb - va
    })
    this.setData({ todayList: projects })
  },

  useTodayProjectsInStorage() {
    let todayProjects = wx.getStorageSync('todayProjects')
    if (!todayProjects) return

    let now = new Date()
    let milestone = util.formatDate(new Date())
    if (now.getHours() < 9 || (now.getHours() == 9 && now.getMinutes() <= 29)) {
      milestone = util.formatDate(util.yesterday())
    }

    let allP = [], allH = []
    todayProjects.forEach(area => { allP = allP.concat(area.projects) })
    allP.forEach(p => { allH = allH.concat(p.houses) })

    todayProjects.forEach(area => {
      area.projects.forEach(project => {
        let hotness = 0
        if (project.houses && project.houses.length > 0) {
          project.houses.forEach(house => {
            if (house.queue && house.queue.length) hotness += house.queue.length
          })
        }
        project.hotness = hotness
      })
    })

    const pNames = []
    todayProjects.forEach(area => {
      area.projects.forEach(p => {
        if (pNames.indexOf(p.pName) === -1) pNames.push(p.pName)
      })
    })

    this.setData({
      todayList: todayProjects,
      todayOriginalList: JSON.parse(JSON.stringify(todayProjects)),
      todayMilestone: milestone,
      todayTimeStamp: util.formatTime(new Date()),
      todayProjectCount: allP.length,
      todayHouseCount: allH.length,
      todayIsVip: app.globalData.userinfo.type == 2,
      todayHasStartDate: this.hasStartDate(),
      todayProjectNames: pNames,
      todayChosenProjects: pNames.concat([]),
      todayChosenCountCategories: this.data.todayCountCategories.concat([])
    }, () => { this.todayApplyFilters() })
  },

  hasStartDate() { return userHelper.hasStartDate() >= 0 },

  todayOpenMap() { wx.navigateTo({ url: '/pages/map/map?mode=today' }) },
  todayNavToProject(e) { wx.navigateTo({ url: '../community/community?pid=' + e.currentTarget.dataset.pid }) },
  todayVipSample() { wx.navigateTo({ url: '../community/community?pid=' + constants.vipPid + '&mock=true' }) },

  todaySubscribe(e) {
    const { pid, pname, areaid } = e.currentTarget.dataset
    this.todayDoSubscribe(pid, pname, areaid)
  },

  todayDoSubscribe(pid, pname, aid) {
    const self = this
    const idx = self.data.todayList.findIndex(p => p.pId == pid && p.areaId == aid)
    if (idx === -1) return
    let p = self.data.todayList[idx]

    if (!p.isSubscribed) {
      subHelper.subscribeThenSyncUp(aid, pid, pname).then((rid) => {
        self.setData({ ['todayList[' + idx + '].isSubscribed']: true, ['todayList[' + idx + '].ruleId']: rid })
        self.todayUpdateOriginal(pid, aid, { isSubscribed: true, ruleId: rid })
      }).catch((err) => { log.error(err) })
    } else {
      subHelper.unsubscribeThenSyncUp(p.ruleId, aid, pid).then(() => {
        self.setData({ ['todayList[' + idx + '].isSubscribed']: false, ['todayList[' + idx + '].ruleId']: '' })
        self.todayUpdateOriginal(pid, aid, { isSubscribed: false, ruleId: '' })
      }).catch((err) => { log.error(err) })
    }
  },

  todayUpdateOriginal(pid, aid, updates) {
    const { todayOriginalList } = this.data
    for (let ai = 0; ai < todayOriginalList.length; ai++) {
      const area = todayOriginalList[ai]
      if (area.areaId === aid && area.projects) {
        for (let pi = 0; pi < area.projects.length; pi++) {
          if (area.projects[pi].pId === pid) {
            Object.keys(updates).forEach(k => {
              this.setData({ [`todayOriginalList[${ai}].projects[${pi}].${k}`]: updates[k] })
            })
            return
          }
        }
      }
    }
  },

  // ==================== 全部房源 ====================
  loadAll() {
    const allProjects = wx.getStorageSync('allProjects')
    if (allProjects && allProjects.length > 0) {
      allProjects.forEach(area => {
        area['display'] = true
        area.projects.forEach(p => { p['display'] = true })
      })
      const areaNames = allProjects.map(a => a.areaName == null ? '未知街道' : a.areaName)
      const caps = this.allPriceCapFloor(allProjects)
      const intervals = this.allGeneratePriceIntervals(caps[1], caps[0])
      this.setData({
        allList: allProjects,
        allAreas: areaNames,
        allChosenAreas: areaNames.concat([]),
        allRentableCountCategory: constants.rentableCountCategory,
        allChosenRentableCountCategory: constants.rentableCountCategory.concat([]),
        allRoomTypes: constants.allRoomTypes,
        allChosenRoomTypes: constants.allRoomTypes.concat([]),
        allReqSuccessful: true,
        allPriceIntervals: intervals,
        allChosenPriceIntervals: intervals.concat([])
      })
    } else {
      // 没有缓存则主动加载（启动时不再预加载全量数据，改为按需加载）
      this.setData({ allReqSuccessful: false })
      this.allRefresh()
    }
  },

  allRefresh() {
    dataHelper.loadAllProjectsData().then(() => {
      wx.showToast({ title: '数据读取成功！', icon: 'success' })
      this.loadAll()
    }).catch(() => { wx.showToast({ title: '数据获取失败', icon: 'error' }) })
  },

  allPriceCapFloor(list) {
    const caps = [], floors = []
    list.forEach(el => {
      el.projects.forEach(p => {
        if (p.cap > 0) caps.push(p.cap)
        if (p.floor > 0) floors.push(p.floor)
      })
    })
    return [Math.max(...caps), Math.min(...floors)]
  },

  allGeneratePriceIntervals(floor, cap) {
    const ints = [], txts = []
    if (floor <= 2000) { ints.push(floor); ints.push(2000) }
    for (let c = 4000; c < cap; c += 2000) ints.push(c)
    ints.push(cap)
    if (ints.length < 2) return []
    for (let i = 1; i < ints.length; i++) txts.push([ints[i - 1], ints[i]])
    return txts
  },

  allOpenFilterDrawer() { this.setData({ allOpenDrawer: true }) },
  allCloseFilterDrawer() { this.allApplyFilters(); this.setData({ allOpenDrawer: false }) },
  allChangeAreaFilterDisplay() { this.setData({ allHideAreaFilter: !this.data.allHideAreaFilter }) },
  allChangeRentableCountsFilterDisplay() { this.setData({ allHideRentableCountFilter: !this.data.allHideRentableCountFilter }) },
  allChangeRoomTypesFilterDisplay() { this.setData({ allHideRoomTypesFilter: !this.data.allHideRoomTypesFilter }) },
  allChangePriceFilterDisplay() { this.setData({ allHidePriceFilter: !this.data.allHidePriceFilter }) },

  allResetFilter() {
    this.setData({
      allChosenAreas: this.data.allAreas,
      allChosenRentableCountCategory: this.data.allRentableCountCategory,
      allChosenRoomTypes: this.data.allRoomTypes,
      allChosenPriceIntervals: this.data.allPriceIntervals
    })
  },

  allApplyFilters() {
    const chosen = this.data.allChosenAreas
    let list = wx.getStorageSync('allProjects')
    if (!list) return
    let count = 0
    for (let ai = 0; ai < list.length; ai++) {
      let area = list[ai]
      if (chosen.indexOf(area.areaName) == -1) {
        area['display'] = false
        area.projects.forEach(p => { p['display'] = false })
      } else {
        let need = false
        for (let pi = 0; pi < area.projects.length; pi++) {
          let p = area.projects[pi]
          if (this.allEligibleRentableCounts(p.rentableCount) && this.allEligibleRoomType(p.available_room_type_ids) && this.allEligiblePrice(p.floor, p.cap)) {
            p['display'] = true; need = true; count++
          } else {
            p['display'] = false
          }
        }
        area['display'] = need
      }
    }
    wx.showToast({ title: `找到${count}个小区` })
    this.setData({ allList: list })
  },

  allEligibleRentableCounts(count) {
    for (let i = 0; i < this.data.allChosenRentableCountCategory.length; i++) {
      let lim = constants.rentableCountLimits(this.data.allChosenRentableCountCategory[i])
      if (lim.length > 0 && count >= lim[0] && count < lim[1]) return true
    }
    return false
  },

  allEligibleRoomType(arr) {
    for (let i = 0; i < arr.length; i++) {
      if (this.data.allChosenRoomTypes.indexOf(arr[i]) !== -1) return true
    }
    return false
  },

  allEligiblePrice(floor, cap) {
    for (let i = 0; i < this.data.allChosenPriceIntervals.length; i++) {
      const iv = this.data.allChosenPriceIntervals[i]
      if (!(floor > iv[1] || cap < iv[0])) return true
    }
    return false
  },

  allTapArea(e) {
    let t = e.currentTarget.dataset.areaname
    if (t == 'all') {
      this.setData({ allChosenAreas: this.data.allAreas.length != this.data.allChosenAreas.length ? this.data.allAreas : [] })
    } else {
      let cur = this.data.allChosenAreas.concat([])
      if (cur.indexOf(t) == -1) cur.push(t); else cur.splice(cur.indexOf(t), 1)
      this.setData({ allChosenAreas: cur })
    }
  },

  allTapRentableCounts(e) {
    let t = e.currentTarget.dataset.category
    if (t == 'all') {
      this.setData({ allChosenRentableCountCategory: this.data.allRentableCountCategory.length != this.data.allChosenRentableCountCategory.length ? this.data.allRentableCountCategory : [] })
    } else {
      let cur = this.data.allChosenRentableCountCategory.concat([])
      if (cur.indexOf(t) == -1) cur.push(t); else cur.splice(cur.indexOf(t), 1)
      this.setData({ allChosenRentableCountCategory: cur })
    }
  },

  allTapRoomTypes(e) {
    let t = e.currentTarget.dataset.rtid
    if (t == 'all') {
      this.setData({ allChosenRoomTypes: this.data.allRoomTypes.length != this.data.allChosenRoomTypes.length ? this.data.allRoomTypes : [] })
    } else {
      let cur = this.data.allChosenRoomTypes.concat([])
      if (cur.indexOf(t) == -1) cur.push(t); else cur.splice(cur.indexOf(t), 1)
      this.setData({ allChosenRoomTypes: cur })
    }
  },

  allTapPriceIntervals(e) {
    const floor = e.currentTarget.dataset.floor
    const cap = e.currentTarget.dataset.cap
    if (cap == 'all') {
      this.setData({ allChosenPriceIntervals: this.data.allPriceIntervals.length != this.data.allChosenPriceIntervals.length ? this.data.allPriceIntervals : [] })
    } else {
      let cur = this.data.allChosenPriceIntervals.concat([])
      if (cur.filter(iv => iv[0] == floor).length == 0) {
        cur.push([floor, cap])
      } else {
        const sel = cur.filter(iv => iv[0] == floor)[0]
        cur.splice(cur.indexOf(sel), 1)
      }
      this.setData({ allChosenPriceIntervals: cur })
    }
  },

  allSearchProject(e) {
    this.allResetFilter()
    const key = e.detail.value
    let list = this.data.allList
    if (key.trim() !== '') {
      for (let ai = 0; ai < list.length; ai++) {
        let ad = false
        for (let pi = 0; pi < list[ai].projects.length; pi++) {
          if (pinyinMatch.match(list[ai].projects[pi].pName, key) === false) {
            list[ai].projects[pi].display = false
          } else {
            list[ai].projects[pi].display = true; ad = true
          }
        }
        list[ai].display = ad
      }
    } else {
      for (let ai = 0; ai < list.length; ai++) {
        for (let pi = 0; pi < list[ai].projects.length; pi++) list[ai].projects[pi].display = true
        list[ai].display = true
      }
    }
    this.setData({ allList: list })
  },

  allNavToProject(e) { wx.navigateTo({ url: '../community/community?pid=' + e.currentTarget.dataset.pid }) },
  allOpenMap() { wx.navigateTo({ url: '/pages/map/map?mode=all' }) },

  allSubscribe(e) {
    const { pid, pname, aid } = e.currentTarget.dataset
    const self = this
    if (app.globalData.userinfo.type == 0 && app.globalData.userinfo.name == null) {
      wx.getUserProfile({
        desc: '需要您的昵称，才能使用订阅功能',
        success: (res) => {
          const requests = require('../../utils/requests')
          requests.updateUsername(res.userInfo.nickName).then(() => {
            app.globalData.userinfo.name = res.userInfo.nickName
            self.allDoSubscribe(pid, pname, aid)
          }).catch(() => { wx.showToast({ title: '未能成功录入昵称', icon: 'error' }) })
        },
        fail: () => { wx.showToast({ title: '没有昵称，无法收藏', icon: 'error' }) }
      })
    } else {
      self.allDoSubscribe(pid, pname, aid)
    }
  },

  allDoSubscribe(pid, pname, aid) {
    const self = this
    let area = self.data.allList.find(a => a.projects.find(p => p.pId == pid) && a.areaId == aid)
    let ai = self.data.allList.indexOf(area)
    let projs = area.projects
    let p = projs.find(p => p.pId == pid)
    let pi = projs.indexOf(p)

    if (!p.isSubscribed) {
      subHelper.subscribeThenSyncUp(aid, pid, pname).then((rid) => {
        p.isSubscribed = true; p.ruleId = rid
        projs[pi] = p
        self.setData({ ['allList[' + ai + ']']: { id: area.id, areaId: aid, areaName: area.areaName, projects: projs, display: true } })
      }).catch((err) => { log.error(err) })
    } else {
      subHelper.unsubscribeThenSyncUp(p.ruleId, aid, pid).then(() => {
        p.isSubscribed = false; p.ruleId = ''
        projs[pi] = p
        self.setData({ ['allList[' + ai + ']']: { id: area.id, areaId: aid, areaName: area.areaName, projects: projs, display: true } })
      }).catch((err) => { log.error(err) })
    }
  },

  onShareAppMessage: function () {
    return {
      title: '浦东公租房',
      path: '/pages/login/login',
      imageUrl: '',
      success: function (res) { if (res.errMsg == 'shareAppMessage:ok') wx.showToast({ title: '转发成功', icon: 'success' }) },
      fail: function (err) {
        if (err.errMsg == 'shareAppMessage:fail cancel') wx.showToast({ title: '转发已取消' })
        else wx.showToast({ title: '转发失败' })
      }
    }
  }
})