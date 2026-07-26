const market = require('../../utils/market')

// 设施英文 -> 中文映射（实际数据为 camelCase）
const FACILITY_MAP = {
  'airConditioner': '空调',
  'washingMachine': '洗衣机',
  'refrigerator': '冰箱',
  'heater': '热水器',
  'broadband': '宽带',
  'naturalGas': '天然气',
  'television': '电视',
  'tv': '电视',
  'heating': '暖气',
  'elevator': '电梯',
  'security': '门禁',
  'undergroundParking': '地下车库',
  'chargingPile': '充电桩',
  'smartHome': '智能家居',
  'gym': '健身房',
  'swimmingPool': '游泳池',
  'childrensPlayground': '儿童乐园',
  'garden': '花园',
  'expressCabinet': '快递柜',
  'bicycleParking': '非机动车停放',
  'barrierFree': '无障碍设施',
  'centralAirConditioning': '中央空调',
  'wardrobe': '衣柜',
  'bed': '床',
  'sofa': '沙发',
  'table': '书桌',
  'desk': '书桌',
  'smartLock': '智能门锁',
  'clothesDryer': '烘干机',
  'rangeHood': '油烟机',
  'microwave': '微波炉',
  'electricKettle': '电热水壶',
  'toilet': '马桶',
  'shower': '淋浴',
  'bathroomCabinet': '浴室柜',
  'intercom': '对讲系统',
  'fireAlarm': '火灾报警',
  'cctv': '监控',
  'laundryRoom': '洗衣房',
  'lounge': '休息区',
  'meetingRoom': '会议室',
  'coworking': '共享办公',
  'cafe': '咖啡厅',
  'convenienceStore': '便利店',
  'parking': '停车场',
  'motorcycleParking': '摩托车停放',
}

const _translateFacility = (f) => FACILITY_MAP[f] || f

Page({
  data: { StatusBar: 0, id: 0, detail: null, mediaList: [], loading: true },
  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight, id: options.id })
    this.loadDetail()
  },
  loadDetail() {
    this.setData({ loading: true })
    Promise.all([market.getShbzfDetail(this.data.id), market.getShbzfMedia(this.data.id)]).then(([dRes, mRes]) => {
      if (dRes && dRes.status === 0) {
        let detail = dRes.data
        try { detail.facilities_arr = (JSON.parse(detail.facilities || '[]')).map(_translateFacility) } catch(e) { detail.facilities_arr = [] }
        try { detail.room_types_arr = JSON.parse(detail.room_types || '[]') } catch(e) { detail.room_types_arr = [] }
        this.setData({ detail })
      }
      if (mRes.status === 0) {
        const mediaList = (mRes.data || []).map(m => m.url || m.local_path).filter(Boolean)
        this.setData({ mediaList })
      }
      this.setData({ loading: false })
    })
  },
  previewMedia(e) {
    wx.previewImage({ current: this.data.mediaList[e.currentTarget.dataset.idx], urls: this.data.mediaList })
  }
})
