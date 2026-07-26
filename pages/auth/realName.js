const market = require('../../utils/market')
Page({
  data: { StatusBar: 0, form: { real_name: '', id_card: '' }, certImage: '', authStatus: null, submitting: false },
  onLoad() { const s = wx.getSystemInfoSync(); this.setData({ StatusBar: s.statusBarHeight }); this.loadStatus() },
  loadStatus() { market.getAuthStatus().then((res) => { if (res && res.status === 0) this.setData({ authStatus: res.data }) }) },
  onInput(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  chooseImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'], success: (res) => {
      const path = res.tempFiles[0].tempFilePath
      wx.showLoading({ title: '上传中...' })
      market.uploadAuthImage(path).then((r) => {
        wx.hideLoading()
        if (r && r.status === 0 && r.data && r.data.url) this.setData({ certImage: r.data.url })
        else wx.showToast({ title: '上传失败', icon: 'none' })
      })
    }})
  },
  submit() {
    const f = this.data.form
    if (!f.real_name.trim()) { wx.showToast({ title: '请输入真实姓名', icon: 'none' }); return }
    if (!f.id_card.trim() || f.id_card.length < 15) { wx.showToast({ title: '请输入身份证号', icon: 'none' }); return }
    if (!this.data.certImage) { wx.showToast({ title: '请上传证件照', icon: 'none' }); return }
    this.setData({ submitting: true })
    market.submitRealName({ real_name: f.real_name, id_card: f.id_card, cert_image_url: this.data.certImage }).then((res) => {
      this.setData({ submitting: false })
      if (res && res.status === 0) { wx.showToast({ title: '提交成功', icon: 'success' }); this.loadStatus() }
      else wx.showToast({ title: '提交失败', icon: 'none' })
    })
  }
})
