const market = require('../../utils/market')

const app = getApp()

function normalize(it) {
  const b = it.brief || {}
  if (it.house_type === 1) {
    return {
      house_type: 1, id: it.house_id, typeLabel: '保租房',
      title: it.title,
      price: b.rent_low ? `¥${b.rent_low}-${b.rent_high || b.rent_low}/月` : '',
      meta: [b.district_name, b.house_type_summary].filter(Boolean).join(' · '),
      cover: b.cover_url,
      url: `/pages/shbzf/detail?id=${it.house_id}`
    }
  }
  return {
    house_type: 3, id: it.house_id, typeLabel: '市场房源',
    title: it.title,
    price: b.rent ? `¥${b.rent}/月` : '',
    meta: [b.district, b.town, b.area ? b.area + '㎡' : ''].filter(Boolean).join(' · '),
    cover: b.cover_url,
    url: `/pages/market/detail?id=${it.house_id}`
  }
}

Page({
  data: { list: [], loading: true },

  onShow() {
    const u = app.globalData.userinfo
    if (!(u && u.tokenStr)) {
      this.setData({ list: [], loading: false })
      wx.showModal({
        title: '请先登录',
        content: '登录后才能查看我的收藏',
        confirmText: '去登录',
        success: (r) => { if (r.confirm) wx.navigateTo({ url: '/pages/login/login' }) }
      })
      return
    }
    this.load()
  },

  load() {
    this.setData({ loading: true })
    market.getFavoriteList().then((res) => {
      const list = (res && res.status === 0 && res.data) ? res.data.map(normalize) : []
      this.setData({ list, loading: false })
    })
  },

  onTapItem(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.list[idx]
    if (item) wx.navigateTo({ url: item.url })
  },

  onRemove(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.list[idx]
    if (!item) return
    market.removeFavorite(item.house_type, item.id).then((res) => {
      if (res && res.status === 0) {
        wx.showToast({ title: '已取消收藏', icon: 'none' })
        this.load()
      } else if (res && res.msg) {
        wx.showToast({ title: res.msg, icon: 'none' })
      }
    })
  }
})
