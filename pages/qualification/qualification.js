// pages/qualification/qualification.js
const log = require('./../../utils/log')
Page({
  data: {
    a1 : '',
    tip1: '',
    showTip1 : false,
    a2 : '',
    tip2: '',
    showTip2 : false,
    a3 : '',
    tip3: '',
    showTip3 : false,
    a4 : '',
    tip4: '',
    showTip4 : false,
    a5 : '',
    tip5: '',
    showTip5 : false,
    a6 : '',
    tip6: '',
    showTip6 : false,
    curComponentId: 0
  },

  onLoad: function (options) {
    log.info('onLoad qualification')

    if(options.curComponentId) {
      this.setData({curComponentId: options.curComponentId})
    }
    this.setData({
      a1 : '',
      tip1: '',
      showTip1 : false,
      a2 : '',
      tip2: '',
      showTip2 : false,
      a3 : '',
      tip3: '',
      showTip3 : false,
      a4 : '',
      tip4: '',
      showTip4 : false,
      a5 : '',
      tip5: '',
      showTip5 : false,
      a6 : '',
      tip6: '',
      showTip6 : false
    })
  },

  answer(e) {
    let question = e.currentTarget.dataset.question
    let ans = e.detail.value
    let self = this
    if (question && ans) {
      switch(question) {
        case 'q1':
          self.setData({
            a1 : ans,
            tip1 : ans == 'a1' ? '不符合要求' : ''
          })
          break;
        case 'q2':
          self.setData({
            a2 : ans,
            tip2 : (ans == 'a2' || ans == 'a4') ? '不能在本市有人均建筑面积大于15平米的房产' : ''
          })
          break;
        case 'q3':
          self.setData({
            a3 : ans,
            tip3 : ans == 'a3' ? '必须有上海户籍 / 居住证' : ''
          })
          break;
        case 'q4':
          self.setData({
            a4 : ans,
            tip4 : ans == 'a1' ? '' : '必须有一年以上的劳动合同'
          })
          break;
        case 'q5':
          self.setData({
            a5 : ans,
            tip5 : ans == 'a2' ? '公司注册地必须在浦东新区' : ''
          })
          break;
        case 'q6':
          self.setData({
            a6 : ans,
            tip6 : ans == 'a2' ? '必须正常缴纳社保，如有中断需合理解释' : ''
          })
          break;
        default:
      }
    }
  },

  checkAns() {
    log.info('点击交卷')
    
    if (this.hasEmptyQuestion()) {
      wx.showToast({
        title: '有未回答的问题！',
        icon: "error"
      })
    } else {
      let self = this
      self.setData({
        showTip1 : self.data.tip1 == '' ? false : true,
        showTip2 : self.data.tip2 == '' ? false : true,
        showTip3 : self.data.tip3 == '' ? false : true,
        showTip4 : self.data.tip4 == '' ? false : true,
        showTip5 : self.data.tip5 == '' ? false : true,
        showTip6 : self.data.tip6 == '' ? false : true
      }, () => {
        if (self.data.showTip1 || self.data.showTip2 || self.data.showTip3 || self.data.showTip4 || self.data.showTip5 || self.data.showTip6) {
          wx.showToast({
            title: '可惜！',
            icon: 'error'
          })
        } else {
          wx.showToast({
            title: '恭喜！',
          })
        }
      })
    }
  },

  // 检查是否有未回答的问题
  hasEmptyQuestion() {
    return this.data.a1 == '' || this.data.a2 == '' || this.data.a3 == '' || this.data.a4 == '' || this.data.a5 == '' || this.data.a6 == ''
  },

  // 转发
  onShareAppMessage: function(options) {
    var path = '/pages/user/user?tab=qualification&curComponentId=' + this.data.curComponentId
    let self = this
    return {
      title : '申请资格',
      path : '/pages/login/login?redirect=' + encodeURIComponent(path),
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