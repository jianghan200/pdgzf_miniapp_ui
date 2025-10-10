// pages/today/today.js
const dataHelper = require('../../utils/data')
const util = require('../../utils/util')
let app = getApp()
const subHelper = require('../../utils/subscripton')
const constants = require('../../utils/constants')
const log = require('./../../utils/log')
const userHelper = require('./../../utils/user')
const wpHelper = require('../../utils/wp')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    // 要展示的数据
    list: [],
    // dateStamp
    milestone: '',
    timeStamp: '',
    // 小区、房源数量
    projectCount: 0,
    houseCount: 0,
    // Modal相关
    showModal: false,
    // 排序Modal相关
    showSortModal: false,
    sortBy: 'name', // name, count, rank, hotness
    sortOrder: 'desc', // asc, desc
    // 每天早9:30 ～ 10:03之间要关闭选房
    disable: false,
    // vip的身份flag
    isVip: false,
    hasStartDate: false,
    // 公告
    broadcastMsgs: [],
    // 原始数据备份，用于排序
    originalList: []
  },

  onLoad: function (options) {
    log.info('onLoad today')
    // 获取公告
    this.getBroadcastMsgs()
    // 根据当前的时间设置“今日页”的状态
    const date = new Date()
    // 9:30 am ~ 10:03 am期间禁选
    if ((date.getHours() == 9 && date.getMinutes() >= 30) || (date.getHours() == 10 && date.getMinutes() <= 3)) {
      log.info('选房期，不显示今日房源')

      this.setData({
        disable : true,
        isVip : app.globalData.userinfo.type == 2,
        // 用户是否输入了自己的startDated
        hasStartDate : this.hasStartDate()
      })
    } else {
      log.info('正常情况')
      // 正常情况
      this.setData({ disable : false }, () => { this.useTodayProjectsInStorage() })
    }
    if (options['pid'] != undefined && options['pid'] != '') {
      // 来自分享, 需要redirect到community页面, 由于耦合度高, 因此要先跳转到today页面, 再跳转到community
      let forum = ''
      if(options['forum'] != undefined && options['forum'] != '') {
        forum = `&forum=${options['forum']}`
      }
      let aid = ''
      if(options['aid'] != undefined && options['aid'] != '') {
        aid = `&aid=${options['aid']}`
      }
      let discussionType = ''
      if(options['discussionType'] != undefined && options['discussionType'] != '') {
        discussionType = `&discussionType=${options['discussionType']}`
      }
      wx.navigateTo({ url: '../community/community?pid=' + options['pid'] + forum + aid + discussionType})
    } else if (options['mode'] != undefined && options['mode'] != '') {
      wx.navigateTo({ url: '../map/map?mode=' + options['mode']})
    }
  },

  // 活动公告
  getBroadcastMsgs() {
    const self = this
    wpHelper
      .getBroadcastMsgs()
      .then((res) => {
        log.info(`获得${res.length}条公告`)

        self.setData({ broadcastMsgs : res })
      })
      .catch((err) => {
        log.error(err)
        console.log(err)
        
        wx.showToast({ title: '未获取公告', icon: 'error' })
      })
  },

  // 刷新今日的数据
  refresh() {
    log.info('刷新房源')

    dataHelper.loadTodayData().then((res) => {
      log.info('loadTodayData 成功')
      // 读取最新的今日数据
      this.useTodayProjectsInStorage()
      // 展示Modal
      this.refreshSuccessModal()
    }).catch(err => { console.log(err) })
  },

  // 显示刷新数据成功后的Modal
  refreshSuccessModal() {
    this.setData({ showModal: true })
  },

  // 隐藏Modal
  hideModal() {
    this.setData({ showModal: false })
  },

  // 显示排序Modal
  toggleSortModal() {
    this.setData({ showSortModal: !this.data.showSortModal })
  },

  // 隐藏排序Modal
  hideSortModal() {
    this.setData({ showSortModal: false })
  },

  // 设置排序方式
  setSortBy(e) {
    const newSortBy = e.currentTarget.dataset.sort
    let newSortOrder = 'desc'
    
    // 如果点击的是当前排序字段，则切换排序顺序
    if (newSortBy === this.data.sortBy) {
      newSortOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc'
    }
    
    log.info(`设置排序: ${newSortBy} ${newSortOrder}`)
    
    this.setData({
      sortBy: newSortBy,
      sortOrder: newSortOrder
    }, () => {
      log.info('开始执行排序')
      this.sortProjects()
      this.hideSortModal()
    })
  },

  // 排序项目
  sortProjects() {
    const { sortBy, sortOrder, originalList } = this.data
    
    log.info(`排序开始: sortBy=${sortBy}, sortOrder=${sortOrder}`)
    log.info(`原始数据长度: ${originalList ? originalList.length : 0}`)
    
    // 如果没有原始数据，直接返回
    if (!originalList || originalList.length === 0) {
      log.info('没有原始数据，排序终止')
      return
    }
    
    // 提取所有项目，并保留其所属区域信息
    let allProjects = []
    originalList.forEach(area => {
      if (area.projects && area.projects.length > 0) {
        area.projects.forEach(project => {
          // 深拷贝项目，并添加区域信息
          let projectCopy = JSON.parse(JSON.stringify(project))
          projectCopy.areaId = area.areaId
          projectCopy.areaName = area.areaName
          projectCopy.areaIdForMap = area.id // 保留原始的 area.id 用于地图等功能
          allProjects.push(projectCopy)
        })
      }
    })
    
    log.info(`提取到所有项目数量: ${allProjects.length}`)
    
    // 对所有项目进行全局排序
    allProjects.sort((a, b) => {
      let valueA, valueB
      
      switch (sortBy) {
        case 'name':
          valueA = a.pName || ''
          valueB = b.pName || ''
          break
        case 'count':
          valueA = a.houses ? a.houses.length : 0
          valueB = b.houses ? b.houses.length : 0
          break
        case 'rank':
          valueA = a.bestRank || 999999
          valueB = b.bestRank || 999999
          break
        case 'hotness':
          valueA = a.hotness || 0
          valueB = b.hotness || 0
          break
        default:
          return 0
      }
      
      if (sortBy === 'name') {
        // 字符串排序
        if (sortOrder === 'asc') {
          return valueA.localeCompare(valueB, 'zh-CN')
        } else {
          return valueB.localeCompare(valueA, 'zh-CN')
        }
      } else {
        // 数字排序
        if (sortOrder === 'asc') {
          return valueA - valueB
        } else {
          return valueB - valueA
        }
      }
    })
    
    // 直接使用扁平化的项目列表
    this.setData({ list: allProjects })
    
    // 添加调试日志
    log.info(`全局排序完成: ${sortBy} ${sortOrder}`)
    log.info(`排序后项目数量: ${allProjects.length}`)
    
    // 显示排序结果提示
    wx.showToast({
      title: `按${sortBy === 'name' ? '小区名' : sortBy === 'count' ? '套数' : sortBy === 'rank' ? '预排' : '热度'}${sortOrder === 'asc' ? '正序' : '倒序'}排序`,
      icon: 'none',
      duration: 1500
    })
  },

  // 读取
  useTodayProjectsInStorage() {
    log.info('从缓存中读取今日房源的信息')

    let todayProjects = wx.getStorageSync('todayProjects')
    if (todayProjects) {
      // 计算当前的周期，每天早9:30之前属于前一天的选房周期
      let now = new Date()
      let milestone = util.formatDate(new Date())
      if (now.getHours() < 9 || (now.getHours() == 9 && now.getMinutes() <= 29)) {
        milestone = util.formatDate(util.yesterday())
      }
      // 计算小区和房源的数量
      let allProjects = []
      let allHouses = []
      todayProjects.forEach(area => { allProjects = allProjects.concat(area.projects) })
      allProjects.forEach(p => { allHouses = allHouses.concat(p.houses) })

      // 计算每个项目的热度指标（所有房屋队列长度的总和）
      todayProjects.forEach(area => {
        area.projects.forEach(project => {
          let hotness = 0
          if (project.houses && project.houses.length > 0) {
            project.houses.forEach(house => {
              if (house.queue && house.queue.length) {
                hotness += house.queue.length
              }
            })
          }
          project.hotness = hotness
        })
      })

      this.setData({
        list : todayProjects,
        originalList : JSON.parse(JSON.stringify(todayProjects)), // 深拷贝原始数据
        milestone : milestone,
        timeStamp : util.formatTime(new Date()),
        projectCount : allProjects.length,
        houseCount : allHouses.length,
        isVip : app.globalData.userinfo.type == 2,
        // 用户是否输入了自己的startDated
        hasStartDate : this.hasStartDate()
      }, () => {
        // 数据加载完成后应用初始排序
        this.sortProjects()
      })
    }
  },

  // 判断用户的资格日：
  hasStartDate() {
    const startDateCode = userHelper.hasStartDate()
    if (startDateCode >= 0) { return true } else { return false }
  },

  // 用户点击【在地图上查看】
  openMap(e) {
    wx.navigateTo({ url: '/pages/map/map?mode=today' })
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    const id = e.currentTarget.dataset.id
    const aid = e.currentTarget.dataset.aid
    const pid = e.currentTarget.dataset.pid
    const theArea = this.data.list.find(area => area.id == id && area.areaId == aid)
    const theProject = theArea.projects.find(p => p.pId == pid)
    wx.navigateTo({ url: `/pages/map/map?mode=singleToday&id=${id}&pid=${pid}&aid=${aid}&pname=${theProject.pName}` })
  },

  // 用户点击进入【房屋详情】
  navToProject(e) {
    const pId = e.currentTarget.dataset.pid
    wx.navigateTo({ url: '../community/community?pid=' + pId })
  },

  // 普通用户点击VIP范例
  vipSample(e) {
    log.info('普通用户点击vip范例')

    wx.navigateTo({ url: '../community/community?pid=' + constants.vipPid + '&mock=true' })
  },

  // 处理用户订阅 / 取消订阅的操作
  subscribe(e) {
    // 从event中获取定位数据
    const pid = e.currentTarget.dataset.pid
    const pname = e.currentTarget.dataset.pname
    const aid = e.currentTarget.dataset.areaid
    // 如果这个用户是初次使用【订阅】功能的普通用户，需要授权我们使用他的昵称
    const self = this
    self.doSubscribe(pid, pname, aid)
  },

  // 专注于订阅的业务逻辑代码
  doSubscribe(pid, pname, aid) {
    log.info(`用户点击subscribe: pid: ${pid}, pname: ${pname}, aid: ${aid}`)

    const self = this
    
    // 在扁平化的list中找到对应的项目
    const projectIndex = self.data.list.findIndex(p => p.pId == pid && p.areaId == aid)
    if (projectIndex === -1) {
      log.error('未找到对应的项目')
      return
    }
    
    let projectOnChange = self.data.list[projectIndex]
    
    if (!projectOnChange.isSubscribed) {
      log.info('开启订阅')
      // 开启订阅
      subHelper
        .subscribeThenSyncUp(aid, pid, pname)
        .then((rid) => {
          log.info('subscribeThenSyncUp 成功')
          
          // 更新扁平化list中的项目
          projectOnChange.isSubscribed = true
          projectOnChange.ruleId = rid
          self.setData({ 
            ['list[' + projectIndex + '].isSubscribed']: true,
            ['list[' + projectIndex + '].ruleId']: rid
          })
          
          // 同时更新originalList中对应的项目
          self.updateOriginalList(pid, aid, { isSubscribed: true, ruleId: rid })
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
        .then(() => {
          log.info('unsubscribeThenSyncUp 成功')
          
          // 更新扁平化list中的项目
          projectOnChange.isSubscribed = false
          projectOnChange.ruleId = ''
          self.setData({ 
            ['list[' + projectIndex + '].isSubscribed']: false,
            ['list[' + projectIndex + '].ruleId']: ''
          })
          
          // 同时更新originalList中对应的项目
          self.updateOriginalList(pid, aid, { isSubscribed: false, ruleId: '' })
        })
        .catch((err) => {
          log.error('unsubscribeThenSyncUp 失败')
          log.error(err)
          console.log(err)
        })
    }
  },

  // 更新originalList中对应的项目
  updateOriginalList(pid, aid, updates) {
    const { originalList } = this.data
    
    // 找到对应的区域和项目
    for (let areaIndex = 0; areaIndex < originalList.length; areaIndex++) {
      const area = originalList[areaIndex]
      if (area.areaId === aid && area.projects) {
        for (let projectIndex = 0; projectIndex < area.projects.length; projectIndex++) {
          const project = area.projects[projectIndex]
          if (project.pId === pid) {
            // 更新项目属性
            Object.keys(updates).forEach(key => {
              this.setData({
                [`originalList[${areaIndex}].projects[${projectIndex}].${key}`]: updates[key]
              })
            })
            return
          }
        }
      }
    }
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'today') {
      wx.redirectTo({ url: `/pages/${newTab}/${newTab}` })
    }
  },

  // 转发
  onShareAppMessage: function(options) {
    return {
      title : '今日房源',
      path : '/pages/login/login',
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