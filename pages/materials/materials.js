// pages/materials/materials.js
const log = require('./../../utils/log')

Page({
  data: {
    // 导航栏相关
    curTab : 0,
    scrollLeft : 0,
    // 上海户口 / 居住证
    hasHukou : true,
    divorced : false,
    bereft : false,
    hasHouse : false,
    hasPublicRental : false,
    employerIdx : 0,
    employers : ['企业单位', '公务员', '事业单位', '单位申请'],
    spouseHasHukou : true,
    hasAdultChildren : false,
    hasNonageChildren : true,
    // 预览列表
    showPreviewModal : false,
    previewList : []
  },

  // 导航栏上选择不同的tab
  tabSelect(e) {
    this.setData({
      curTab: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1 )* 60
    })
  },

  // toggle 有户口 / 有居住证
  toggleHukou(e) {
    this.setData({
      hasHukou : e.detail.value
    })
  },

  // toggle 未离异 / 已离异
  toggleDivorced(e) {
    this.setData({
      divorced : e.detail.value
    })
  },

  // toggle 未丧偶 / 已丧偶
  toggleBereft(e) {
    this.setData({
      bereft : e.detail.value 
    })
  },

  // toggle 本市无房 / 本市有房
  toggleHasHouse(e) {
    this.setData({
      hasHouse : e.detail.value
    })
  },

  // toggle 无本市公有住房 / 有本市公有住房
  toggleHasPublicRental(e) {
    this.setData({
      hasPublicRental : e.detail.value
    })
  },

  // 选择单位类型
  pickEmployer(e) {
    this.setData({
      employerIdx : e.detail.value
    })
  },

  // toggle配偶 有上海户口 / 有上海居住证
  toggleSpouseHasHukou(e) {
    this.setData({
      spouseHasHukou : e.detail.value
    })
  },

  // toggle 有成年 / 无成年
  toggleHasAdultChildren(e) {
    this.setData({
      hasAdultChildren : e.detail.value
    })
  },

  // toggle 有未成年 / 无未成年
  toggleHasNonageChildren(e) {
    this.setData({
      hasNonageChildren : e.detail.value
    })
  },

  // 打开预览列表Modal
  preview(e) {
    log.info('点击预览，生成列表')

    let previewList = ['公共租赁住房准入资格申请表（打印）','本人身份证（原件及正反面复印件）','社保缴费证明']
    // 配偶相关
    if (this.data.curTab == 2 || this.data.curTab == 3) {
      previewList.push('婚姻状况证明复印件（夫妻双方结婚证原件）')
      previewList.push('配偶的身份证正反面复印件（出示原件）')
      previewList.push('配偶拥有本市产权住房的《房地产权证》复印件（出示原件）')
      previewList.push('配偶承租本市公有住房的《租用居住公房凭证》复印件（出示原件）')
      if (this.data.spouseHasHukou) {
        previewList.push('配偶的本市户口簿从第一页复印到空白页（出示原件）')
        previewList.push('配偶的本市户籍证明需注明：公共户或集体户')
      }
    } else {
      previewList.push('单身承诺书')
      if (this.data.divorced) {
        previewList.push('离婚证的复印件（出示原件）')
        previewList.push('法院离婚判决书的复印件（出示原件）')
        previewList.push('离婚协议书证明的复印件（出示原件）')
      }
      if (this.data.bereft) {
        previewList.push('《死亡医学证明》的复印件（出示原件）')
      }
    }

    // 子女相关
    if (this.data.curTab == 1 || this.data.curTab == 3) {
      if (this.data.hasAdultChildren || this.data.hasNonageChildren) {
        previewList.push('子女的户口页复印件（出示原件）')
      }
      if (this.data.hasNonageChildren) {
        previewList.push('未成年子女的《出生证明》的复印件（出示原件）')
      } 
      if (this.data.hasAdultChildren) {
        previewList.push('成年子女的身份证正反面复印件（出示原件）')
        previewList.push('成年子女在本市的产权住房的《房地产权证》复印件（出示原件）')
        previewList.push('成年子女承租本市公有住房的《租用居住公房凭证》复印件（出示原件）')
        previewList.push('成年（适婚）子女的婚姻状况证明')
      }
    }

    // 单位材料
    switch(this.data.employerIdx) {
      case 0:
        previewList.push('劳动/工作合同复印件（出示原件）')
        previewList.push('《营业执照》复印件')
        break;
      case 1:
        previewList.push('在职证明（盖公章）')
        previewList.push('《组织机构代码证》')
        break;
      case 2:
        previewList.push('劳动/工作合同复印件（出示原件）')
        previewList.push('《事业单位法人证书》')
        break;
      case 3:
        previewList.push('劳动/工作合同复印件（出示原件）')
        previewList.push('三证或三证合一复印件（需加盖公章）')
        break;
      default:
    }

    // 户籍材料
    if (this.data.hasHukou) {
      previewList.push('户口簿从第一页复印到空白页（出示原件）')
      previewList.push('户籍证明')
    } else {
      previewList.push('居住证正反面复印件（出示原件）')
    }

    // 住房相关资料
    if (this.data.hasHouse) {
      previewList.push('《房地产权证》复印件（出示原件）')
    }

    // 公有住房资料
    if (this.data.hasPublicRental) {
      previewList.push('《租用居住公房凭证》复印件（出示原件）')
    }

    this.setData({
      showPreviewModal : true,
      previewList : previewList
    })
  },

  hideModal() {
    this.setData({
      showPreviewModal : false
    })
  },

  onLoad: function (options) {
    log.info('onLoad materials')
  },
  
  // 转发
  onShareAppMessage: function(options) {
    let self = this
    return {
      title : 'PD公租房',
      path : '/pages/login/login',
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