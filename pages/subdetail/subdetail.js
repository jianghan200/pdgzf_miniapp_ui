// pages/subdetail/subdetail.js
let app = getApp()
const constants = require('../../utils/constants')
const requests = require('../../utils/request')
const log = require('./../../utils/log')
const subHelper = require('../../utils/subscripton')

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
    showModal: false,
    showDeleteModal: false
  },

  onLoad: function (options) {
    log.info('onLoad subdetail')

    let subscription = wx.getStorageSync('editingRule')
    if (subscription) {
      log.info('获取了用户偏好')
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

  // 确认修改的弹窗
  // 打开弹窗
  openModal() {
    this.setData({
      showModal : true
    })
  },

  // 关闭弹窗
  hideModal() {
    this.setData({
      showModal : false
    })
  },

  // 取消订阅的确认弹窗
  // 打开弹窗
  openDeleteModal(e) {
    this.setData({
      showDeleteModal : true
    })
  },

  // 关闭弹窗
  hideDeleteModal() {
    this.setData({
      showDeleteModal : false
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

    log.info(`用户试图保存选房偏好: pid: ${pid}, pname: ${pname}, payload: ${JSON.stringify(payload)}`)

    requests
      .updateSubscription(pid, pname, payload)
      .then((res) => {
        log.info('选房偏好更新成功')

        wx.removeStorageSync('editingRule')

        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })

        self.hideModal()
        wx.redirectTo({
          url: '/pages/subscribe/subscribe',
        })
      })
      .catch((err) => {
        log.error('选房偏好更次呢失败')
        log.error(err)
        // 请求失败
        console.log(err)
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        })

        self.hideModal()
      })
  },

  // 解除订阅
  removeSubscription() {
    let ruleId = this.data.subscription.subInfo.id
    let areaId = this.data.subscription.aid
    let projectId = this.data.subscription.pid

    log.info(`解除订阅: ruleId: ${ruleId}, areaId: ${areaId}, projectId: ${projectId}`)

    let self = this
    subHelper
      .unsubscribeThenSyncUp(ruleId, areaId, projectId)
      .then((res) => {
        log.info('unsubscribeThenSyncUp 成功')

        self.hideDeleteModal()

        // 触发subscribe页的onLoad方法，重新加载用户的最新订阅清单
        wx.redirectTo({
          url: '/pages/subscribe/subscribe',
        })
      })
      .catch((err) => {
        log.error('unsubscribeThenSyncUp 失败')
        log.error(err)
        console.log(err)
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