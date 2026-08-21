// PD租房 市场房源交易系统 API 封装
// 对应后端 main.py 新增路由：/market/*, /shbzf/*, /contact/*, /vip/*, /deposit/*, /report/*, /auth/*, /admin/*, /map/aggregate, /user/quota

const app = getApp()
const constants = require('./constants')
const { getClientId } = require('./clientid')

const _token = () => (app.globalData.userinfo && app.globalData.userinfo.tokenStr) || ''

const _headers = (extra) => {
  const h = { 'token': _token(), 'X-Client-Id': getClientId() }
  if (extra) Object.assign(h, extra)
  return h
}

const _get = (path) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: constants.server + path,
      header: _headers(),
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          console.log(`GET ${path} failed`, res)
          resolve(null)
        }
      },
      fail: (err) => {
        console.log(`GET ${path} error`, err)
        resolve(null)
      }
    })
  })
}

const _post = (path, data, isForm) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: constants.server + path,
      method: 'POST',
      header: _headers({
        'content-type': isForm ? 'application/x-www-form-urlencoded' : 'application/json'
      }),
      data: data,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          console.log(`POST ${path} failed`, res)
          resolve(null)
        }
      },
      fail: (err) => {
        console.log(`POST ${path} error`, err)
        resolve(null)
      }
    })
  })
}

const _upload = (path, filePath, formData) => {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: constants.server + path,
      filePath: filePath,
      name: 'file',
      header: _headers(),
      formData: formData || {},
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(res.data))
          } catch (e) {
            resolve(res.data)
          }
        } else {
          console.log(`UPLOAD ${path} failed`, res)
          resolve(null)
        }
      },
      fail: (err) => {
        console.log(`UPLOAD ${path} error`, err)
        resolve(null)
      }
    })
  })
}

// === 市场房源 ===
const getMarketList = (params) => _get('/market/house/list?' + _buildQuery(params))
const getMarketDetail = (id) => _get(`/market/house/${id}`)
const getMarketCompare = (ids) => _get('/market/houses/compare?ids=' + encodeURIComponent(ids.join(',')))
const publishMarketHouse = (data) => _post('/market/house', data)
const updateMarketHouse = (id, data) => _post(`/market/house/${id}/update`, data)
const offlineMarketHouse = (id) => _post(`/market/house/${id}/offline`)
const getMyMarketHouses = () => _get('/market/house/my')
const uploadMarketMedia = (filePath, houseId) => {
  return new Promise((resolve, reject) => {
    // 从文件路径中提取扩展名
    const ext = filePath.split('.').pop().split('?')[0].toLowerCase() || 'jpg'
    const isVideo = ['mp4', 'mov', 'avi', 'wmv', 'flv'].includes(ext)
    const mediaType = isVideo ? 'video' : 'photo'

    // 1. 获取七牛上传 token
    wx.request({
      url: constants.server + '/market/media/upload_token',
      method: 'GET',
      header: { 'token': _token() },
      data: { house_id: houseId || 0, ext, media_type: mediaType },
      success: (tokenRes) => {
        if (tokenRes.statusCode !== 200 || !tokenRes.data || tokenRes.data.status !== 0) {
          resolve(null)
          return
        }
        const { token, key, cdn_domain } = tokenRes.data.data

        // 2. 直传到七牛
        wx.uploadFile({
          url: 'https://upload.qiniup.com/',
          filePath: filePath,
          name: 'file',
          formData: { token, key },
          success: (upRes) => {
            if (upRes.statusCode === 200) {
              resolve({
                status: 0,
                data: {
                  url: `https://${cdn_domain}/${key}`,
                  type: mediaType
                }
              })
            } else {
              resolve(null)
            }
          },
          fail: () => resolve(null)
        })
      },
      fail: () => resolve(null)
    })
  })
}

// === 保租房 ===
const getShbzfList = (params) => _get('/shbzf/project/list?' + _buildQuery(params))
const getShbzfDetail = (id) => _get(`/shbzf/project/${id}`)
const getShbzfMedia = (id) => _get(`/shbzf/project/${id}/media`)
const getShbzfMapAggregate = () => _get('/shbzf/map/aggregate')
const saveShbzfPolygons = (data) => _post('/shbzf/map/polygons', data)

// === 地图聚合 ===
const getMapAggregate = (params) => _get('/map/aggregate?' + _buildQuery(params))

// === 联系配置 ===
const getContactConfig = () => _get('/contact/config')

// === 付费联系 ===
const createContact = (data) => _post('/contact/create', data)
const getContactList = () => _get('/contact/list')
const getContactDetail = (id) => _get(`/contact/${id}`)
const replyContact = (id, reply) => _post(`/contact/${id}/reply`, { reply })

// === VIP 订阅 ===
const getVipInfo = () => _get('/vip/info')
const createVipOrder = (data) => _post('/vip/order', data)
const getVipOrders = () => _get('/vip/orders')

// === 保证金 ===
const payDeposit = (houseId) => _post('/deposit/pay', { house_id: houseId })
const getDepositList = () => _get('/deposit/list')
const applyDepositRefund = (id) => _post(`/deposit/${id}/refund/apply`)

// === 举报 ===
const createReport = (data) => _post('/report/create', data)
const getReportList = () => _get('/report/list')
const getReportDetail = (id) => _get(`/report/${id}`)

// === 收藏 ===
const addFavorite = (houseType, houseId) => _post('/favorite/add', { house_type: houseType, house_id: houseId })
const removeFavorite = (houseType, houseId) => _post('/favorite/remove', { house_type: houseType, house_id: houseId })
const getFavoriteList = () => _get('/favorite/list')
const getFavoriteStatus = (houseType, houseId) => _get(`/favorite/status?house_type=${houseType}&house_id=${houseId}`)

// === 用户认证 ===
const submitRealName = (data) => _post('/auth/real_name', data)
const submitLandlordAuth = (data) => _post('/auth/landlord', data)
const getAuthStatus = () => _get('/auth/status')
const uploadAuthImage = (filePath) => _upload('/auth/upload', filePath)

// === 额度查询 ===
const getUserQuota = () => _get('/user/quota')

// === 管理员后台 ===
const adminLogin = (userName, password) => _post('/admin/login', { user_name: userName, password }, true)

const adminGetPendingHouses = (page) => _get(`/admin/market/house/pending?page=${page || 1}`)
const adminApproveHouse = (id) => _post(`/admin/market/house/${id}/approve`)
const adminRejectHouse = (id, comment) => _post(`/admin/market/house/${id}/reject`, { comment })

const adminGetPendingReports = (page) => _get(`/admin/report/pending?page=${page || 1}`)
const adminApproveReport = (id) => _post(`/admin/report/${id}/approve`)
const adminRejectReport = (id) => _post(`/admin/report/${id}/reject`)

const adminGetPendingDeposits = (page) => _get(`/admin/deposit/refund/pending?page=${page || 1}`)
const adminApproveDepositRefund = (id) => _post(`/admin/deposit/${id}/refund/approve`)

const adminGetPendingAuths = (page) => _get(`/admin/auth/pending?page=${page || 1}`)
const adminApproveAuth = (id) => _post(`/admin/auth/${id}/approve`)
const adminRejectAuth = (id, comment) => _post(`/admin/auth/${id}/reject`, { comment })

const adminGetPendingComments = (page) => _get(`/admin/comment/pending?page=${page || 1}`)
const adminApproveComment = (id) => _post(`/admin/comment/${id}/approve`)
const adminRejectComment = (id, reason) => _post(`/admin/comment/${id}/reject`, { reason })

// === 留言 ===
const createChatConversation = (houseId) => _post('/chat/conversation', { house_id: houseId })
const getChatConversations = () => _get('/chat/conversation/list')
const getChatConversationsByHouse = (houseId) => _get(`/chat/conversation/by_house?house_id=${houseId}`)
const hasChatConversationForHouse = (houseId) => _get(`/chat/conversation/has_house?house_id=${houseId}`)
const deleteChatConversation = (convId) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: constants.server + `/chat/conversation/${convId}`,
      method: 'DELETE',
      header: { 'token': _token() },
      success: (res) => resolve(res.statusCode === 200 ? res.data : null),
      fail: () => resolve(null)
    })
  })
}
const getChatMessages = (convId, page, size) => _get(`/chat/message/list?conv_id=${convId}&page=${page || 1}&size=${size || 50}`)
const sendChatMessage = (convId, msgType, content) => _post('/chat/message/send', {
  conversation_id: convId, msg_type: msgType, content: content
})
const getChatUnread = () => _get('/chat/unread')

// === 内容门槛（gate） ===
const getGateConfig = () => _get('/gate/config')
const getGateStatus = (houseId) => _get(`/gate/status?house_id=${houseId}`)
const unlockGate = (data) => _post('/gate/unlock', data)
const reportAbEvent = (data) => _post('/ab/event', data)

// === 公告/通知 ===
const getActiveNotices = () => _get('/notice/active')
const getNewHouseCount = (days) => _get('/market/house/new_count?days=' + (days || 3))

// === 看房预约 ===
const createViewing = (data) => _post('/viewing/create', data)
const getViewingList = (role, status, page, size) => {
  let url = `/viewing/list?role=${role || 'tenant'}&page=${page || 1}&size=${size || 20}`
  if (status !== undefined && status !== null && status !== '') url += `&status=${status}`
  return _get(url)
}
const getViewingDetail = (id) => _get(`/viewing/${id}`)
const confirmViewing = (id, slotId) => _post(`/viewing/${id}/confirm`, { slot_id: slotId || 0 })
const counterProposeViewing = (id, newTime) => _post(`/viewing/${id}/counter_propose`, { new_time: newTime })
const tenantConfirmViewing = (id) => _post(`/viewing/${id}/tenant_confirm`)
const markNoShow = (id) => _post(`/viewing/${id}/no_show`)
const reportViewing = (id, reason) => _post(`/viewing/${id}/report`, { reason: reason || '' })
const cancelViewing = (id, reason) => _post(`/viewing/${id}/cancel`, { reason: reason || '' })
const completeViewing = (id) => _post(`/viewing/${id}/complete`)

// 留言图片上传：先取七牛上传 token，再直传，返回 CDN URL
const uploadChatImage = (filePath) => {
  return new Promise((resolve, reject) => {
    const ext = (filePath.split('.').pop().split('?')[0] || 'jpg').toLowerCase()
    wx.request({
      url: constants.server + '/market/media/upload_token?house_id=0&ext=' + ext + '&media_type=photo',
      method: 'GET',
      header: { 'token': _token() },
      success: (tokenRes) => {
        if (tokenRes.statusCode !== 200 || !tokenRes.data || tokenRes.data.status !== 0) {
          resolve(null)
          return
        }
        const { token, key, cdn_domain } = tokenRes.data.data
        wx.uploadFile({
          url: 'https://upload.qiniup.com/',
          filePath: filePath,
          name: 'file',
          formData: { token, key },
          success: (upRes) => {
            if (upRes.statusCode === 200) {
              resolve(`https://${cdn_domain}/${key}`)
            } else {
              resolve(null)
            }
          },
          fail: () => resolve(null)
        })
      },
      fail: () => resolve(null)
    })
  })
}

const _buildQuery = (params) => {
  if (!params) return ''
  const arr = []
  for (const k in params) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      arr.push(`${k}=${encodeURIComponent(params[k])}`)
    }
  }
  return arr.join('&')
}

module.exports = {
  // 市场房源
  getMarketList,
  getMarketDetail,
  getMarketCompare,
  publishMarketHouse,
  updateMarketHouse,
  offlineMarketHouse,
  getMyMarketHouses,
  uploadMarketMedia,
  // 保租房
  getShbzfList,
  getShbzfDetail,
  getShbzfMedia,
  getShbzfMapAggregate,
  saveShbzfPolygons,
  // 地图
  getMapAggregate,
  // 联系
  createContact,
  getContactList,
  getContactDetail,
  replyContact,
  // 联系配置
  getContactConfig,
  // VIP
  getVipInfo,
  createVipOrder,
  getVipOrders,
  // 保证金
  payDeposit,
  getDepositList,
  applyDepositRefund,
  // 举报
  createReport,
  getReportList,
  getReportDetail,
  // 收藏
  addFavorite,
  removeFavorite,
  getFavoriteList,
  getFavoriteStatus,
  // 认证
  submitRealName,
  submitLandlordAuth,
  getAuthStatus,
  uploadAuthImage,
  // 额度
  getUserQuota,
  // 内容门槛
  getGateConfig,
  getGateStatus,
  unlockGate,
  reportAbEvent,
  // 看房预约
  createViewing,
  getViewingList,
  getViewingDetail,
  confirmViewing,
  counterProposeViewing,
  tenantConfirmViewing,
  markNoShow,
  reportViewing,
  cancelViewing,
  completeViewing,
  // 管理员
  adminGetPendingHouses,
  adminApproveHouse,
  adminRejectHouse,
  adminGetPendingReports,
  adminApproveReport,
  adminRejectReport,
  adminGetPendingDeposits,
  adminApproveDepositRefund,
  adminGetPendingAuths,
  adminApproveAuth,
  adminRejectAuth,
  // 评论审核
  adminGetPendingComments,
  adminApproveComment,
  adminRejectComment,
  // 留言
  createChatConversation,
  getChatConversations,
  getChatConversationsByHouse,
  hasChatConversationForHouse,
  deleteChatConversation,
  getChatMessages,
  sendChatMessage,
  getChatUnread,
  uploadChatImage,
  // 公告/通知
  getActiveNotices,
  getNewHouseCount,
}
