// pages/community/community.js
const constants = require('../../utils/constants')
const utils = require('../../utils/util')
const model = require('../../utils/community')
const app = getApp()
const log = require('./../../utils/log')
const subscribeHelper = require('../../utils/subscripton')
const imageAndVideoCollectingDescriptionUrl = 'https://pdgzf.cn/%e8%a7%86%e9%a2%91%e3%80%81%e5%9b%be%e7%89%87%e3%80%81%e5%b0%8f%e5%8c%ba%e6%83%85%e6%8a%a5%e6%9c%89%e5%81%bf%e5%be%81%e9%9b%86%e6%a0%87%e5%87%86%e5%92%8c%e8%a7%84%e5%88%99/'
import plugin from './../../components/calendar/plugins/index'
import todo from './../../components/calendar/plugins/todo'
import selectable from './../../components/calendar/plugins/selectable'
plugin.use(todo).use(selectable)


Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    // 是不是VIP, 决定是否解锁一些数据
    isVip: false,
    // 小区基本信息
    areaId: '',
    pId: '',
    pName: '',
    // 订阅情况
    subscribed: false,
    ruleId: '',
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
    imageGroups: [],
    noImage: true,
    selectedImageGroup: null,
    selectedImageGroupId: '',
    noVideo: true,
    videos: [],
    firstVideo: '暂无看房视频',
    medias : [],
    equipments: [],
    // 今日房源信息
    todayHouses: [],
    // 今日房源视图模式: 'list' 或 'grid'
    todayViewMode: 'list',
    // 展开的列表项索引
    expandedMap: {},
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
    // 统计数据懒加载状态
    statsLoading: false,
    statsLoaded: false,
    // 供懒加载使用
    idsOfRecentHouses: [],
    projectForStats: null,
    todayHeatCount: 0,
    todayScrollTarget: '',
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
    const isVipShowCase = pid == constants.vipPid
    const isVip = (app.globalData.userinfo.type === 2) || isVipShowCase

    const self = this
    
    // 开始loading + 处理数据
    wx.showLoading({ title: 'Loading...' })

    model.loadCommunityDetails(pid).then(res => {
      log.info('成功获得数据')

      // 所有从model层获得的数据
      const { pId, pName, areaIdx, areaId, subscribed, ruleId, coordinate,
        basicHouseTypes, recentHouseInfo, totalCount, heatMap, descriptions, medias, equipments, todayHouses, articleUrl,
        idsOfRecentHouses, project, todayHeatCount } = res
        
      // 对今日房源进行排序
      const sortedTodayHouses = utils.sortByProperty(todayHouses, 'name', utils.strComparator)
        
      // 生成地图上的marker
      const marker = self.createMarker(coordinate)

      // 处理多媒体
      // url如果带着空格会导致在IOS端无法加载出来
      medias.forEach(media => {
        media.url = media.url.replaceAll(" ", "%20")
      })
      const images = medias.filter(media => media.type == 'image').map(image => self.classifyImage(image))
      const noImage = images.length == 0
      // 给图片分组
      const imageGroups = 
        utils.groupBy(images, (image) => {
          return image.group
        }).map(group => {
          if (group.length > 0) {
            return {
              'id': group[0].group,
              'images': group
            }
          } else {
            return {}
          }
        })
      const videos = medias.filter(media => media.type == 'video')
      const noVideo = videos.length == 0
      const firstVideo = (videos.length > 0) ? videos[0].url : '暂无看房视频'

      // 位置坐标
      const coordUrl = self.mapCoordUrl(areaIdx, areaId, pId, pName)
      const monthlyDaysColor = []

      // 根据此小区是否出现在今日房源中判断应该展示哪部分内容
      // 有今日房源默认跳到今日房源 Tab，否则默认小区详情
      const curTabIdx = todayHouses.length == 0 ? 0 : 1

      self.setData({
        curComponentId: curTabIdx,
        isVip: isVip,
        areaId: areaId,
        pId: pId,
        pName: pName,
        subscribed: subscribed,
        ruleId: ruleId,
        coordinate: coordinate,
        marker: marker,
        coordUrl: coordUrl,
        recentHouseInfo: recentHouseInfo,
        heatMap: heatMap,
        monthlyDaysColor: monthlyDaysColor,
        totalCount: totalCount,
        articleUrl: articleUrl,
        descriptions: descriptions,
        imageGroups: imageGroups,
        noImage: noImage,
        selectedImageGroup: imageGroups.length > 0 ? imageGroups[0] : null,
        selectedImageGroupId: imageGroups.length > 0 ? imageGroups[0].id : '',
        videos: videos,
        noVideo: noVideo,
        firstVideo: firstVideo,
        medias: medias,
        equipments: equipments,
        todayHouses: sortedTodayHouses,
        basicHouseTypes: basicHouseTypes,
        idsOfRecentHouses: idsOfRecentHouses,
        projectForStats: project,
        todayHeatCount: todayHeatCount
      })

      wx.hideLoading()
      if(options['forum'] == 1) {
        let aid = ''
        if(options['aid'] != undefined && options['aid'] != '') {
          aid = `&aid=${options['aid']}`
        }
        let discussionType = ''
        if(options['discussionType'] != undefined && options['discussionType'] != '') {
          discussionType = `&discussionType=${options['discussionType']}`
        } 
        wx.navigateTo({
          url: '/pages/forum/forum?pname=' + utils.sliceOf(this.data.pName) + '&type=3&pid=' + this.data.pId + aid + discussionType
        })
      }
    }).catch(err => {
      log.error(`处理数据时遇到错误`)
      log.error(err)
      console.log(err)

      wx.showToast({ title: '数据有误', icon: 'error' })
      wx.hideLoading()
    })
  },

  // 使用图片url中的信息为图片分类
  classifyImage(imageInfo) {
    const imageUrl = imageInfo.url
    const components = imageUrl.split('//')[1].split('/')
    // 将域名和小区名过滤掉
    components.shift()
    components.shift()
    // 解析出图片的名称
    const name = components.pop().split('.')[0]
    // 图片名称中是否带着VIP？
    const vipOnly = name.indexOf('vip') > -1
    // 默认所有图片都是'图片'类
    let group = '图片'
    if (components.length > 0) {
      group = components.pop()
    }
    imageInfo['name'] = name
    imageInfo['vipOnly'] = vipOnly
    imageInfo['group'] = group
    return imageInfo
  },

  // 引导用户成为VIP
  promptUsersToBecomeVip() {
    log.info('用户非VIP')

    wx.showModal({
      title: 'VIP专享内容',
      content: '成为VIP解锁更多服务',
      showCancel: true,
      confirmText: '看看权益',
      success: res => { if (res.confirm) { wx.redirectTo({ url: '/pages/rights/rights' }) } }
    })
  },

  // 初始化界面滑动相关的数据
  initScrollerInfo() {
    this.setData({ curComponentId: 0 })
  },

  // 返回上一页
  backToParent() {
    log.info('从community页返回上一页')
    
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    const prevPageRoute = prevPage.__route__
    if (prevPageRoute == 'pages/today/today' || prevPageRoute == 'pages/pudong/pudong') {
      log.info('从社区页返回today/pudong')

      prevPage.useTodayProjectsInStorage()
    } else if (prevPageRoute == 'pages/allProjects/allProjects') {
      log.info('从社区页返回allProjects')

      prevPage.preprocess()
    }
    
    wx.navigateBack({ delta: 1 })
  },

  // 点击TabItem触发的handler
  selectTab(e) {
    const tabId = parseInt(e.currentTarget.dataset.id)
    this.setData({ curComponentId: tabId })
    // 切到统计 Tab 时懒加载统计数据
    if (tabId === 2) {
      this.loadStats()
    }
  },

  // 懒加载统计数据（热力图 + 各户型轮候情况）
  loadStats() {
    if (this.data.statsLoaded || this.data.statsLoading) return
    // 非 VIP 不加载（反正看不到）
    if (!this.data.isVip) {
      this.setData({ statsLoaded: true })
      return
    }
    const { pId, projectForStats, idsOfRecentHouses, todayHeatCount } = this.data
    if (!projectForStats || !idsOfRecentHouses || idsOfRecentHouses.length === 0) {
      this.setData({ statsLoaded: true })
      return
    }
    this.setData({ statsLoading: true })
    const self = this
    model.loadStatsForCommunity(pId, projectForStats, idsOfRecentHouses, todayHeatCount).then(res => {
      const { recentHouseInfo, heatMap } = res
      const monthlyDaysColor = self.daysColor(heatMap, new Date().getFullYear(), new Date().getMonth() + 1)
      self.setData({
        recentHouseInfo: recentHouseInfo,
        heatMap: heatMap,
        monthlyDaysColor: monthlyDaysColor,
        statsLoading: false,
        statsLoaded: true
      }, () => {
        // 热力数据到了之后刷新日历标记
        if (self.data.isVip && !self.data.calendarHidden && self.selectComponent('#calendar')) {
          self.renderCalendar()
        }
      })
    }).catch(err => {
      log.error('统计数据懒加载失败')
      log.error(err)
      self.setData({ statsLoading: false, statsLoaded: true })
    })
  },

  // 选择了某个类别的图片
  onSelectImageGroup(e) {
    const selectedImageGroupId = e.currentTarget.dataset.group
    const selectedImageGroup = this.data.imageGroups.find(group => group.id == selectedImageGroupId)

    this.setData({ selectedImageGroup: selectedImageGroup, selectedImageGroupId: selectedImageGroupId })
  },

  // 生成地图上的坐标点
  createMarker(coordinate) {
    let marker = []
    marker.push({ id: 0, latitude: coordinate.lat, longitude: coordinate.lng, title: this.data.pName })
    this.setData({ marker: marker })
  },

  // 生成地图坐标链接
  mapCoordUrl(areaIdx, areaId, pid, pName) {
    return `/pages/map/map?mode=single&id=${areaIdx}&pid=${pid}&aid=${areaId}&pname=${pName}`
  },

  // 导航
  openMapNavigator(e) {
    log.info('点击导航')

    // 防止用户的微信版本过低
    const wxVersion = wx.getSystemInfoSync().SDKVersion
    if (utils.compareVersion(wxVersion, '2.14.0') < 0) {
      wx.showToast({ title: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。', icon: 'none' })
      return;
    }
    const mapCtx = wx.createMapContext('map', this);
    mapCtx.openMapApp({
      latitude: this.data.coordinate.lat,
      longitude: this.data.coordinate.lng,
      destination: this.data.pName,
      success: res => { console.log(res) },
      fail: err => { console.log(err) }
    })
  },

  // 跳转到有奖征集图片/视频的标准页
  goToRewardPage(e) {
    wx.navigateTo({
      url: '/pages/article/article?url=' + imageAndVideoCollectingDescriptionUrl + '?weixin_user_id=' + app.globalData.userinfo.unionId,
    })
  },

  // 跳转到vip页
  goToVipPage(e) {
    wx.navigateTo({ url: '/pages/rights/rights' })
  },

  // 跳转到VIP统计图表页
  goToVipStats(e) {
    wx.navigateTo({ url: '/pages/vipStats/vipStats?pId=' + this.data.pId + '&pName=' + this.data.pName })
  },

  // 预览某一个图片
  previewImg(e) {
    const self = this
    let gallery = self.data.selectedImageGroup.images
    if (!this.data.isVip) {
      gallery = self.data.selectedImageGroup.images.filter(image => !image.vipOnly)
    }
    app.globalData.previewInfo = {
      list: gallery.map(img => {
        return { picUrl: img.url, desc: img.name }
      }),
      current: e.currentTarget.dataset.idx
    }
    wx.navigateTo({ url: '../../pages/preview-media-desc/index' })
  },

  // 预览某一个视频
  previewVideo(e) {
    log.info('用户预览某一个视频')

    if (this.data.isVip) {
      // VIP
      const idx = e.currentTarget.dataset.idx
      if (idx) {
        // 是从视频列表中点击
        const video = this.data.videos[idx]
        this.setData({
          firstVideo: video,
          showvideoListDrawer: false
        }, () => {
          const self = this
          app.globalData.previewInfo = {
            list: self.data.videos.map(video => {
              const desc = video.url.split('//')[1].split('/').pop().split('.')[0]
              return { videoUrl: video.url, desc: ` ${desc}` }
            }),
            current: idx + 1
          }
          wx.navigateTo({ url: '../../pages/preview-media-desc/index' })
        })
      } else {
        const self = this
        app.globalData.previewInfo = {
          list: self.data.videos.map(video => {
            const desc = video.url.split('//')[1].split('/').pop().split('.')[0]
            return { videoUrl: video.url, desc: `${desc}` }
          }),
          current: self.data.videos.indexOf(self.data.firstVideo) + 1
        }
        wx.navigateTo({ url: '../../pages/preview-media-desc/index' })
      }
    } else {
      // 非VIP
      this.promptUsersToBecomeVip()
    }
  },

  // 打开视频列表
  openVideoList(e) {
    log.info('用户试图打开视频列表')

    if (this.data.isVip) {
      this.setData({ showvideoListDrawer: true })
    } else {
      this.promptUsersToBecomeVip()
    }
  },

  // navigate到文章
  gotoArticle(e) {
    log.info(`从小区详情页(${this.data.pId})跳转到article页：${this.data.articleUrl}`)

    if (this.data.isVip) {
      // 文章内容为VIP专享
      if (this.data.isVip) {
        wx.navigateTo({ url: '/pages/article/article?url=' + this.data.articleUrl })
      } else {
        wx.showModal({ title: 'VIP专享', content: '成为 VIP 查看此小区实地看房笔记。 VIP 示例小区可以参考浦江海德。', showCancel: 'false' })
      }
    } else {
      this.promptUsersToBecomeVip()
    }
  },

  // 打开地图
  seePointOnMap(e) {
    wx.navigateTo({ url: this.data.coordUrl })
  },

// 切换今日房源视图模式（列表/卡片）
  switchViewMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ todayViewMode: mode, expandedMap: {} })
  },

  // 展开/收起列表项卡片
  toggleExpand(e) {
    const idx = e.currentTarget.dataset.idx
    const key = 'expandedMap[' + idx + ']'
    this.setData({ [key]: !this.data.expandedMap[idx] })
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
          return { year: year, month: month, date: item.date, todoText: item.count + '人', color: item.hex }
        })
    }
  },

  // hide / unhide日历
  changeCalendarState(e) {
    const beforeChange = this.data.calendarHidden
    this.setData({ calendarHidden : !beforeChange })
  },

  // 订阅 / 取消订阅
  subscribe() {
    const subscribed = this.data.subscribed
    log.info(`用户点击了${ subscribed ? '取消' : '添加' }订阅`)

    const self = this
    // 之前是“已经订阅”
    if (subscribed) {
      // 要取消订阅
      subscribeHelper.unsubscribeThenSyncUp(self.data.ruleId, self.data.areaId, self.data.pId).then(res => {
        // 取消成功
        log.info('成功取消订阅')
        
        self.setData({ subscribed: false })
        wx.showToast({ title: '取消成功', icon: 'success' })
      }).catch(err => {
        console.log(err)
        log.error('取消订阅失败！')
        log.error(err)

        wx.showToast({ title: '取消失败', icon: 'error' })
      })
    } else {
      // 要添加订阅
      subscribeHelper.subscribeThenSyncUp(self.data.areaId, self.data.pId, self.data.pName).then(ruleId => {
        log.info(`成功添加订阅（id：${ruleId}）`)

        self.setData({ subscribed: true, ruleId: ruleId })
        wx.showToast({ title: '订阅成功', icon: 'success' })
      }).catch(err => {
        console.log(err)
        log.error('添加订阅失败！')
        log.error(err)

        wx.showToast({ title: '订阅失败', icon: 'error' })
      })
    }
  },

  // 进入社区论坛
  goToForum() {
    wx.switchTab({ url: '/pages/flarum/flarum' })
  },

  // 打开评论输入
  onTapComment() {
    const cs = this.selectComponent('#comment-section')
    if (cs) cs.openInput()
  },

  // 分享该页面
  onShareAppMessage: function () {
    let self = this
    // 当前页面是community, 由于直接redirect到该community会导致某些渲染不正确, 因此只能先redirect到today页面, 再从today页面跳转到community, 这是因为界面耦合度高导致的
    var path = '/pages/pudong/pudong'
    var params = utils.getParams(self)
    path = path + '?' + params
    return {
      title : utils.sliceOf(self.data.pName),
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