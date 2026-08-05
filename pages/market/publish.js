const market = require('../../utils/market')

const DEFAULT_FORM = {
  source_type: '',
  rent_type: 'whole',
  room_type: '',
  gender_limit: 'any',
  orientation: 'unknown',
  facility_level: 'full',
  title: '',
  address_name: '',
  district: '',
  town: '',
  address: '',
  bedrooms: 1,
  living_rooms: 1,
  bathrooms: 1,
  bathroom_type: 'shared',
  total_area: '',
  bedroom_area: '',
  area: '',
  floor: '',
  total_floor: '',
  rent: '',
  deposit_months: 1,
  payment_months: 1,
  is_negotiable: false,
  payment_type: '押一付一',
  min_lease: 12,
  max_lease: 24,
  support_short_term: 0,
  only_long_term: 0,
  available_date: '',
  earliest_view_time: '随时可看',
  contact_name: '',
  contact_phone: '',
  contact_wechat: '',
  contact_qq: '',
  avatar_url: '',
  parking_fee: '',
  property_fee: '',
  facilities: [],
  nearby_facilities: [],
  description: '',
  roommate_info: ''
}

Page({
  data: {
    StatusBar: 0,
    editId: 0,
    form: { ...DEFAULT_FORM },
    customBedroom: false,
    customLiving: false,
    customBathroom: false,
    customDeposit: false,
    customPayment: false,
    extraTags: [],

    identityOptions: [
      { value: 'owner', title: '我是业主，出租自己的房子' },
      { value: 'roommate', title: '我是室友，找人和我一起合租' },
      { value: 'sublet', title: '我要搬走，转租现在的房子' }
    ],
    rentTypeOptions: [
      { value: 'whole', label: '整租' },
      { value: 'share', label: '合租' },
      { value: 'bed', label: '床位' }
    ],
    bedroomOptions: [
      { value: 1, label: '一室' },
      { value: 2, label: '二室' },
      { value: 3, label: '三室' }
    ],
    livingRoomOptions: [
      { value: 0, label: '无' },
      { value: 1, label: '一厅' },
      { value: 2, label: '二厅' },
      { value: 3, label: '三厅' }
    ],
    bathroomOptions: [
      { value: 1, label: '一卫' },
      { value: 2, label: '二卫' }
    ],
    roomTypeOptions: [
      { value: 'master', label: '主卧' },
      { value: 'secondary', label: '次卧' },
      { value: 'partition', label: '隔断' }
    ],
    orientationOptions: [
      { value: 'east', label: '东' },
      { value: 'south', label: '南' },
      { value: 'west', label: '西' },
      { value: 'north', label: '北' },
      { value: 'unknown', label: '不知道' }
    ],
    facilityLevelOptions: [
      { value: 'full', label: '齐全' },
      { value: 'partial', label: '部分缺失' },
      { value: 'empty', label: '空房' },
      { value: 'rough', label: '毛坯' }
    ],
    genderOptions: [
      { value: 'any', label: '不限' },
      { value: 'male', label: '限男生' },
      { value: 'female', label: '限女生' }
    ],
    extraTagOptions: [
      { value: 'short_term', label: '可短租' },
      { value: 'loft', label: 'Loft' },
      { value: 'big_open', label: '大开间' },
      { value: 'self_build', label: '自建房' },
      { value: 'brand_apt', label: '品牌公寓' },
      { value: 'anytime_view', label: '随时看房' },
      { value: 'residence', label: '可办居住证' },
      { value: 'pet_friendly', label: '宠物友好' }
    ],
    depositOptions: [
      { value: 1, label: '押一' },
      { value: 2, label: '押二' },
      { value: 3, label: '押三' }
    ],
    paymentMonthOptions: [
      { value: 1, label: '付一' },
      { value: 2, label: '付二' },
      { value: 3, label: '付三' },
      { value: 6, label: '半年付' },
      { value: 12, label: '年付' }
    ],
    districts: ['浦东新区', '徐汇区', '闵行区', '杨浦区', '长宁区', '黄浦区', '静安区', '普陀区', '虹口区', '宝山区', '嘉定区', '青浦区', '松江区', '奉贤区', '金山区', '崇明区'],
    districtIndex: 0,
    facilityOptions: ['空调', '洗衣机', '冰箱', '热水器', '宽带', '天然气', '电视', '暖气', '智能家居', '电梯', '车位', '储物间'],
    nearbyOptions: ['地铁站', '公交站', '超市', '菜场', '医院', '学校', '公园', '商场', '餐厅', '银行'],
    mediaUrls: [],
    submitting: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ StatusBar: sys.statusBarHeight })

    // 尝试预填充微信资料
    this.fillWechatInfo(false)

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
        try { d.extra_tags = JSON.parse(d.extra_tags || '[]') } catch(e) { d.extra_tags = [] }
        const di = this.data.districts.indexOf(d.district)

        // 解析出租类型
        let rentType = d.rent_type || 'whole'
        if (!['whole', 'share', 'bed'].includes(rentType)) {
          rentType = (d.house_type || '').includes('合租') ? 'share' : 'whole'
        }

        // 解析 payment_type 到押金/付款/面议
        let depositMonths = 1, paymentMonths = 1, isNegotiable = false
        const pt = d.payment_type || ''
        if (pt === '面议') {
          isNegotiable = true
        } else {
          const m = pt.match(/押(\d+)付(\d+)/)
          if (m) {
            depositMonths = parseInt(m[1]) || 1
            paymentMonths = parseInt(m[2]) || 1
          } else {
            isNegotiable = true
          }
        }

        // 解析 extraTags
        const extraTags = d.extra_tags.slice()
        if (d.support_short_term) extraTags.push('short_term')
        if (d.only_long_term) extraTags.push('only_long_term')
        if ((d.earliest_view_time || '').includes('随时')) extraTags.push('anytime_view')

        this.setData({
          form: {
            ...DEFAULT_FORM,
            source_type: d.source_type || '',
            rent_type: rentType,
            room_type: d.room_type || '',
            gender_limit: d.gender_limit || 'any',
            orientation: d.orientation || 'unknown',
            facility_level: d.facility_level || 'full',
            title: d.title || '',
            address_name: d.address_name || d.title || '',
            district: d.district,
            town: d.town || '',
            address: d.address || '',
            bedrooms: d.bedrooms || 1,
            living_rooms: d.living_rooms || 1,
            bathrooms: d.bathrooms || 1,
            bathroom_type: d.bathroom_type || 'shared',
            total_area: d.total_area ? String(d.total_area) : (d.area ? String(d.area) : ''),
            bedroom_area: d.bedroom_area ? String(d.bedroom_area) : '',
            area: d.area ? String(d.area) : '',
            floor: d.floor ? String(d.floor) : '',
            total_floor: d.total_floor ? String(d.total_floor) : '',
            rent: String(d.rent),
            deposit_months: depositMonths,
            payment_months: paymentMonths,
            is_negotiable: isNegotiable,
            payment_type: d.payment_type || '',
            min_lease: d.min_lease || 12,
            max_lease: d.max_lease || 24,
            support_short_term: d.support_short_term || 0,
            only_long_term: d.only_long_term || 0,
            available_date: d.available_date || '',
            earliest_view_time: d.earliest_view_time || '随时可看',
            contact_name: d.contact_name || '',
            contact_phone: d.contact_phone || '',
            contact_wechat: d.contact_wechat || '',
            contact_qq: d.contact_qq || '',
            avatar_url: d.avatar_url || '',
            parking_fee: d.parking_fee || '',
            property_fee: d.property_fee || '',
            facilities: d.facilities,
            nearby_facilities: d.nearby_facilities,
            description: d.description || '',
            roommate_info: d.roommate_info || ''
          },
          districtIndex: di >= 0 ? di : 0,
          mediaUrls: (d.medias || []).map(m => m.url),
          extraTags: extraTags,
          customBedroom: !this.data.bedroomOptions.some(i => i.value === d.bedrooms),
          customLiving: !this.data.livingRoomOptions.some(i => i.value === d.living_rooms),
          customBathroom: !this.data.bathroomOptions.some(i => i.value === d.bathrooms),
          customDeposit: ![1,2,3].includes(depositMonths),
          customPayment: ![1,2,3,6,12].includes(paymentMonths)
        })
      }
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onNumberInput(e) {
    const field = e.currentTarget.dataset.field
    // 保留原始输入字符串，避免清空时被 parseInt||0 重置为 0
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // 身份选择
  onSourceTypeChange(e) {
    const val = e.currentTarget.dataset.value
    this.setData({ 'form.source_type': val })
  },

  // 出租类型
  onRentTypeChange(e) {
    const val = e.currentTarget.dataset.value
    const update = { 'form.rent_type': val }
    if (val === 'whole') {
      update['form.room_type'] = ''
      update['form.gender_limit'] = 'any'
      update['form.bathrooms'] = 1
    } else {
      update['form.bathroom_type'] = 'shared'
    }
    this.setData(update)
  },

  // 卧室
  onBedroomChange(e) {
    const val = parseInt(e.currentTarget.dataset.value)
    this.setData({ 'form.bedrooms': val, customBedroom: false })
  },
  showCustomBedroom() { this.setData({ customBedroom: true, 'form.bedrooms': '' }) },

  // 客厅
  onLivingChange(e) {
    const val = parseInt(e.currentTarget.dataset.value)
    this.setData({ 'form.living_rooms': val, customLiving: false })
  },
  showCustomLiving() { this.setData({ customLiving: true, 'form.living_rooms': '' }) },

  // 卫生间（整租）
  onBathroomChange(e) {
    const val = parseInt(e.currentTarget.dataset.value)
    this.setData({ 'form.bathrooms': val, customBathroom: false })
  },
  showCustomBathroom() { this.setData({ customBathroom: true, 'form.bathrooms': '' }) },

  // 卫生间类型（合租/床位）
  onBathroomTypeChange(e) {
    this.setData({ 'form.bathroom_type': e.currentTarget.dataset.value })
  },

  // 房间类型
  onRoomTypeChange(e) {
    this.setData({ 'form.room_type': e.currentTarget.dataset.value })
  },

  // 朝向
  onOrientationChange(e) {
    this.setData({ 'form.orientation': e.currentTarget.dataset.value })
  },

  // 设施等级
  onFacilityLevelChange(e) {
    this.setData({ 'form.facility_level': e.currentTarget.dataset.value })
  },

  // 性别
  onGenderChange(e) {
    this.setData({ 'form.gender_limit': e.currentTarget.dataset.value })
  },

  onDistrictChange(e) {
    const idx = e.detail.value
    this.setData({ districtIndex: idx, 'form.district': this.data.districts[idx] })
  },

  // 押金
  onDepositChange(e) {
    const val = parseInt(e.currentTarget.dataset.value)
    this.setData({ 'form.deposit_months': val, customDeposit: false })
  },
  showCustomDeposit() { this.setData({ customDeposit: true, 'form.deposit_months': '' }) },

  // 付款方式
  onPaymentMonthChange(e) {
    const val = parseInt(e.currentTarget.dataset.value)
    this.setData({ 'form.payment_months': val, customPayment: false, 'form.is_negotiable': false })
  },
  showCustomPayment() { this.setData({ customPayment: true, 'form.is_negotiable': false, 'form.payment_months': '' }) },
  toggleNegotiable() {
    this.setData({ 'form.is_negotiable': !this.data.form.is_negotiable, customPayment: false })
  },

  onDateChange(e) { this.setData({ 'form.available_date': e.detail.value }) },

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

  toggleExtraTag(e) {
    const val = e.currentTarget.dataset.value
    let arr = this.data.extraTags.slice()
    const pos = arr.indexOf(val)
    if (pos >= 0) arr.splice(pos, 1)
    else arr.push(val)
    this.setData({ extraTags: arr })
  },

  // 获取微信资料：优先展示已有数据，不主动弹授权；无数据时由用户点击头像/输入昵称获取
  fillWechatInfo(needToast = true) {
    const update = {}
    // 1. 优先取服务器已存的微信头像昵称
    const gi = (getApp().globalData && getApp().globalData.userinfo) || {}
    if (gi.wxNickName) update['form.contact_name'] = gi.wxNickName
    else if (gi.nickName) update['form.contact_name'] = gi.nickName
    if (gi.wxAvatarUrl) update['form.avatar_url'] = gi.wxAvatarUrl
    else if (gi.avatarUrl) update['form.avatar_url'] = gi.avatarUrl
    // 2. 兜底本地缓存
    if (!Object.keys(update).length) {
      const cached = wx.getStorageSync('userInfo') || {}
      if (cached.nickName) update['form.contact_name'] = cached.nickName
      if (cached.avatarUrl) update['form.avatar_url'] = cached.avatarUrl
    }
    if (Object.keys(update).length) this.setData(update)
  },

  // 选择头像（官方 chooseAvatar 接口）
  onChooseAvatar(e) {
    const url = e.detail.avatarUrl
    if (!url) return
    this.setData({ 'form.avatar_url': url })
    const cached = wx.getStorageSync('userInfo') || {}
    cached.avatarUrl = url
    wx.setStorageSync('userInfo', cached)
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

  // 组装 payment_type
  buildPaymentType() {
    const f = this.data.form
    if (f.is_negotiable) return '面议'
    const depositText = f.deposit_months > 0 ? `押${f.deposit_months}` : ''
    const paymentText = f.payment_months > 0 ? `付${f.payment_months}` : ''
    if (depositText && paymentText) return `${depositText}${paymentText}`
    return depositText || paymentText || '面议'
  },

  // 校验
  validate() {
    const f = this.data.form
    if (!f.source_type) return '请选择发布者身份'
    if (this.data.mediaUrls.length === 0) return '请至少上传 1 张房源照片'
    if (!f.rent_type) return '请选择出租类型'
    if (!f.address_name.trim()) return '请填写小区名称或地址'
    if (!f.district) return '请选择区域'
    if (!f.bedrooms) return '请选择卧室数'
    if (f.rent_type === 'whole' && !f.bathrooms) return '请选择卫生间数量'
    if ((f.rent_type === 'share' || f.rent_type === 'bed') && !f.bathroom_type) return '请选择卫生间类型'
    if ((f.rent_type === 'share' || f.rent_type === 'bed') && !f.room_type) return '请选择房间类型'
    if ((f.rent_type === 'share' || f.rent_type === 'bed') && !f.gender_limit) return '请选择性别限制'
    if (!f.total_area) return '请填写总面积'
    if (f.rent_type === 'share' && !f.bedroom_area) return '请填写待租卧室面积'
    if (!f.rent) return '请填写月租金'
    if (!f.is_negotiable && !f.deposit_months && !f.payment_months) return '请选择押金和付款方式'
    if (!f.available_date) return '请选择可入住时间'
    if (!f.contact_phone.trim()) return '请填写联系电话'
    return ''
  },

  submit() {
    const err = this.validate()
    if (err) {
      wx.showToast({ title: err, icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    const f = this.data.form
    const extraTags = this.data.extraTags
    const paymentType = this.buildPaymentType()

    // 自动组装标题：区域+小区+户型
    const houseTypeText = `${f.bedrooms}室${f.living_rooms || 0}厅${f.bathrooms || 1}卫`
    const title = f.title || `${f.district}${f.address_name} ${houseTypeText}`

    // 头像若为本地临时路径，先上传换取公网 URL
    this.uploadAvatar(f.avatar_url).then((avatarUrl) => {
      const payload = {
      source_type: f.source_type,
      rent_type: f.rent_type,
      room_type: f.room_type,
      gender_limit: f.gender_limit,
      orientation: f.orientation,
      facility_level: f.facility_level,
      title: title,
      address_name: f.address_name,
      district: f.district,
      town: f.town,
      address: f.address,
      house_type: houseTypeText,
      bedrooms: parseInt(f.bedrooms),
      living_rooms: parseInt(f.living_rooms || 0),
      bathrooms: parseInt(f.bathrooms || 1),
      bathroom_type: f.bathroom_type,
      orientation: f.orientation,
      facility_level: f.facility_level,
      total_area: parseFloat(f.total_area) || 0,
      bedroom_area: parseFloat(f.bedroom_area) || 0,
      area: parseFloat(f.bedroom_area || f.total_area) || 0,
      floor: parseInt(f.floor) || 0,
      total_floor: parseInt(f.total_floor) || 0,
      rent: parseFloat(f.rent),
      payment_type: paymentType,
      min_lease: extraTags.includes('short_term') ? 1 : f.min_lease,
      max_lease: f.max_lease,
      support_short_term: extraTags.includes('short_term') ? 1 : 0,
      only_long_term: extraTags.includes('only_long_term') ? 1 : 0,
      available_date: f.available_date,
      earliest_view_time: extraTags.includes('anytime_view') ? '随时可看' : (f.earliest_view_time || ''),
      contact_name: f.contact_name,
      contact_phone: f.contact_phone,
      contact_wechat: f.contact_wechat,
      contact_qq: f.contact_qq,
      avatar_url: avatarUrl,
      parking_fee: f.parking_fee,
      property_fee: f.property_fee,
      facilities: JSON.stringify(f.facilities),
      nearby_facilities: JSON.stringify(f.nearby_facilities),
      description: f.description,
      roommate_info: f.roommate_info,
      extra_tags: JSON.stringify(extraTags.filter(t => !['short_term', 'only_long_term', 'anytime_view'].includes(t))),
      media_urls: []
    }

    if (this.data.editId) {
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
          this.setData({ submitting: false })
          wx.hideLoading()
          this.showDepositDialog(res.msg, () => this.submit())
        } else {
          wx.hideLoading()
          this.setData({ submitting: false })
          wx.showToast({ title: res && res.msg || '提交失败', icon: 'none' })
        }
      })
    }
    })
  },

  uploadAvatar(path) {
    return new Promise((resolve) => {
      if (!path || !(path.startsWith('wxfile://') || path.startsWith('http://tmp') || path.startsWith('/tmp'))) {
        resolve(path || '')
        return
      }
      market.uploadMarketMedia(path, this.data.editId || 0).then((res) => {
        resolve(res && res.status === 0 && res.data && res.data.url ? res.data.url : path)
      }).catch(() => resolve(path))
    })
  },

  uploadImages(idx, callback) {
    const urls = this.data.mediaUrls
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
