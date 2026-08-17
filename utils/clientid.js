// 客户端 ID（匿名设备标识）：用于 AB 测试分组 + 匿名广告解锁凭据
// 持久化在 wx storage，生成后不变

const STORAGE_KEY = 'pdgzf_client_id'

function getClientId() {
  try {
    let cid = wx.getStorageSync(STORAGE_KEY)
    if (cid) return cid
  } catch (e) {}
  // 生成 UUID v4 简化版
  const cid = 'cid_' + Date.now().toString(36) + '_' +
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 6)
  try {
    wx.setStorageSync(STORAGE_KEY, cid)
  } catch (e) {}
  return cid
}

module.exports = {
  getClientId,
}
