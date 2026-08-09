const market = require('../../../utils/market')

// 上海地铁线路（静态数据，后续可后端下发）
const LINES = [
  { name: '1号线', color: '#e3002b', stations: ['富锦路','友谊西路','宝安公路','共富新村','呼兰路','通河新村','共康路','彭浦新村','汶水路','上海马戏城','延长路','中山北路','上海火车站','汉中路','新闸路','人民广场','黄陂南路','陕西南路','常熟路','衡山路','徐家汇','上海体育馆','漕宝路','上海南站','锦江乐园','莲花路','外环路','莘庄'] },
  { name: '2号线', color: '#8cc220', stations: ['徐泾东','虹桥火车站','虹桥2号航站楼','淞虹路','北新泾','威宁路','娄山关路','中山公园','江苏路','静安寺','南京西路','人民广场','南京东路','陆家嘴','东昌路','世纪大道','上海科技馆','世纪公园','龙阳路','张江高科','金科路','广兰路','唐镇','创新中路','华夏东路','川沙','凌空路','远东大道','海天三路','浦东国际机场'] },
  { name: '3号线', color: '#ffd100', stations: ['上海南站','石龙路','龙漕路','漕溪路','宜山路','虹桥路','延安西路','中山公园','金沙江路','曹杨路','镇坪路','中潭路','上海火车站','宝山路','东宝兴路','虹口足球场','赤峰路','大柏树','江湾镇','殷高西路','长江南路','淞发路','张华浜','淞滨路','水产路','宝杨路','友谊路','铁力路','江杨北路'] },
  { name: '4号线', color: '#461e84', stations: ['宜山路','上海体育馆','上海体育场','东安路','大木桥路','鲁班路','西藏南路','南浦大桥','塘桥','蓝村路','浦电路','世纪大道','浦东大道','杨树浦路','大连路','临平路','海伦路','宝山路','上海火车站','中潭路','镇坪路','曹杨路','金沙江路','中山公园','延安西路','虹桥路'] },
  { name: '7号线', color: '#ff6f00', stations: ['美兰湖','罗南新村','潘广路','刘行','顾村公园','祁华路','上海大学','南陈路','上大路','场中路','大场镇','行知路','大华三路','新村路','岚皋路','镇坪路','长寿路','昌平路','静安寺','常熟路','肇嘉浜路','东安路','龙华中路','后滩','长清路','耀华路','云台路','高科西路','杨高南路','锦绣路','芳华路','龙阳路','花木路'] },
  { name: '9号线', color: '#69c9f0', stations: ['松江南站','醉白池','松江体育中心','松江新城','松江大学城','洞泾','佘山','泗泾','九亭','中春路','七宝','星中路','合川路','漕河泾开发区','桂林路','宜山路','徐家汇','肇嘉浜路','嘉善路','打浦桥','马当路','陆家浜路','小南门','商城路','世纪大道','杨高中路','芳甸路','蓝天路','台儿庄路','金桥','金吉路','金海路','顾唐路','民雷路','曹路'] },
  { name: '10号线', color: '#c7a4d6', stations: ['虹桥火车站','虹桥2号航站楼','虹桥1号航站楼','上海动物园','龙溪路','水城路','伊犁路','宋园路','虹桥路','交通大学','上海图书馆','陕西南路','新天地','老西门','豫园','南京东路','天潼路','四川北路','海伦路','邮电新村','四平路','同济大学','国权路','五角场','江湾体育场','三门路','殷高东路','新江湾城','国帆路','双江路','高桥西','高桥','港城路'] },
  { name: '11号线', color: '#800000', stations: ['花桥','光明路','兆丰路','安亭','上海汽车城','昌吉东路','上海赛车场','嘉定北','嘉定西','白银路','嘉定新城','马陆','南翔','桃浦新村','武威路','祁连山路','李子园','上海西站','真如','枫桥路','曹杨路','隆德路','江苏路','交通大学','徐家汇','上海游泳馆','龙华','云锦路','龙耀路','东方体育中心','三林','三林东','浦三路','御桥','罗山路','秀沿路','康新公路','迪士尼'] },
  { name: '12号线', color: '#007a33', stations: ['七莘路','虹莘路','顾戴路','东兰路','虹梅路','虹漕路','桂林公园','漕宝路','龙漕路','龙华','龙华中路','大木桥路','嘉善路','陕西南路','南京西路','汉中路','曲阜路','天潼路','国际客运中心','提篮桥','大连路','江浦公园','宁国路','隆昌路','爱国路','复兴岛','东陆路','巨峰路','杨高北路','金京路','申江路','金海路'] },
  { name: '13号线', color: '#ef90a4', stations: ['金运路','金沙江西路','丰庄','祁连山南路','真北路','大渡河路','金沙江路','隆德路','武宁路','长寿路','江宁路','汉中路','自然博物馆','南京西路','淮海中路','新天地','马当路','世博会博物馆','世博大道','长清路','成山路','东明路','华鹏路','下南路','北蔡路','陈春路','莲溪路','华夏中路','中科路','学林路','张江路'] }
]

Page({
  data: {
    StatusBar: 0,
    lines: LINES,
    activeLine: '2号线',
    activeStations: [],
    selectedStations: [],
    distance: 1000,
    distanceOptions: [500, 800, 1000, 1500, 2000],
    distanceIndex: 2,
    list: [],
    page: 1,
    size: 20,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    const line = options.line || '2号线'
    const lineData = LINES.find(l => l.name === line) || LINES[1]
    this.setData({ activeLine: lineData.name, activeStations: lineData.stations })
    this.loadList(true)
  },

  switchLine(e) {
    const line = e.currentTarget.dataset.line
    const lineData = LINES.find(l => l.name === line) || LINES[1]
    this.setData({
      activeLine: line,
      activeStations: lineData.stations,
      selectedStations: []
    }, () => this.loadList(true))
  },

  toggleStation(e) {
    const station = e.currentTarget.dataset.station
    const arr = this.data.selectedStations.slice()
    const idx = arr.indexOf(station)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(station)
    this.setData({ selectedStations: arr }, () => this.loadList(true))
  },

  onDistanceChange(e) {
    const idx = e.detail.value
    this.setData({ distanceIndex: idx, distance: this.data.distanceOptions[idx] }, () => this.loadList(true))
  },

  loadList(reset, cb) {
    if (this.data.loading) return
    this.setData({ loading: true })
    if (reset) this.setData({ page: 1, list: [], hasMore: true })

    const params = {
      page: this.data.page,
      size: this.data.size,
      sort: 'time',
      subway_line: this.data.activeLine,
      subway_distance: this.data.distance
    }
    if (this.data.selectedStations.length > 0) {
      params.subway_station = this.data.selectedStations.join(',')
    }

    market.getMarketList(params).then((res) => {
      if (res && res.status === 0) {
        const l = res.data.list || []
        this.setData({
          list: reset ? l : this.data.list.concat(l),
          hasMore: l.length >= this.data.size,
          page: this.data.page + 1
        })
      }
      this.setData({ loading: false })
      if (cb) cb()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadList(false)
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/market/detail?id=' + id })
  },

  goBack() {
    wx.navigateBack()
  }
})
