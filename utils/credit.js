/**
 * 积分模块 API 封装
 * 包含：积分账户、流水、赚取、消耗、兑换会员、分享邀请等
 */

const app = getApp()
const constants = require('./constants')
const { getClientId } = require('./clientid')

const _token = () => (app.globalData.userinfo && app.globalData.userinfo.tokenStr) || ''

const _headers = () => ({ 'token': _token(), 'X-Client-Id': getClientId() })

const _get = (path) => {
  return new Promise((resolve) => {
    wx.request({
      url: constants.server + path,
      method: 'GET',
      header: _headers(),
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          console.log('GET ' + path + ' failed', res)
          resolve(null)
        }
      },
      fail: (err) => {
        console.log('GET ' + path + ' error', err)
        resolve(null)
      }
    })
  })
}

const _post = (path, data) => {
  return new Promise((resolve) => {
    wx.request({
      url: constants.server + path,
      method: 'POST',
      header: _headers({ 'content-type': 'application/json' }),
      data: data,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          console.log('POST ' + path + ' failed', res)
          resolve({ status: -1, msg: '请求失败' })
        }
      },
      fail: (err) => {
        console.log('POST ' + path + ' error', err)
        resolve({ status: -1, msg: '网络错误' })
      }
    })
  })
}

/**
 * 生成唯一的 request_id，用于幂等控制
 * 格式: {source}_{user_id}_{timestamp}_{random}
 */
function _genRequestId(source) {
  const userId = (app.globalData.userinfo && app.globalData.userinfo.id) || 0
  const ts = Date.now()
  const rand = Math.random().toString(36).substring(2, 8)
  return source + '_' + userId + '_' + ts + '_' + rand
}

/**
 * 获取积分账户信息（余额 + 今日进度）
 * @returns {Promise<null|{balance, total_earned, daily_progress}>}
 */
function getAccount() {
  return _get('/credit/account').then((res) => {
    if (res && res.status === 0 && res.data) {
      return res.data
    }
    return null
  })
}

/**
 * 获取积分流水
 * @param {number} page
 * @param {number} size
 * @returns {Promise<null|{list, total}>}
 */
function getTransactions(page, size) {
  return _get('/credit/transactions?page=' + (page || 1) + '&size=' + (size || 20)).then((res) => {
    if (res && res.status === 0 && res.data) {
      return res.data
    }
    return null
  })
}

/**
 * 上报赚积分（看完广告后调用）
 * @param {string} source - 来源类型: 'ad' | 'share' | 'publish' | 'invite_register'
 * @param {string} requestId - 幂等键
 * @param {number} [relatedUserId]
 * @param {number} [relatedRecordId]
 * @param {string} [remark]
 * @returns {Promise<{status, msg, data}>}
 */
function earnCredit(source, requestId, relatedUserId, relatedRecordId, remark) {
  return _post('/credit/earn', {
    source: source,
    request_id: requestId || _genRequestId(source),
    related_user_id: relatedUserId || 0,
    related_record_id: relatedRecordId || 0,
    remark: remark || ''
  })
}

/**
 * 消耗积分
 * @param {string} source - 来源类型: 'unlock' | 'exchange_vip'
 * @param {number} amount - 消耗数量
 * @param {string} requestId - 幂等键
 * @param {number} [relatedRecordId]
 * @param {string} [remark]
 * @returns {Promise<{status, msg, data}>}
 */
function spendCredit(source, amount, requestId, relatedRecordId, remark) {
  return _post('/credit/spend', {
    source: source,
    amount: amount,
    request_id: requestId || _genRequestId(source),
    related_record_id: relatedRecordId || 0,
    remark: remark || ''
  })
}

/**
 * 积分兑换会员
 * @param {string} period - 'week' | 'month' | 'year'
 * @param {string} requestId - 幂等键
 * @returns {Promise<{status, msg, data}>}
 */
function exchangeVip(period, requestId) {
  return _post('/credit/exchange_vip', {
    period: period,
    request_id: requestId || _genRequestId('exchange_vip')
  })
}

/**
 * 上报分享打开
 * @param {number} inviterUid - 邀请人用户ID
 * @returns {Promise<{status, msg, data}>}
 */
function reportShareOpen(inviterUid) {
  return _post('/credit/share/open', {
    inviter_uid: inviterUid
  })
}

/**
 * 上报分享注册
 * @returns {Promise<{status, msg, data}>}
 */
function reportShareRegister() {
  return _post('/credit/share/register')
}

/**
 * 获取邀请信息
 * @returns {Promise<null|{invite_count, registered_count, reward_count, invitees}>}
 */
function getInviteInfo() {
  return _get('/credit/invite/info').then((res) => {
    if (res && res.status === 0 && res.data) {
      return res.data
    }
    return null
  })
}

/**
 * 获取积分配置
 * @returns {Promise<null|{ad_reward, publish_reward, exchange_week, ...}>}
 */
function getCreditConfig() {
  return _get('/credit/config').then((res) => {
    if (res && res.status === 0 && res.data) {
      return res.data
    }
    return null
  })
}

/**
 * 生成带邀请参数的分享对象
 * @param {string} scene - 分享场景标识
 * @param {object} [extra] - 额外参数
 * @returns {Promise<{title, path, imageUrl}>}
 */
function buildShareParams(scene, extra) {
  const userId = (app.globalData.userinfo && app.globalData.userinfo.id) || 0
  let path = ''
  let title = '浦东租房 - 找到你心仪的房子'

  if (scene === 'credit') {
    path = '/pages/credit/credit'
    title = '赚积分换会员，浦东租房更轻松'
  } else if (scene === 'house') {
    const houseId = (extra && extra.houseId) || ''
    path = houseId ? '/pages/market/detail?id=' + houseId + '&inviter_' + userId : '/pages/market/list'
    title = (extra && extra.title) || '浦东租房 - 好房推荐'
  } else if (scene === 'invite') {
    path = '/pages/invite/landing/landing?inviter_uid=' + userId
    title = '我在用PD租房，邀请你一起找房'
  } else {
    path = '/pages/market/list'
  }

  return Promise.resolve({
    title: title,
    path: userId ? (path + (path.indexOf('?') >= 0 ? '&' : '?') + 'inviter_uid=' + userId) : path,
    imageUrl: ''
  })
}

module.exports = {
  getAccount,
  getTransactions,
  earnCredit,
  spendCredit,
  exchangeVip,
  reportShareOpen,
  reportShareRegister,
  getInviteInfo,
  getCreditConfig,
  buildShareParams
}
