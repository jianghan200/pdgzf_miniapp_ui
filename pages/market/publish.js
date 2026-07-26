const market = require('../../utils/market')

Page({
  data: {
    StatusBar: 0,
    editId: 0,
    form: {
      title: '',
      district: '',
      town: '',
      address: '',
      house_type: '',
      bedrooms: 1,
      living_rooms: 1,
      bathrooms: 1,
      area: '',
      rent: '',
      payment_type: '押一付三',
      min_lease: 12,
      max_lease: 24,
      support_short_term: 0,
      only_long_term: 0,
      available_date: '',
      earliest_view_time: '随时可看',
      contact_name: '',
      contact_phone: '',
      parking_fee: '',
      property_fee: '',
      facilities: [],
      nearby_facilities: [],
      description: ''
    },
    districts: ['浦东新区', '徐汇区', '闵行区', '杨浦区', '长宁区', '黄浦区', '静安区', '普陀区', '虹口区', '宝山区', '嘉定区', '青浦区', '松江区', '奉贤区', '金山区', '崇明区'],
    districtIndex: 0,
    paymentTypes: ['押一付一', '押一付二', '押一付三', '押二付三', '面议'],
    paymentIndex: 2,
    facilityOptions: ['空调', '洗衣机', '冰箱', '热水器', '宽带', '天然气', '电视', '暖气', '智能家居', '电梯', '车位', '储物间'],
    nearbyOptions: ['地铁站', '公交站', '超市', '菜场', '医院', '学校', '公园', '商场', '餐厅', '银行'],
    mediaUrls: [],
    submitting: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })
    if (options.id) {
      this.setData({ editId: options.id })
      this.loadForEdit(options.id)
    }
  },

  loadForEdit(id) {
    market.getMarketDetail(id).then((res) => {
      if (res && res.status === 0) {
        const d = res.data
        try { d.facilities = JSON.parse(d.facilities || '[]') } catch(e) { d.facilities = [] }
        try { d.nearby_facilities = JSON.parse(d.nearby_facilities || '[]') } catch(e) { d.nearby_facilities = [] }
        const di = this.data.districts.indexOf(d.district)
        const pi = this.data.paymentTypes.indexOf(d.payment_type)
        this.setData({
          form: {
            title: d.title, district: d.district, town: d.town, address: d.address,
            house_type: d.house_type, bedrooms: d.bedrooms, living_rooms: d.living_rooms, bathrooms: d.bathrooms,
            area: String(d.area), rent: String(d.rent), payment_type: d.payment_type,
            min_lease: d.min_lease, max_lease: d.max_lease,
            support_short_term: d.support_short_term, only_long_term: d.only_long_term,
            available_date: d.available_date, earliest_view_time: d.earliest_view_time,
            contact_name: d.contact_name, contact_phone: d.contact_phone,
            parking_fee: d.parking_fee, property_fee: d.property_fee,
            facilities: d.facilities, nearby_facilities: d.nearby_facilities, description: d.description
          },
          districtIndex: di >= 0 ? di : 0,
          paymentIndex: pi >= 0 ? pi : 2,
          mediaUrls: d.media_urls || []
        })
      }
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onDistrictChange(e) {
    const idx = e.detail.value
    this.setData({ districtIndex: idx, 'form.district': this.data.districts[idx] })
  },

  onPaymentChange(e) {
    const idx = e.detail.value
    this.setData({ paymentIndex: idx, 'form.payment_type': this.data.paymentTypes[idx] })
  },

  onBedroomChange(e) { this.setData({ 'form.bedrooms': e.detail.value }) },
  onLivingChange(e) { this.setData({ 'form.living_rooms': e.detail.value }) },
  onBathChange(e) { this.setData({ 'form.bathrooms': e.detail.value }) },
  onMinLeaseChange(e) { this.setData({ 'form.min_lease': e.detail.value }) },
  onMaxLeaseChange(e) { this.setData({ 'form.max_lease': e.detail.value }) },

  onDateChange(e) { this.setData({ 'form.available_date': e.detail.value }) },

  toggleShortTerm() { this.setData({ 'form.support_short_term': this.data.form.support_short_term ? 0 : 1 }) },
  toggleLongTerm() { this.setData({ 'form.only_long_term': this.data.form.only_long_term ? 0 : 1 }) },

  toggleFacility(e) {
    const idx = e.currentTarget.dataset.idx
    const opt = this.data.facilityOptions[idx]
    let arr = this.data.form.facilities.slice()
    const pos = arr.indexOf(opt)
    if (pos >= 0) arr.splice(pos, 1)
    else arr.push(opt)
    this.setData({ 'form.facilities': arr })
  },

  toggleNearby(e) {
    const idx = e.currentTarget.dataset.idx
    const opt = this.data.nearbyOptions[idx]
    let arr = this.data.form.nearby_facilities.slice()
    const pos = arr.indexOf(opt)
    if (pos >= 0) arr.splice(pos, 1)
    else arr.push(opt)
    this.setData({ 'form.nearby_facilities': arr })
  },

  chooseImage() {
    const remaining = 9 - this.data.mediaUrls.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多9张', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const newUrls = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ mediaUrls: this.data.mediaUrls.concat(newUrls) })
      }
    })
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.idx
    let arr = this.data.mediaUrls.slice()
    arr.splice(idx, 1)
    this.setData({ mediaUrls: arr })
  },

  showDepositDialog(msg, onPaid) {
    wx.showModal({
      title: '需要支付保证金',
      content: msg + '\n\n保证金 100 元，可退，支付后即可继续发布房源',
      confirmText: '去支付',
      success: (res) => {
        if (res.confirm) {
          this.payDeposit(onPaid)
        }
      }
    })
  },

  payDeposit(onPaid) {
    wx.showLoading({ title: '正在支付...' })
    const market = require('../../utils/market')
    market.payDeposit(0).then((res) => {
      wx.hideLoading()
      if (res && res.status === 0 && res.data) {
        wx.requestPayment({
          ...res.data,
          success: () => {
            wx.showToast({ title: '支付成功', icon: 'success' })
            onPaid()
          },
          fail: (err) => {
            wx.showToast({ title: '支付取消或失败', icon: 'none' })
          }
        })
      } else {
        wx.showToast({ title: res && res.msg || '支付请求失败', icon: 'none' })
      }
    })
  },

  submit() {
    const f = this.data.form
    if (!f.title.trim()) { wx.showToast({ title: '请填写标题', icon: 'none' }); return }
    if (!f.district) { wx.showToast({ title: '请选择区域', icon: 'none' }); return }
    if (!f.area || !f.rent) { wx.showToast({ title: '请填写面积和租金', icon: 'none' }); return }
    if (!f.contact_name.trim() || !f.contact_phone.trim()) { wx.showToast({ title: '请填写联系人', icon: 'none' }); return }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    const payload = {
      title: f.title, district: f.district, town: f.town, address: f.address,
      house_type: f.house_type || `${f.bedrooms}室${f.living_rooms}厅${f.bathrooms}卫`,
      bedrooms: parseInt(f.bedrooms), living_rooms: parseInt(f.living_rooms), bathrooms: parseInt(f.bathrooms),
      area: parseFloat(f.area), rent: parseFloat(f.rent), payment_type: f.payment_type,
      min_lease: parseInt(f.min_lease), max_lease: parseInt(f.max_lease),
      support_short_term: f.support_short_term, only_long_term: f.only_long_term,
      available_date: f.available_date, earliest_view_time: f.earliest_view_time,
      contact_name: f.contact_name, contact_phone: f.contact_phone,
      parking_fee: f.parking_fee, property_fee: f.property_fee,
      facilities: JSON.stringify(f.facilities), nearby_facilities: JSON.stringify(f.nearby_facilities),
      description: f.description,
      media_urls: []
    }

    if (this.data.editId) {
      // 编辑已有房源 — 先上传图片，再更新
      this.uploadImages(this.data.editId, (uploadedUrls) => {
        payload.media_urls = uploadedUrls
        market.updateMarketHouse(this.data.editId, payload).then((res) => {
          wx.hideLoading()
          this.setData({ submitting: false })
          if (res && res.status === 0) {
            wx.redirectTo({ url: '/pages/market/publishSuccess' })
          } else {
            wx.showToast({ title: res && res.msg || '提交失败', icon: 'none' })
          }
        })
      })
    } else {
      // 新建房源 — 先创建拿到 house_id，再上传图片
      market.publishMarketHouse(payload).then((res) => {
        if (res && res.status === 0) {
          const houseId = res.data.house_id
          this.uploadImages(houseId, (uploadedUrls) => {
            if (uploadedUrls.length > 0) {
              market.updateMarketHouse(houseId, { media_urls: uploadedUrls }).then((upRes) => {
                wx.hideLoading()
                this.setData({ submitting: false })
                if (upRes && upRes.status === 0) {
                  wx.redirectTo({ url: '/pages/market/publishSuccess' })
                } else {
                  wx.showToast({ title: '图片上传失败', icon: 'none' })
                }
              })
            } else {
              wx.hideLoading()
              this.setData({ submitting: false })
              wx.redirectTo({ url: '/pages/market/publishSuccess' })
            }
          })
        } else if (res && res.need_deposit) {
          this.showDepositDialog(res.msg, () => this.submit())
        } else {
          wx.hideLoading()
          this.setData({ submitting: false })
          wx.showToast({ title: res && res.msg || '提交失败', icon: 'none' })
        }
      })
    }
  },

  uploadImages(idx, callback) {
    const urls = this.data.mediaUrls
    // 过滤出需要上传的本地临时文件（wxfile:// /tmp/ http://tmp 开头的都是微信临时路径）
    const toUpload = urls.filter(u => u.startsWith('wxfile://') || u.startsWith('/tmp') || u.startsWith('http://tmp'))
    if (toUpload.length === 0) {
      callback(urls)
      return
    }
    let uploaded = urls.filter(u => !u.startsWith('wxfile://') && !u.startsWith('/tmp') && !u.startsWith('http://tmp'))
    let pending = toUpload.length
    toUpload.forEach((path) => {
      market.uploadMarketMedia(path, idx || this.data.editId || 0).then((res) => {
        if (res && res.status === 0 && res.data && res.data.url) {
          uploaded.push(res.data.url)
        }
        pending--
        if (pending === 0) callback(uploaded)
      })
    })
  }
})
