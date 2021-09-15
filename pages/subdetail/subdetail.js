// pages/subdetail/subdetail.js
let app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    subscription: null,
    // 选项
    huXings: [],
    // 用户的更新
    newHuXings: [],
    newHuXingStr : '',
    priceCap: null,
    areaCap: null,
    minArea: null,
    excludeFloor : '',
    // 弹窗相关
    showModal: false
  },

  onLoad: function (options) {
    let subscription = wx.getStorageSync('editingRule')
    if (subscription) {
      // 读取用户的选择, 默认全选中
      // 户型
      let huXingSelections = 
        subscription.subInfo.targetType == null ? constants.allRoomTypes : 
          JSON.parse(subscription.subInfo.targetType).map(s => Number(s))
      let huXings = constants.allRoomTypes.map(type => {
        return {
          value : type,
          displayName : constants.id2Type(type),
          checked : huXingSelections.includes(type)
        }
      })
      
      this.setData({
        subscription : subscription,
        huXings : huXings,
        newHuXings : huXings.filter(obj => obj.checked).map(obj => obj.value),
        newHuXingStr : huXingSelections.map(s => constants.id2Type(s)).join(', '),
        priceCap : subscription.subInfo.maxPrice == null ? '' : subscription.subInfo.maxPrice,
        areaCap : subscription.subInfo.maxArea == null ? '' : subscription.subInfo.maxArea,
        minArea : subscription.subInfo.minArea == null ? '' : subscription.subInfo.minArea,
        excludeFloor : 
          subscription.subInfo.excludeFloor == null ? '' : JSON.parse(subscription.subInfo.excludeFloor).join(',')
      })
    }
  },

  // 设置偏好户型
  huXingSelection(e) {
    let selections = e.detail.value // e.g. ["2", "3", "4"]
    this.setData({
      newHuXings : selections,
      newHuXingStr : selections.map(s => {
        return constants.id2Type(Number(s))
      }).join(', ')
    })
  },

  // 设置价格上限
  setPriceCap(e) {
    let userDefinedPriceCap = e.detail.value
    this.setData({
      priceCap : userDefinedPriceCap
    })
  },

  // 设置面积上限
  setAreaCap(e) {
    let userDefinedAreaCap = e.detail.value
    this.setData({
      areaCap : userDefinedAreaCap
    })
  },

  // 设置最小面积
  setMinArea(e) {
    let userDefinedMinArea = e.detail.value
    this.setData({
      minArea : userDefinedMinArea
    })
  },

  // 不要的楼层
  setExcludedFloors(e) {},

  // 弹窗
  openModal() {
    this.setData({
      showModal : true
    })
  },

  hideModal() {
    this.setData({
      showModal : false
    })
  },

  // 递交更新
  saveChanges() {
    let self = this
    let pid = self.data.subscription.pid
    let pname = self.data.subscription.subInfo.name
    let payload = {}
    // 不能保存["1", "2"]，而是[1, 2]
    payload['targetType'] = JSON.stringify(self.data.newHuXings.map(str => Number(str)))
    if (self.data.excludeFloor.trim() != '') {
      let exFloorStr = self.data.excludeFloor.replaceAll('，', ',')
      // 不能保存["1", "2"]，而是[1, 2]
      payload['excludeFloor'] = JSON.stringify(exFloorStr.split(',').map(str => Number(str)))
    }
    if (self.data.priceCap != null) {
      payload['maxPrice'] = self.data.priceCap
    }
    if (self.data.minArea != null) {
      payload['minArea'] = self.data.minArea
    }
    if (self.data.areaCap != null) {
      payload['maxArea'] = self.data.areaCap
    }

    requests
      .updateSubscription(pid, pname, payload)
      .then((res) => {
        wx.removeStorageSync('editingRule')
        self.hideModal()
        wx.redirectTo({
          url: '/pages/subscribe/subscribe',
        })
      })
      .catch((err) => {
        // 请求失败
        console.log(err)
        self.hideModal()
      })
  },

  // 导航至小区详情页
  navToHouses(e) {
    let url = '../project/project?pid=' + this.data.subscription.pid
    wx.navigateTo({
      url: url,
    })
  }
})