// pages/community/community.js
const constants = require('../../utils/constants')
const utils = require('../../utils/util')
const requests = require('../../utils/request')
const model = require('../../utils/community')
const app = getApp()
const log = require('./../../utils/log')

import plugin from './../../components/calendar/plugins/index'
import todo from './../../components/calendar/plugins/todo'
import selectable from './../../components/calendar/plugins/selectable'
plugin.use(todo).use(selectable)


Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    // Tab
    curTab: 0,
    // 是不是VIP, 决定是否解锁一些数据
    isVip: false,
    // 小区基本信息
    pId: '',
    pName: '',
    // 坐标的url
    coordUrl: '',
    // 统计数据
    recentHouseInfo: [],
    heatMap : [],
    monthlyDaysColor: [],
    totalCount: 0,
    // 资料信息
    articleUrl: '',
    descriptions : [],
    medias : [],
    equipments: [],
    // 今日房源信息
    todayHouses: [],
    // 评论区
    myComments: '',
    commentInputHeight : 0, // 初始化的时候尚未on focus，所以贴地板
    commentsList: [],
    // 管理折叠的flags
    equipmentsHidden: false,
    descriptionsHidden: false,
    calendarHidden: false,
    collapseAllTodays: false,
    // 日历config
    calendarConfig : {
      multi : false,
      theme: 'elegant',
      markToday: '今天',
      highlightToday: false,
      preventSwipe: true,
      onlyShowCurrentMonth: true
    },
  },

  onLoad: function (options) {
    log.info(`onLoad community`)
    log.info(options)

    const pid = options.pid
    // 判断是否应该展示VIP内容
    const isVipShowCase = pid == constants.vipSampleProjectId
    const isVip = (app.globalData.userinfo.type === 2) || isVipShowCase

    const self = this
    
    // 开始loading + 处理数据
    wx.showLoading({ title: 'Loading...' })

    model.loadCommunityDetails(pid).then(res => {
      log.info('成功获得数据')

      // 所有从model层获得的数据
      const { pId, pName, areaIdx, areaId, 
        recentHouseInfo, totalCount, heatMap, descriptions, medias, equipments, todayHouses, comments, articleUrl } = res

      const coordUrl = self.mapCoordUrl(areaIdx, areaId, pId, pName)
      const monthlyDaysColor = self.daysColor(heatMap, new Date().getFullYear(), new Date().getMonth() + 1)

      const curTabIdx = todayHouses.length == 0 ? 0 : 1
      
      self.setData({
        curTab: curTabIdx,
        isVip: isVip,
        pId: pId,
        pName: pName,
        coordUrl: coordUrl,
        recentHouseInfo: recentHouseInfo,
        heatMap: heatMap,
        monthlyDaysColor: monthlyDaysColor,
        totalCount: totalCount,
        articleUrl: articleUrl,
        descriptions: descriptions,
        medias: medias,
        equipments: equipments,
        todayHouses: todayHouses,
        commentsList: comments
      })

      wx.hideLoading()
    }).catch(err => {
      log.error(`处理数据时遇到错误`)
      log.error(err)

      console.log(err)

      wx.showToast({
        title: '数据有误',
        icon: 'error'
      })

      wx.hideLoading()
    })
  },

  // 生成地图坐标链接
  mapCoordUrl(areaIdx, areaId, pid, pName) {
    return `/pages/map/map?mode=single&id=${areaIdx}&pid=${pid}&aid=${areaId}&pname=${pName}`
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

  // 日历相关方法
  // 拿到当前的calendar组件实例，对其进行配置。
  // wx的this.selectComponent接口有很多限制，首先要求在calendar上添加标签：calendar，且calendar在页面上不能根据wx:if显示，只能用hidden控制。
  renderCalendar() {
    if (this.selectComponent('#calendar')) {
      const calendar = this.selectComponent('#calendar').calendar
      const curYM = calendar.getCurrentYM()
      const month = curYM.month
      const year = curYM.year
      const payloadOfThisMonth = this.daysColor(this.data.heatMap, year, month)
      calendar.setTodos(payloadOfThisMonth)
    } else {
      console.log("this.selectComponent('#calendar') is undefined or null");
    }
  },

  // 日历切换了月份
  changeMonth(e) {
    this.renderCalendar()
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
    const selectedName = e.currentTarget.dataset.name

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

  // hide / unhide日历
  changeCalendarState(e) {
    let beforeChange = this.data.calendarHidden
    this.setData({
      calendarHidden : !beforeChange
    })
  },

  // hide / unhide近期数据
  changeRecentSectionState(e) {
    const selectedType = e.currentTarget.dataset.type

    let recentHouseInfo = this.data.recentHouseInfo
    let selectedHouseInfo = recentHouseInfo.find(info => info.type == selectedType)

    if (selectedHouseInfo) {
      const indexOfSelectedHouseInfo = recentHouseInfo.indexOf(selectedHouseInfo)
      const beforeChange = selectedHouseInfo.hide

      selectedHouseInfo.hide = !beforeChange
      recentHouseInfo[indexOfSelectedHouseInfo] = selectedHouseInfo

      this.setData({
        recentHouseInfo : recentHouseInfo
      })
    }
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
    const self = this
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
    // 用户必须授权头像和用户名才能开始评论
    const self = this
    requests
      .getAvatarAndNickname()
      .then((res) => {
        if (res) {
          // 用户信息上传云函数成功
          log.info('云函数调用成功（both get and post），新用户同意提供头像和昵称')

          // 评论不能为空
          if (self.data.myComments.trim() != '') {
            log.info(`用户的评论为：${self.data.myComments}`)
            
            wx.showLoading({ title: '提交中', mask: true })

            requests
              .sendCommentOnSomeProject(utils.generateArticleIdOf(self.data.pId), self.data.myComments.trim())
              .then(res => {
                if (res) {
                  // 评论发表成功！
                  log.info('成功发布评论')

                  wx.hideLoading()
                  wx.showToast({ title: '发布成功', icon: 'success' })

                  self.setData({
                    myComments: ''
                  })
                  // 发表成功之后需要重新读取评论列表
                  self.loadCommentList(utils.generateArticleIdOf(self.data.pId))
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

  // 打开地图
  seePointOnMap(e) {
    wx.navigateTo({
      url: this.data.coordUrl,
    })
  },

  showModal(e) {
    this.setData({
      modalName: e.currentTarget.dataset.target
    })
  },

  hideModal(e) {
    this.setData({
      modalName: null
    })
  },

  onShareAppMessage: function () {

  }
})