const requests = require('./request')
const log = require('./log')

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

const pay = function(userType) {
  return requests
    .getPaymentInfo(userType)
    .then((res) => {
      log.info('获得付款信息！')
      log.info(info)

      // 获得预支付信息后开始微信支付
      return actualPayment(res)
    })
}

// 付费咨询
const payConsultFee = function() {
  return requests
    .getAvatarAndNickname()
    .then((done) => {
      if (done) {
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
        
        wx.showToast({
          title: '很遗憾',
          icon: 'error'
        })

        return Promise.reject()
      }
    })
}

module.exports = {
  pay : pay,
  payConsultFee : payConsultFee
}