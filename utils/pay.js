const requests = require('./request')

const pay = function(userType) {
  return requests
    .getPaymentInfo(userType)
    .then((res) => {
      // 获得预支付信息后开始微信支付
      return new Promise((resolve, reject) => {
          wx.requestPayment({
            nonceStr: res.nonceStr,
            package: res.packageStr,
            paySign: res.paySign,
            timeStamp: `${res.timeStamp}`,
            signType: res.signType,
            success: (res) => {
              resolve(true)
            },
            fail: (err) => {
              console.log(err)
              reject(false)
            }
          })
        })
    })
}

module.exports = {
  pay : pay
}