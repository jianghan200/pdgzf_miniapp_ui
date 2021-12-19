const constants = require('../../utils/constants')
const utils = require('../../utils/util')
const requests = require('../../utils/request')
const app = getApp()
const log = require('./../../utils/log')

import plugin from './../../components/calendar/plugins/index'
import todo from './../../components/calendar/plugins/todo'
import selectable from './../../components/calendar/plugins/selectable'
plugin.use(todo).use(selectable)

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
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
    articleUrl : '',
    // 小区的统计信息
    heatMap : [],
    monthlyDaysColor: [],
    dayCount : '【无】',
    daySelected : '【请选择一个日期】',
    // 是不是VIP？
    isVip: false,
    // 管理折叠的flags
    equipmentsHidden: false,
    descriptionsHidden: false,
    calendarHidden: false,
    collapseAllTodays: false,
    // 导航栏相关
    curTab : 0,
    scrollLeft : 0,
    // 日历config
    calendarConfig : {
      multi : false,
      theme: 'elegant',
      markToday: '今天',
      highlightToday: false,
      preventSwipe: true,
      onlyShowCurrentMonth: true
    },
    // 评论相关
    myComments: '',
    commentInputHeight : 0, // 初始化的时候尚未on focus，所以贴地板
    commentsList: []
  },

  // 导航栏上选择不同的tab
  tabSelect(e) {
    if (e.currentTarget.dataset.id == 2) {
      this.renderCalendar()
    }
    this.setData({
      curTab: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1 ) * 60
    })
  },

  onLoad: function (options) {
    log.info('onLoad project')
    log.info(options)

    let self = this
    // 首先判断是不是正在VIP范例模式下
    let isMockMode = options.mock
    let isVip = app.globalData.userinfo.type == 2
    // 如果是VIP范例，在这一页中所有人都是VIP
    if (isMockMode) {
      log.info('是范例页')
      isVip = true
    }
    // 需要在allProjects中找到这个小区
    let allProjects = wx.getStorageSync('allProjects')
    if (allProjects) {
      log.info('拿到allProjects')

      let pId = options.pid
      // 使用pId拿到comments
      self.loadCommentList(pId)
      // 首先locate社区
      let areaOpt = 
        allProjects.find(area => {
          // 数据可能出现areaId为空的情况或者小区Id为空的情况
          let projectOpt = area.projects.find(p => p.pId == pId)
          return projectOpt
        })

      if (areaOpt) {
        log.info(`锁定了是哪个社区: ${areaOpt}`)
        // 再找到小区
        let theProject = areaOpt.projects.find(p => p.pId == pId)
        // 确认是否有文章的链接
        let articleUrl = ''
        if (theProject.raw.wp_url && theProject.raw.wp_url.trim() != '') {
          log.info(`找到了文章链接：${theProject.raw.wp_url}（${theProject.pId}）`)

          articleUrl = theProject.raw.wp_url
        }
        // 看看这个小区有没有出现在今日房源中
        let todayProjectsDictionary = wx.getStorageSync('todayProjects')
        let todayHousesInfo = []
        if (todayProjectsDictionary) {
          log.info('拿到todayProjects')
          // populate今日房源的队列
          let tps = []
          todayProjectsDictionary.forEach(area => {
            tps = tps.concat(area.projects)
          })
          let todayProjectOpt = tps.find(p => p.pId == pId)
          // 这个小区出现在今日房源中，我们才把它的今天的信息populate进去
          if (todayProjectOpt) {
            log.info('这个小区今天出现了')
            // 此小区的所有房屋的信息
            todayHousesInfo = 
              todayProjectOpt.houses.map(house => {
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

                let houseInfo = {
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
          }
        }

        // 集体setData
        self.setData({
          pName: theProject.pName,
          todayHouses: todayHousesInfo,
          areaIdx : areaOpt.id,
          areaId : areaOpt.areaId,
          pId : pId,
          isVip : isVip,
          // 如果小区今天恰好有房源，by default显示今日房源tab
          curTab : todayHousesInfo.length == 0 ? 0 : 1,
          articleUrl : articleUrl
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
              log.info('getProjectInfo, heatOfTheProject, queuesOfHouses 均成功')

              let details = rs[0] // 已经处理好的信息包括多媒体的url，描述，设施简介等
              let heatMap = rs[1] // 是个obj的array
              if (todayHousesInfo.length > 0) {
                log.info('今天这个小区出现了')
                // 今日有此小区
                let queueLength = 0
                todayHousesInfo.forEach(house => {
                  queueLength += house.queueLength
                })
                let date = new Date()
                // 生成今天的热度hex
                let heatOfToday = {
                  date : date,
                  year : date.getFullYear(),
                  month : date.getMonth() + 1,
                  date : date.getDate(),
                  count : queueLength,
                  hex : utils.number2Hex(queueLength)
                }
                heatMap.push(heatOfToday)
              }
              let queuesOfHouses = rs[2] // 所有house的排队队列（前四名）
              // 整理需要展示出来的小区的度量值
              let projectInfo = {}
              projectInfo['latestHouseInfo'] = 
                theProject.houseInfo.map(house => {
                  let queueOpt = queuesOfHouses.find(info => info.houseId == house.houseId)

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

              projectInfo['totalCount'] = theProject.rentableCount

              self.setData({
                heatMap : heatMap,
                monthlyDaysColor : self.daysColor(heatMap, new Date().getFullYear(), new Date().getMonth() + 1),
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
              log.error('getProjectInfo, heatOfTheProject, queuesOfHouses 存在失败')
              log.error(err)
              console.log(err)
            })
        })
      }
    }
  },

  // 日历相关方法
  // 拿到当前的calendar组件实例，对其进行配置。
  // wx的this.selectComponent接口有很多限制，首先要求在calendar上添加标签：calendar，且calendar在页面上不能根据wx:if显示，只能用hidden控制。
  renderCalendar() {
    if (this.selectComponent('#calendar')) {
      const calendar = this.selectComponent('#calendar').calendar
      let curYM = calendar.getCurrentYM()
      let month = curYM.month
      let year = curYM.year
      let payloadOfThisMonth = this.daysColor(this.data.heatMap, year, month)
      calendar.setTodos(payloadOfThisMonth)
    } else {
      console.log("this.selectComponent('#calendar') is null");
    }
  },

  // 生成热力日历需要的数据（月度）
  daysColor(heatMap, year, month) {
    let itemsOfThisYearMonth = heatMap.filter(item => item.year == year && item.month == month)
    return {
        // 待办点标记设置
        pos: 'bottom', // 待办点标记位置 ['top', 'bottom']
        dotColor: 'purple', // 待办点标记颜色
        circle: false, // 待办圆圈标记设置（如圆圈标记已签到日期），该设置与点标记设置互斥
        showLabelAlways: true, // 点击时是否显示待办事项（圆点/文字），在 circle 为 true 及当日历配置 showLunar 为 true 时，此配置失效
        dates : itemsOfThisYearMonth.map(item => {
          return {
            year: year,
            month: month,
            date: item.date,
            todoText: item.count + '人',
            color: item.hex // 单独定义代办颜色 (标记点、文字)
          }
        })
    }
  },

  // 切换了月份
  changeMonth(e) {
    this.renderCalendar()
  },

  // 点击了某一天
  dayClick(e) {
    log.info('在热力日历上点击了某一天')
    log.info(e)

    let today = new Date()
    let dayInfo = 
      this.data.heatMap.find(item => item.date == e.detail.day && item.month == e.detail.month && item.year == e.detail.year)
    if (dayInfo) {
      // 选中的日子该小区有房源
      this.setData({
        dayCount : `${dayInfo.count}人参与该小区的竞争`,
        daySelected : `${utils.formatDate(new Date(dayInfo.year, dayInfo.month - 1, dayInfo.date))}有`
      })
    } else if (today.getDate() == e.detail.day && (today.getMonth() + 1) == e.detail.month && today.getFullYear() == e.detail.year) {
      // 恰好选中今天
      // 计算今日有多少人参与此小区的竞争
      let todayCount = 0
      this.data.todayHouses.forEach(house => todayCount = todayCount + house.queueLength)
      this.setData({
        dayCount : `有${todayCount}人参与该小区的竞争`,
        daySelected : '今日'
      })
    } else {
      // 选中这天没有房源
      this.setData({
        dayCount : `未出现房源`,
        daySelected : `${utils.formatDate(new Date(e.detail.year, e.detail.month - 1, e.detail.day))}`
      })
    }
  },

  // hide / unhide sections
  // hide / unhide描述
  changeDescriptionsState(e) {
    let beforeChange = this.data.descriptionsHidden
    this.setData({
      descriptionsHidden : !beforeChange
    })
  },

  // hide / unhide设施
  changeEquipmentsState(e) {
    let beforeChange = this.data.equipmentsHidden
    this.setData({
      equipmentsHidden : !beforeChange
    })
  },

  // hide / unhide所有的今日数据
  collapseAllTodayProjects(e) {
    let currentTodayHouses = this.data.todayHouses
    let currentCollapseAllTodays = this.data.collapseAllTodays
    currentTodayHouses.forEach(h => {
      h.hide = !h.hide
    })
    this.setData({
      todayHouses : currentTodayHouses,
      collapseAllTodays : !currentCollapseAllTodays
    })
  },

  // hide / unhide今日数据
  changeTodaySectionState(e) {
    let selectedName = e.currentTarget.dataset.name

    let currentTodayHouses = this.data.todayHouses
    let selectedHouse = currentTodayHouses.find(house => house.name == selectedName)
    if (selectedHouse) {
      let indexOfSelectedHouseInfo = currentTodayHouses.indexOf(selectedHouse)
      let beforeChange = selectedHouse.hide
      
      selectedHouse.hide = !beforeChange
      currentTodayHouses[indexOfSelectedHouseInfo] = selectedHouse
      
      this.setData({
        todayHouses : currentTodayHouses
      })
    }
  },

  // hide / unhide近期数据
  changeRecentSectionState(e) {
    let selectedType = e.currentTarget.dataset.type

    let currentProject = this.data.project
    let currentLatestHouseInfo = this.data.project.latestHouseInfo
    let selectedHouseInfo = this.data.project.latestHouseInfo.find(info => info.type == selectedType)

    if (selectedHouseInfo) {
      let indexOfSelectedHouseInfo = currentLatestHouseInfo.indexOf(selectedHouseInfo)
      let beforeChange = selectedHouseInfo.hide

      selectedHouseInfo.hide = !beforeChange
      currentLatestHouseInfo[indexOfSelectedHouseInfo] = selectedHouseInfo
      currentProject.latestHouseInfo = currentLatestHouseInfo

      this.setData({
        project : currentProject
      })
    }
  },

  // hide / unhide日历
  changeCalendarState(e) {
    let beforeChange = this.data.calendarHidden
    this.setData({
      calendarHidden : !beforeChange
    })
  },

  // 在地图上查看某个小区
  seePointOnMap(e) {
    wx.navigateTo({
      url: `/pages/map/map?mode=single&id=${this.data.areaIdx}&pid=${this.data.pId}&aid=${this.data.areaId}&pname=${this.data.pName}`,
    })
  },

  // 预览某个照片
  preview(e) {
    log.info('预览某个照片')
    log.info(e)

    let item = e.target.dataset.item
    let idx = this.data.medias.indexOf(item)
    wx.previewMedia({
      sources : this.data.medias,
      current : idx,
      showmenu : false
    })
  },

  // 评论功能
  // Focus on评论的输入栏，需要拉高input的高度
  onFocusCommentInput(e) {
    log.info('点击了输入框')

    this.setData({
      commentInputHeight : e.detail.height
    })
  },

  // 输入结束即“blur”的时候触发，应该将input的高度还原成贴地板
  onBlurCommentInput(e) {
    log.info('完成了输入，输入框blur')

    this.setData({
      commentInputHeight : 0
    })
  },

  // 输入评论
  inputComment(e) {
    this.setData({
      myComments : e.detail.value.trim()
    })
  },

  // 拿到最新的评论列表
  loadCommentList(pid) {
    let self = this
    log.info(`读取${self.data.pName}(${pid})的评论列表`)
    // 使用pId拿到comments
    requests
      .getCommentsOf(pid)
      .then((list) => {
        let comments = []
        list.forEach(comment => {
          comments.push({
            'avatarUrl' : comment.avatarUrl,
            'nickname' : comment.nickName,
            'content' : comment.comment,
            'timestamp' : utils.getTimeDistanceOf(comment.update_gmt)
          })
        })
        self.setData({
          commentsList : comments
        })
      }).catch((err) => {
        log.error(`未成功拿到评论列表`)
        log.error(err)

        wx.showToast({
          title: '获取评论失败',
          icon: 'error'
        })
      })
  },

  // 上传评论
  submitComment(e) {
    log.info('点击上传评论')

    requests
      .getAvatarAndNickname()
      .then((res) => {
        if (res) {
          // 用户必须授权头像和用户名才能开始评论
          // 用户信息上传云函数成功
          log.info('云函数调用成功（both get and post），新用户同意提供头像和昵称')

          // 评论不能为空
          if (this.data.myComments.trim() != '') {
            log.info(`用户的评论为：${this.data.myComments}`)
            
            let self = this
            wx.showLoading({
              title: '提交中',
              mask:true
            })

            requests
              .sendCommentOnSomeProject(self.data.pId, self.data.myComments.trim())
              .then((res) => {
                if (res) {
                  // 评论发表成功！
                  log.info('成功发布评论')

                  wx.hideLoading()
                  wx.showToast({
                    title: '发布成功',
                    icon: 'success'
                  })
                  // 发表成功之后需要重新读取评论列表
                  self.loadCommentList(self.data.pId)
                } else {
                  // 失败
                  log.error('发布失败')

                  wx.hideLoading()
                  wx.showToast({
                    title: '发布失败',
                    icon: 'error'
                  })
                }
              })
              .catch((err) => {
                log.error('发布失败')
                log.error(err)

                wx.hideLoading()
                wx.showToast({
                  title: '发布失败',
                  icon: 'error'
                })
              })
          } else {
            log.warn('用户的评论为空')
            // 评论为空
            wx.showToast({
              title: '啥也没说呀',
              icon: 'error'
            })
          }
        } else {
          log.warn('云函数调用失败（both get and post）或新用户不同意提供头像和昵称')

          wx.showToast({
            title: '很遗憾',
            icon: 'error'
          })
        }
      })
      .catch((err) => {
        log.error(err)
        console.log(err)

        wx.showToast({
          title: '微信有bug',
          icon: 'error'
        })
      })
  },

  // navigate到文章
  gotoArticle(e) {
    log.info(`从小区详情页(${this.data.pId})跳转到article页：${this.data.articleUrl}`)

    wx.navigateTo({
      url: '/pages/article/article?url=' + this.data.articleUrl,
    })
  },

  // 转发
  onShareAppMessage: function(options) {
    return {
      title : 'PD公租房',
      path : '/pages/login/login',
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