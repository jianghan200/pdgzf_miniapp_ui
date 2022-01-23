// pages/community/community.js
const constants = require('../../utils/constants')
const utils = require('../../utils/util')
const requests = require('../../utils/request')
const model = require('../../utils/community')
const app = getApp()
const log = require('./../../utils/log')
const commentsHelper = require('../../utils/comments')

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
    coordinate: null,
    marker: [],
    coordUrl: '',
    // 统计数据
    recentHouseInfo: [],
    heatMap : [],
    monthlyDaysColor: [],
    totalCount: 0,
    // 资料信息
    articleUrl: '',
    descriptions : [],
    images: [],
    videos: [],
    firstVideo: '暂无看房视频',
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
    // Scroll行为的控制器
    curComponentId: 0,
    // 多联button的控制器
    selectedHouseType: '',
    selectedHouse: null,
    // 视频列表drawer控制器
    showvideoListDrawer: false
  },

  onLoad: function (options) {
    log.info(`onLoad community`)
    log.info(options)

    this.init(options)
    this.initScrollerInfo()
  },
  
  // 调用数据接口，populate显示需要的数据
  init(options) {
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
      const { pId, pName, areaIdx, areaId, coordinate,
        recentHouseInfo, totalCount, heatMap, descriptions, medias, equipments, todayHouses, comments, articleUrl } = res
        
      const marker = self.createMarker(coordinate)

      const images = medias.filter(media => media.type == 'image')
      const videos = medias.filter(media => media.type == 'video')
      const firstVideo = (videos.length > 0) ? videos[0].url : '暂无看房视频'

      // 设置默认选中的户型
      const selectedHouse = recentHouseInfo[0]
      const selectedHouseType = selectedHouse.type

      const coordUrl = self.mapCoordUrl(areaIdx, areaId, pId, pName)
      const monthlyDaysColor = self.daysColor(heatMap, new Date().getFullYear(), new Date().getMonth() + 1)

      // 根据此小区是否出现在今日房源中判断应该展示哪部分内容
      const curTabIdx = todayHouses.length == 0 ? 0 : 1
      
      self.setData({
        curTab: curTabIdx,
        isVip: isVip,
        pId: pId,
        pName: pName,
        coordinate: coordinate,
        marker: marker,
        coordUrl: coordUrl,
        recentHouseInfo: recentHouseInfo,
        heatMap: heatMap,
        monthlyDaysColor: monthlyDaysColor,
        totalCount: totalCount,
        articleUrl: articleUrl,
        descriptions: descriptions,
        images: images,
        videos: videos,
        firstVideo: firstVideo,
        medias: medias,
        equipments: equipments,
        todayHouses: todayHouses,
        commentsList: comments,
        selectedHouse: selectedHouse,
        selectedHouseType: selectedHouseType
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

  // 初始化界面滑动相关的数据
  initScrollerInfo() {
    this.setData({
      curComponentId: 0
    })
  },

  // 点击TabItem触发的handler
  selectTab(e) {
    this.setData({
      curComponentId: e.currentTarget.dataset.id
    })
  },

  // 选择了某个户型的处理器
  selectHouseType(e) {
    const selectedHouseType = e.currentTarget.dataset.type
    const selectedHouse = this.data.recentHouseInfo.find(info => info.type == selectedHouseType)

    this.setData({
      selectedHouse: selectedHouse,
      selectedHouseType: selectedHouseType
    })
  },

  // 生成地图上的坐标点
  createMarker(coordinate) {
    let marker = []
    marker.push({
      id: 0, // marker 点击事件回调会返回此 id
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      title: this.data.pName
    })
    this.setData({
      marker: marker
    })
  },

  // 生成地图坐标链接
  mapCoordUrl(areaIdx, areaId, pid, pName) {
    return `/pages/map/map?mode=single&id=${areaIdx}&pid=${pid}&aid=${areaId}&pname=${pName}`
  },

  // 打开视频列表
  openVideoList(e) {
    this.setData({
      showvideoListDrawer: true
    })
  },

  // 关闭视频列表
  closeVideoList(e) {
    this.setData({
      showvideoListDrawer: false
    })
  },

  // navigate到文章
  gotoArticle(e) {
    log.info(`从小区详情页(${this.data.pId})跳转到article页：${this.data.articleUrl}`)

    // 文章内容为VIP专享
    if (this.data.isVip) {
      wx.navigateTo({
        url: '/pages/article/article?url=' + this.data.articleUrl,
      })
    } else {
      wx.showModal({
        title: 'VIP专享',
        content: '成为 VIP 查看此小区实地看房笔记。 VIP 示例小区可以参考浦江海德。',
        showCancel: 'false'
      })
    }
  },

  // 打开地图
  seePointOnMap(e) {
    wx.navigateTo({
      url: this.data.coordUrl,
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
    log.info(`读取${self.data.pName}(${pid})的评论列表`)
    // 使用pId拿到comments
    const self = this
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
        self.setData({ commentsList : comments })
      }).catch((err) => {
        log.error(`未成功拿到评论列表`)
        log.error(err)

        wx.showToast({
          title: '获取失败',
          icon: 'error'
        })
      })
  },

  // 上传评论
  submitComment() {
    log.info('点击上传评论')

    wx.showLoading()

    const self = this
    const aid = utils.generateArticleIdOf(self.data.pId)
    const userInput = self.data.myComments.trim()

    commentsHelper.submitComment(aid, userInput).then(() => {
      // 成功
      self.loadCommentList(aid)
      self.setData({ myComments: '' })
      wx.hideLoading()
    }).catch(err => {
      // 失败
      console.log(err)
      log.error(err)

      wx.showToast({ title: '评论失败', icon: 'error' })
      wx.hideLoading()
    })
  },

  // 分享该页面
  onShareAppMessage: function () {
    let self = this
    // 当前页面是community, 由于直接redirect到该community会导致某些渲染不正确, 因此只能先redirect到today页面, 再从today页面跳转到community, 这是因为界面耦合度高导致的
    var path = '/pages/today/today'
    var params = utils.getParams(self)
    path = path + '?' + params
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