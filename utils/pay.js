const requests = require('./request')
const market = require('./market')
const log = require('./log')
const userInfoHelper = require('./user')

function canUseVirtualPayment() {
  return !!wx.canIUse('requestVirtualPayment')
}

const actualPayment = function(payment_info) {
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      nonceStr: payment_info.nonceStr,
      package: payment_info.packageStr,
      paySign: payment_info.paySign,
      timeStamp: `${payment_info.timeStamp}`,
      signType: payment_info.signType,
      success: (res) => {
        log.info('付款成功')
        log.info(res)
        resolve(true)
      },
      fail: (err) => {
        log.error(err)
        console.log(err)
        reject(false)
      }
    })
  })
}

const actualVirtualPayment = function(vpInfo) {
  return new Promise((resolve, reject) => {
    if (!canUseVirtualPayment()) {
      wx.showToast({ title: '请升级微信后再试', icon: 'none' })
      reject(false)
      return
    }
    const signDataStr = typeof vpInfo.signData === 'string' ? vpInfo.signData : JSON.stringify(vpInfo.signData)
    console.log('=== VP DEBUG ===')
    console.log('signData 类型:', typeof vpInfo.signData)
    console.log('signData 内容:', vpInfo.signData)
    console.log('signData 长度:', vpInfo.signData ? vpInfo.signData.length : 0)
    console.log('paySig:', vpInfo.paySig)
    console.log('signature:', vpInfo.signature)
    console.log('传入微信的 signData:', signDataStr)
    console.log('================')
    wx.requestVirtualPayment({
      signData: signDataStr,
      paySig: vpInfo.paySig,
      signature: vpInfo.signature,
      mode: 'short_series_goods',
      success: (res) => {
        log.info('虚拟支付成功')
        log.info(res)
        resolve(true)
      },
      fail: ({ errMsg, errCode }) => {
        log.error('虚拟支付失败', errCode, errMsg)
        if (errCode === -2) {
          resolve(false)
          return
        }
        reject(false)
      }
    })
  })
}

const payWithOrder = function(orderPromise) {
  return orderPromise.then((res) => {
    if (!res || res.code !== 0 || !res.data) {
      console.log('创建订单失败', res)
      return Promise.reject(res)
    }
    return actualPayment(res.data)
  })
}

// 市场房源体系的支付（后端返回 {status, data} 而非 {code, data}）
const payWithMarketOrder = function(orderPromise) {
  return orderPromise.then((res) => {
    if (!res || res.status !== 0 || !res.data) {
      console.log('创建市场订单失败', res)
      return Promise.reject(res)
    }
    const payInfo = res.data.pay_params || res.data
    return actualPayment(payInfo)
  })
}

const payWithVpOrder = function(orderPromise) {
  return orderPromise.then((res) => {
    // 市场体系接口统一返回 {status, data}，兼容旧的 {code, data} 格式
    const ok = res && res.data != null && (typeof res.status === 'number' ? res.status === 0 : (res.code === undefined || res.code === 0))
    if (!ok) {
      console.log('创建虚拟支付订单失败', res)
      return Promise.reject(res)
    }
    return actualVirtualPayment(res.data)
  })
}

const payContact = function(houseId, type, message) {
  return payWithVpOrder(market.createContact({ house_id: houseId, type: type, message: message }))
}

const payVip = function(type, period) {
  return payWithVpOrder(market.createVipOrder({ type: type, period: period }))
}

const payDepositFee = function(houseId) {
  return payWithVpOrder(market.payDeposit(houseId))
}

const payViewing = function(houseId, slotTimes, remark) {
  return payWithVpOrder(market.createViewing({
    house_id: houseId,
    slot_times: slotTimes,
    remark: remark || ''
  }))
}

const payReportFee = function(houseId, reason) {
  return payWithVpOrder(market.createReport({ house_id: houseId, reason: reason }))
}

const pay = function(userType) {
  return requests
    .getPaymentInfoVp(userType)
    .then((res) => {
      log.info('获得虚拟付款信息！')
      log.info(res)
      return actualVirtualPayment(res)
    })
}

const payConsultFee = function() {
  return userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
    if (res !== null) {
      log.info('已经获得用户的昵称')
      return requests
        .getConsultingPaymentInfoVp()
        .then((info) => {
          log.info('获得虚拟付款信息！')
          log.info(info)
          return actualVirtualPayment(info)
        })
    } else {
      log.info('用户拒绝提供昵称')
      wx.showToast({ title: '很遗憾', icon: 'error' })
      return Promise.reject()
    }
  })
}

module.exports = {
  pay: pay,
  payConsultFee: payConsultFee,
  payContact: payContact,
  payVip: payVip,
  payDepositFee: payDepositFee,
  payReportFee: payReportFee,
  payViewing: payViewing,
  payWithOrder: payWithOrder,
  payWithMarketOrder: payWithMarketOrder,
  actualPayment: actualPayment,
  actualVirtualPayment: actualVirtualPayment,
  canUseVirtualPayment: canUseVirtualPayment,
}
