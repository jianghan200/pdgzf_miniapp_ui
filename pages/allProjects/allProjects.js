// pages/allProjects/allProjects.js
let app = getApp()
const log = require('./../../utils/log')
const requestHelper = require('../../utils/request')
const dataHelper = require('../../utils/data')
const subHelper = require('../../utils/subscripton')
const utils = require('../../utils/util')
const contants = require('../../utils/constants')
const constants = require('../../utils/constants')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    list : [],
    reqSuccessful: false,
    // 筛选器抽屉
    openDrawer: false,
    // 筛选器
    // 全部的areaName
    areas : [],
    // 选择的areaName
    chosenAreas : [],
    // 房源数量的category
    rentableCountCategory : [],
    chosenRentableCountCategory : [],
    // 未读信息的数量
    unreadCount: 0
  },

  onLoad: function (options) {
    log.info('onLoad allProjects')

    // 设置未读信息的数量
    this.setData({ unreadCount: app.globalData.unread })

    this.useAllProjectsInStorage()
  },

  // 重新请求全部房源的数据。
  refresh() {
    log.info('重新请求全部房源的数据')

    let self = this
    dataHelper
      .loadAllProjectsData()
      .then((res) => {
        log.info('loadAllProjectsData 成功')

        wx.showToast({
          title: '数据读取成功！',
          icon: 'success'
        })
        // 跟onload一样
        self.useAllProjectsInStorage()
      })
      .catch((err) => {
        log.error('loadAllProjectsData 失败')
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '数据获取失败',
          icon: 'error'
        })
      })
  },

  // 重新读取缓存中的allProjects
  useAllProjectsInStorage() {
    const self = this
    const allProjects = wx.getStorageSync('allProjects')
    if (allProjects && allProjects.length > 0) {
      log.info('allProjects 获取成功')

      const newList = self.preproccess(allProjects)
      let areaNames = newList.map(area => area.areaName == null ? '未知街道' : area.areaName)
      let rentableCountCategoryNames = contants.rentableCountCategory
      self.setData({
        list : newList,
        // 默认全选中
        areas : areaNames,
        chosenAreas : areaNames.concat([]),
        rentableCountCategory : rentableCountCategoryNames,
        chosenRentableCountCategory : rentableCountCategoryNames.concat([]),
        reqSuccessful : true
      })
    } else {
      log.error('allProjects 获取失败')
      // 请求失败了，需要特殊处理，立一个flag

      this.setData({ reqSuccessful : false })
    }
  },

  // 点开筛选器抽屉
  openFilterDrawer(e) {
    this.setData({
      openDrawer : true
    })
  },

  // 关闭筛选器抽屉
  closeFilterDrawer(e) {
    this.applyFilters()
    this.setData({
      openDrawer : false
    })
  },

  // 根据最新的筛选器对当前的房源进行筛选
  applyFilters() {
    const chosenAreas = this.data.chosenAreas
    // 每次apply Filter的起点都是原始的allProjects
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects) {
      // 逐个检查社区 / 小区是否需要显示
      for (let aIdx = 0; aIdx < allProjects.length; aIdx++) {
        let thisArea = allProjects[aIdx]
        let areaName = thisArea.areaName == null ? '未知街道' : thisArea.areaName
        if (chosenAreas.indexOf(areaName) == -1) {
          // 这个社区不需要显示
          thisArea['display'] = false
          thisArea.projects.forEach(project => {
            project['display'] = false
          })
        } else {
          // 这个社区需要显示，逐个检查它的每个小区
          let needToDisplayThisArea = false
          for (let pIdx = 0; pIdx < thisArea.projects.length; pIdx++) {
            let thisProject = thisArea.projects[pIdx]
            if (this.ofChosenRentableCountCategory(thisProject.rentableCount)) {
              // 这个小区需要显示
              thisProject['display'] = true
              needToDisplayThisArea = true
            } else {
              // 这个小区不能显示
              thisProject['display'] = false
            }
          }
          thisArea['display'] = needToDisplayThisArea
        }
      }
      this.setData({
        list : allProjects
      })
    }
  },

  // Given a count, decide whether this count fallas into any chosen rentable count category
  ofChosenRentableCountCategory(count) {
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

  // 筛选器中选择社区
  tapArea(e) {
    let tappedAreaName = e.currentTarget.dataset.areaname
    if (tappedAreaName == 'all') {
      // 选中了all，即全选
      // 可能是deselect All或者select All
      if (this.data.areas.length != this.data.chosenAreas.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({
          chosenAreas : this.data.areas
        })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({
          chosenAreas : []
        })
      }
    } else {
      // tap的并不是all
      let curChosenAreas = this.data.chosenAreas.concat([])
      if (curChosenAreas.indexOf(tappedAreaName) == -1) {
        // 是选中
        curChosenAreas.push(tappedAreaName)
        this.setData({
          chosenAreas : curChosenAreas
        })
      } else {
        // 是deselect
        curChosenAreas.splice(curChosenAreas.indexOf(tappedAreaName), 1)
        this.setData({
          chosenAreas : curChosenAreas
        })
      }
    }
  },

  // 筛选器中选择小区房源数量
  tapRentableCounts(e) {
    let tappedCategory = e.currentTarget.dataset.category
    if (tappedCategory == 'all') {
      if (this.data.rentableCountCategory.length != this.data.chosenRentableCountCategory.length) {
        // 有部分未选中的，此时点击all，即为select All
        this.setData({
          chosenRentableCountCategory : this.data.rentableCountCategory
        })
      } else {
        // 全选中，此时点击all，即为deselect All
        this.setData({
          chosenRentableCountCategory : []
        })
      }
    } else {
      // tap的并不是all
      let curRentableCountCategory = this.data.chosenRentableCountCategory.concat([])
      if (curRentableCountCategory.indexOf(tappedCategory) == -1) {
        // 是选中
        curRentableCountCategory.push(tappedCategory)
        this.setData({
          chosenRentableCountCategory : curRentableCountCategory
        })
      } else {
        // 是deselect
        curRentableCountCategory.splice(curRentableCountCategory.indexOf(tappedCategory), 1)
        this.setData({
          chosenRentableCountCategory : curRentableCountCategory
        })
      }
    }
  },

  // 为了方便显示，对allProjects进行加工
  preproccess(allProjects) {
    allProjects.forEach(area => {
      area['display'] = true
      area.projects.forEach(project => {
        project['display'] = true
      });
    });
    return allProjects
  },

  // 搜索小区的名字
  searchPname(e) {
    let key = e.detail.value
    let newList = this.data.list
    for (let areaIdx = 0; areaIdx < newList.length; areaIdx++) {
      let areaDisplay = false
      let projectOfThisArea = newList[areaIdx].projects
      for (let pIdx = 0; pIdx < projectOfThisArea.length; pIdx++) {
        if (projectOfThisArea[pIdx].pName.search(key) != -1) {
          // 有这个关键字
          newList[areaIdx].projects[pIdx].display = true
          areaDisplay = true
        } else {
          newList[areaIdx].projects[pIdx].display = false
        }
      }
      newList[areaIdx].display = areaDisplay
    }

    this.setData({
      list : newList
    })
  },

  // 导航到某个小区
  navToProject(e) {
    let pId = e.currentTarget.dataset.pid
    let url = '../community/community?pid=' + pId
    wx.navigateTo({
      url: url,
    })
  },

  // 在地图上查看所有房源
  openMap(e) {
    wx.navigateTo({
      url: '/pages/map/map?mode=all',
    })
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
    let pid = e.currentTarget.dataset.pid
    let pname = e.currentTarget.dataset.pname
    let aid = e.currentTarget.dataset.aid
    // 如果这个用户是初次使用【订阅】功能的普通用户，需要授权我们使用他的昵称
    let self = this
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

              wx.showToast({
                title: '未能成功录入昵称',
                icon: 'error'
              })
            })
        },
        fail: (err) => {
          log.error('用户拒绝提供昵称')
          log.error(err)
          console.log(err)
          
          wx.showToast({
            title: '没有昵称，无法收藏',
            icon: 'error'
          })
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

    let self = this
    // 找所属到街道
    let area = 
      self.data.list.find(area => {
        // 数据可能出现areaId为空的情况或者小区Id为空的情况
        let projectOpt = area.projects.find(p => p.pId == pid)
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
          let updatedArea = {
            id: area.id,
            areaId: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea,
            display: true
          }
          // 更新list
          self.setData({
            ['list[' + indexOfThisArea + ']'] : updatedArea
          })
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
          let updatedArea = {
            id: area.id,
            areaId: aid,
            areaName: area.areaName,
            projects: projectsOfThisArea,
            display: true
          }
          // 更新list
          self.setData({
            ['list[' + indexOfThisArea + ']'] : updatedArea
          })
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
    var path = '/pages/allProjects/allProjects'
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
  },

  // Bottom Bar的功能
  redirect: function(e) {
    const newTab = e.detail
    if (newTab != 'allProjects') {
      const url = `/pages/${newTab}/${newTab}`

      wx.redirectTo({
        url: url
      })
    }
  }
})