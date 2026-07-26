const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, certImage: '', leaseImage: '', authStatus: null, submitting: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }); this.loadStatus() },
  loadStatus() { market.getAuthStatus().then((res) => { if (res && res.status === 0) this.setData({ authStatus: res.data }) }) },
  chooseImage(e) {
    const field = e.currentTarget.dataset.field
    wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'], success: (res) => {
      const path = res.tempFiles[0].tempFilePath
      wx.showLoading({ title: '上传中...' })
      market.uploadAuthImage(path).then((r) => {
        wx.hideLoading()
        if (r && r.status === 0 && r.data && r.data.url) this.setData({ [field]: r.data.url })
        else wx.showToast({ title: '上传失败', icon: 'none' })
      })
    }})
  },
  submit() {
    if (!this.data.certImage) { wx.showToast({ title: '请上传房产证', icon: 'none' }); return }
    if (!this.data.leaseImage) { wx.showToast({ title: '请上传租赁合同', icon: 'none' }); return }
    this.setData({ submitting: true })
    market.submitLandlordAuth({ cert_image_url: this.data.certImage, lease_image_url: this.data.leaseImage }).then((res) => {
      this.setData({ submitting: false })
      if (res && res.status === 0) { wx.showToast({ title: '提交成功', icon: 'success' }); this.loadStatus() }
      else wx.showToast({ title: '提交失败', icon: 'none' })
    })
  }
})
