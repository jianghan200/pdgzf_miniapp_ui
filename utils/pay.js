const requests = require('./request')
const market = require('./market')
const log = require('./log')
const userInfoHelper = require('./user')

// 付款
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
// 通用：先创建订单拿支付参数，再调起微信支付
const payWithOrder = function(orderPromise) {
  return orderPromise.then((res) => {
    if (!res || res.code !== 0 || !res.data || !res.data.pay_params) {
      console.log('创建订单失败', res)
      return Promise.reject(res)
    }
    return actualPayment(res.data.pay_params)
  })
}

// 市场房源 付费联系
const payContact = function(houseId, type, message) {
  return payWithOrder(market.createContact({ house_id: houseId, type: type, message: message }))
}

// VIP 订阅
const payVip = function(type, period) {
  return payWithOrder(market.createVipOrder({ type: type, period: period }))
}

// 保证金支付
const payDepositFee = function(houseId) {
  return payWithOrder(market.payDeposit(houseId))
}

// 举报费支付
const payReportFee = function(houseId, reason) {
  return payWithOrder(market.createReport({ house_id: houseId, reason: reason }))
}

// vip 付费
const pay = function(userType) {
  return requests
    .getPaymentInfo(userType)
    .then((res) => {
      log.info('获得付款信息！')
      log.info(res)

      // 获得预支付信息后开始微信支付
      return actualPayment(res)
    })
}

// 付费咨询
const payConsultFee = function() {
  return userInfoHelper.get_tencent_nicknameAndAvatar().then(res => {
    if (res !== null) {
      log.info('已经获得用户的昵称')

      return requests
        .getConsultingPaymentInfo()
        .then((info) => {
          log.info('获得付款信息！')
          log.info(info)

          return actualPayment(info)
        })
    } else {
      log.info('用户拒绝提供昵称')
      wx.showToast({ title: '很遗憾', icon: 'error' })

      return Promise.reject()
    }
  })
}

module.exports = {
  pay : pay,
  payConsultFee : payConsultFee,
  payContact : payContact,
  payVip : payVip,
  payDepositFee : payDepositFee,
  payReportFee : payReportFee,
  actualPayment : actualPayment
}