// 保租房地图：区 -> 街镇 -> 项目 平滑缩放切换
// scale <= 10: 区级聚合 + 行政区 polygon 边界
// 10 < scale <= 13: 街镇级聚合（按视野筛选）
// scale > 13: 全部项目 marker（按视野筛选，不限于单个街镇）
const market = require('../../utils/market')

const MAP_KEY = '2QUBZ-IJVWW-K6RRU-R7ANO-WSRSJ-PTBMG'
const SHANGHAI_ADCODE = '310000'
const SH_CENTER = { latitude: 31.23037, longitude: 121.4737 }

// 缩放阈值
const SCALE_DISTRICT_MAX = 10  // <=10 区级
const SCALE_PROJECT_MIN = 13   // >13 项目级，之间为街镇级

// marker id 命名空间
const DISTRICT_BASE = 0
const BIZCIRCLE_BASE = 100
const PROJECT_BASE = 10000

Page({
  data: {
    centerLatitude: SH_CENTER.latitude,
    centerLongitude: SH_CENTER.longitude,
    scale: 10,
    markers: [],
    polygons: [],
    currentLevel: 'district',
    levelDesc: '全市行政区',
    showList: false,
    listData: [],
    loading: true,
    showLabels: false
  },

  // 缓存数据
  _aggregate: null,
  _allProjects: [],
  _districtMarkers: [],
  _bizcircleMarkers: [],
  _projectMarkers: [],
  _districtPolygons: [],
  _mapCtx: null,
  _regionTimer: null,
  _lastProjectMarkerId: null,

  onLoad() {
    this._mapCtx = wx.createMapContext('map', this)
    wx.showLoading({ title: '加载地图数据...', mask: true })
    Promise.all([
      this._loadAggregate(),
      this._loadAllProjects()
    ]).then(() => {
      wx.hideLoading()
      this._buildAllMarkers()
      this._switchLevel('district')
      this.setData({ loading: false })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // === 数据加载 ===
  _loadAggregate() {
    return market.getShbzfMapAggregate().then((res) => {
      if (res && res.status === 0 && res.data) {
        this._aggregate = res.data
        // 检查 DB 是否已缓存 polygon
        const districts = res.data.districts || []
        const hasPolygons = districts.some(d => d.polygon && d.polygon.length > 0)
        if (hasPolygons) {
          this._districtPolygons = this._convertPolygons(districts)
        } else {
          // DB 未缓存，从腾讯 API 获取并入库
          return this._fetchAndCachePolygons()
        }
      }
    })
  },

  _loadAllProjects() {
    // 一次性加载全部项目（733 个），用于最细级别按视野显示
    return market.getShbzfList({ size: 1000 }).then((res) => {
      if (res && res.status === 0 && res.data) {
        this._allProjects = res.data.list || []
      }
    })
  },

  _fetchAndCachePolygons() {
    // DB 未缓存时，从腾讯地图 API 获取行政区 polygon 并入库
    return new Promise((resolve) => {
      wx.request({
        url: 'https://apis.map.qq.com/ws/district/v1/getchildren',
        data: {
          id: SHANGHAI_ADCODE,
          key: MAP_KEY,
          get_polygon: 1,
          output: 'json'
        },
        success: (res) => {
          if (res.data && res.data.status === 0 && res.data.result) {
            const tencentDistricts = res.data.result[0] || []
            this._districtPolygons = this._convertPolygons(tencentDistricts)
            // 异步入库缓存，不阻塞地图渲染
            const polygonsToSave = {}
            tencentDistricts.forEach(d => {
              if (d.polygon && d.id) polygonsToSave[d.id] = d.polygon
            })
            market.saveShbzfPolygons({ polygons: polygonsToSave }).catch(() => {})
          } else {
            console.warn('polygon API failed:', res.data)
          }
          resolve()
        },
        fail: (err) => {
          console.warn('polygon API error:', err)
          resolve()
        }
      })
    })
  },

  // 腾讯 polygon 格式 [[lng,lat,lng,lat,...], ...] -> 微信 map polygon 格式
  _convertPolygons(tencentDistricts) {
    const polygons = []
    tencentDistricts.forEach(d => {
      if (!d.polygon) return
      d.polygon.forEach(poly => {
        const points = []
        for (let i = 0; i < poly.length; i += 2) {
          points.push({ longitude: poly[i], latitude: poly[i + 1] })
        }
        if (points.length >= 3) {
          polygons.push({
            points,
            strokeColor: '#39b54a',
            fillColor: '#39b54a18',   // 半透明绿色填充
            strokeWidth: 2,
            zIndex: 1
          })
        }
      })
    })
    return polygons
  },

  // === 构建全部 markers（一次性，切换级别时只切换数组引用） ===
  _buildAllMarkers() {
    // 区级 markers
    const districts = (this._aggregate && this._aggregate.districts) || []
    this._districtMarkers = districts.filter(d => d.project_count > 0).map((d, idx) => ({
      id: DISTRICT_BASE + idx,
      latitude: d.latitude,
      longitude: d.longitude,
      iconPath: '/assets/green.png',
      width: 28,
      height: 28,
      callout: {
        display: 'ALWAYS',
        content: `${d.name} ${d.project_count}个`,
        color: '#fff',
        bgColor: '#39b54a',
        padding: 8,
        borderRadius: 6,
        fontSize: 12,
        borderWidth: 0
      },
      type: 'district',
      _data: d
    }))

    // 街镇 markers
    const bizcircles = (this._aggregate && this._aggregate.bizcircles) || []
    this._bizcircleMarkers = bizcircles.filter(b => b.project_count > 0).map((b, idx) => ({
      id: BIZCIRCLE_BASE + idx,
      latitude: b.latitude,
      longitude: b.longitude,
      iconPath: '/assets/green.png',
      width: 24,
      height: 24,
      callout: {
        display: 'ALWAYS',
        content: `${b.name} ${b.project_count}个`,
        color: '#fff',
        bgColor: '#2c7be5',
        padding: 6,
        borderRadius: 6,
        fontSize: 11,
        borderWidth: 0
      },
      type: 'bizcircle',
      _data: b
    }))

    // 全部项目 markers（最细级别按视野筛选显示）
    this._projectMarkers = this._allProjects
      .filter(p => (p.latitude || p.longitude_lat) && (p.longitude || p.longitude_lng))
      .map((p, idx) => {
        const rentDesc = (p.rent_low && p.rent_high)
          ? `¥${p.rent_low}-${p.rent_high}/月`
          : (p.rent_low ? `¥${p.rent_low}/月` : '租金待定')
        return {
          id: PROJECT_BASE + idx,
          latitude: p.latitude || p.longitude_lat,
          longitude: p.longitude || p.longitude_lng,
          iconPath: '/assets/red2.png',
          width: 22,
          height: 22,
          label: {
            content: p.name,
            color: '#333',
            fontSize: 11,
            borderRadius: 4,
            bgColor: '#ffffffcc',
            padding: 4,
            textAlign: 'center',
            anchorX: 14,
            anchorY: -8
          },
          customCallout: { anchorY: 10, anchorX: 0, display: 'BYCLICK' },
          type: 'project',
          projectId: p.id,
          pname: p.name,
          rentDesc,
          typeDesc: p.house_type_summary || '',
          address: p.address || ''
        }
      })
  },

  // === 级别切换（核心：平滑切换 markers + polygons） ===
  _switchLevel(level) {
    this._lastProjectMarkerId = null
    if (level === 'district') {
      this.setData({
        markers: this._districtMarkers,
        polygons: this._districtPolygons,
        currentLevel: 'district',
        levelDesc: '全市行政区',
        showList: false
      })
      return
    }
    // 街镇/项目级需要按视野筛选
    this._mapCtx.getRegion({
      success: (res) => {
        const source = level === 'bizcircle' ? this._bizcircleMarkers : this._projectMarkers
        let visible = this._filterByBounds(source, res.southwest, res.northeast)
        if (level === 'project' && !this.data.showLabels) {
          visible = visible.map(this._stripLabel)
        }
        this.setData({
          markers: visible,
          polygons: [],
          currentLevel: level,
          levelDesc: level === 'bizcircle' ? '街镇' : '项目',
          showList: false
        })
      }
    })
  },

  // 同级别拖拽后刷新视野内 markers
  _refreshVisibleMarkers() {
    this._mapCtx.getRegion({
      success: (res) => {
        const level = this.data.currentLevel
        const source = level === 'bizcircle' ? this._bizcircleMarkers : this._projectMarkers
        let visible = this._filterByBounds(source, res.southwest, res.northeast)
        if (level === 'project' && !this.data.showLabels) {
          visible = visible.map(this._stripLabel)
        }
        // 仅当数量变化超过阈值时才 setData，减少抖动
        if (Math.abs(visible.length - this.data.markers.length) > 1) {
          this.setData({ markers: visible })
        }
      }
    })
  },

  _stripLabel(m) {
    const { label, ...rest } = m
    return rest
  },

  toggleLabels() {
    const show = !this.data.showLabels
    this.setData({ showLabels: show })
    if (this.data.currentLevel === 'project') {
      this._mapCtx.getRegion({
        success: (res) => {
          let visible = this._filterByBounds(this._projectMarkers, res.southwest, res.northeast)
          if (!show) visible = visible.map(this._stripLabel)
          this.setData({ markers: visible })
        }
      })
    }
  },

  _filterByBounds(markers, sw, ne, padding) {
    const pad = padding !== undefined ? padding : 0.15
    return markers.filter(m =>
      m.latitude >= sw.latitude - pad &&
      m.latitude <= ne.latitude + pad &&
      m.longitude >= sw.longitude - pad &&
      m.longitude <= ne.longitude + pad
    )
  },

  // === 地图缩放/拖拽回调 ===
  onRegionChange(e) {
    if (e.type !== 'end') return
    if (this._regionTimer) clearTimeout(this._regionTimer)
    this._regionTimer = setTimeout(() => {
      this._mapCtx.getScale({
        success: (scaleRes) => {
          const scale = scaleRes.scale
          let target
          if (scale <= SCALE_DISTRICT_MAX) target = 'district'
          else if (scale <= SCALE_PROJECT_MIN) target = 'bizcircle'
          else target = 'project'

          if (target !== this.data.currentLevel) {
            this._switchLevel(target)
          } else if (target !== 'district') {
            this._refreshVisibleMarkers()
          }
        }
      })
    }, 350)
  },

  // === marker 点击 ===
  onMarkerTap(e) {
    const markerId = e.markerId || e.detail.markerId
    // 区 marker：缩放到街镇级
    if (markerId < BIZCIRCLE_BASE) {
      const m = this._districtMarkers[markerId - DISTRICT_BASE]
      if (m) {
        this._mapCtx.moveToLocation({ latitude: m.latitude, longitude: m.longitude })
        this.setData({ scale: 11, centerLatitude: m.latitude, centerLongitude: m.longitude })
        this._switchLevel('bizcircle')
      }
      return
    }
    // 街镇 marker：缩放到项目级
    if (markerId < PROJECT_BASE) {
      const m = this._bizcircleMarkers[markerId - BIZCIRCLE_BASE]
      if (m) {
        this._mapCtx.moveToLocation({ latitude: m.latitude, longitude: m.longitude })
        this.setData({ scale: 14, centerLatitude: m.latitude, centerLongitude: m.longitude })
        this._switchLevel('project')
      }
      return
    }
    // 项目 marker：首次点击显示 callout，再次点击进入详情
    if (markerId === this._lastProjectMarkerId) {
      this._lastProjectMarkerId = null
      const idx = markerId - PROJECT_BASE
      const m = this._projectMarkers[idx]
      if (m && m.projectId) {
        wx.navigateTo({ url: `/pages/shbzf/detail?id=${m.projectId}` })
      }
    } else {
      this._lastProjectMarkerId = markerId
    }
  },

  onProjectDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/shbzf/detail?id=${id}` })
  },

  // 重置到全市
  onReset() {
    this._mapCtx.moveToLocation({
      latitude: SH_CENTER.latitude,
      longitude: SH_CENTER.longitude
    })
    this.setData({ scale: 10, centerLatitude: SH_CENTER.latitude, centerLongitude: SH_CENTER.longitude })
    this._switchLevel('district')
  },

  // === 半屏列表 ===
  toggleList() {
    const show = !this.data.showList
    if (!show) { this.setData({ showList: false }); return }
    let listData = []
    if (this.data.currentLevel === 'district') {
      listData = ((this._aggregate && this._aggregate.districts) || [])
        .filter(d => d.project_count > 0)
        .map(d => ({ key: d.id, listType: 'district', dataId: d.id, name: d.name, desc: '行政区', countDesc: `${d.project_count}个项目` }))
    } else if (this.data.currentLevel === 'bizcircle') {
      listData = ((this._aggregate && this._aggregate.bizcircles) || [])
        .filter(b => b.project_count > 0)
        .map(b => ({ key: b.id, listType: 'bizcircle', dataId: b.id, name: b.name, desc: b.district_name || '', countDesc: `${b.project_count}个项目` }))
    } else {
      listData = this._allProjects.map(p => ({
        key: p.id, listType: 'project', dataId: p.id,
        name: p.name,
        desc: `${p.district_name || ''} ${p.address || ''}`.trim(),
        countDesc: (p.rent_low && p.rent_high) ? `¥${p.rent_low}-${p.rent_high}` : '租金待定'
      }))
    }
    this.setData({ showList: true, listData })
  },

  onListTap(e) {
    const type = e.currentTarget.dataset.type
    const id = e.currentTarget.dataset.id
    if (type === 'district') {
      const d = (this._aggregate.districts || []).find(x => x.id === id)
      if (d) {
        this._mapCtx.moveToLocation({ latitude: d.latitude, longitude: d.longitude })
        this.setData({ scale: 11, centerLatitude: d.latitude, centerLongitude: d.longitude })
        this._switchLevel('bizcircle')
        this.setData({ showList: false })
      }
    } else if (type === 'bizcircle') {
      const b = (this._aggregate.bizcircles || []).find(x => x.id === id)
      if (b) {
        this._mapCtx.moveToLocation({ latitude: b.latitude, longitude: b.longitude })
        this.setData({ scale: 14, centerLatitude: b.latitude, centerLongitude: b.longitude })
        this._switchLevel('project')
        this.setData({ showList: false })
      }
    } else if (type === 'project') {
      wx.navigateTo({ url: `/pages/shbzf/detail?id=${id}` })
    }
  }
})
