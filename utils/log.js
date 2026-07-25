// var log = wx.getRealtimeLogManager()
var log = wx.getRealtimeLogManager()

// 检测是否为开发环境
function isDevelopment() {
  try {
    // 通过 wx.getAccountInfoSync 获取小程序信息
    const accountInfo = wx.getAccountInfoSync()
    // miniProgram.envVersion: 'develop' | 'trial' | 'release'
    return accountInfo.miniProgram.envVersion === 'develop'
  } catch (e) {
    // 如果获取失败，默认为开发环境（本地开发工具）
    return true
  }
}

const isDev = isDevelopment()

module.exports = {
  info() {
    if (!log) return
    log.info.apply(log, arguments)
    // 开发环境下同时输出到 console
    if (isDev) {
      console.info('[INFO]', ...arguments)
    }
  },
  warn() {
    if (!log) return
    log.warn.apply(log, arguments)
    // 开发环境下同时输出到 console
    if (isDev) {
      console.warn('[WARN]', ...arguments)
    }
  },
  error() {
    if (!log) return
    log.error.apply(log, arguments)
    // 开发环境下同时输出到 console
    if (isDev) {
      console.error('[ERROR]', ...arguments)
    }
  }
}