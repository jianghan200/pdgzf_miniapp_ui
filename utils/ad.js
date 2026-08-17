// 广告工具：激励视频 + 插屏广告
// adUnitId 从 /gate/config 接口下发，不写死

const log = require('./log')

// 广告单例缓存（同一 adUnitId 复用实例）
const _rewardedAds = {}
const _interstitialAds = {}

function showRewardedVideo(adUnitId) {
  return new Promise((resolve, reject) => {
    if (!adUnitId) {
      reject(new Error('广告位未配置'))
      return
    }
    let ad = _rewardedAds[adUnitId]
    if (!ad) {
      ad = wx.createRewardedVideoAd({ adUnitId })
      _rewardedAds[adUnitId] = ad
      // 预热：创建后立即加载，提高首次 show() 成功率
      ad.load().catch(() => {})
    }

    let settled = false
    let attempts = 0
    const MAX_ATTEMPTS = 2

    // 清理事件监听，防止同一实例上重复绑定 onError/onClose
    const cleanup = () => {
      ad.offClose(handleClose)
      ad.offError(handleError)
    }

    // onClose 是唯一能确认"用户看完广告"的回调，必须保持有效直到 Promise 落定
    const handleClose = (res) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(!!(res && res.isEnded))
      // 关闭后立即预加载下一次，减少后续"加载广告..."等待
      ad.load().catch(() => {})
    }
    // onError 只记录日志，不当作最终失败：
    // 首次 show() 失败（广告未预加载）会触发 error 事件，但随后 load+show 重试可以成功播放。
    const handleError = (err) => {
      log.error('激励视频广告错误', err)
    }
    const fail = (err) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    ad.onClose(handleClose)
    ad.onError(handleError)

    // 先确保 load 成功再 show，避免微信在老机型上弹出"加载广告..."Toast
    const attempt = () => {
      ad.load()
        .then(() => ad.show())
        .catch(() => {
          if (attempts >= MAX_ATTEMPTS) {
            fail(new Error('激励视频广告加载失败'))
            return
          }
          attempts++
          attempt()
        })
    }
    attempt()
  })
}

function showInterstitial(adUnitId) {
  return new Promise((resolve, reject) => {
    if (!adUnitId) {
      reject(new Error('插屏广告位未配置'))
      return
    }
    let ad = _interstitialAds[adUnitId]
    if (!ad) {
      ad = wx.createInterstitialAd({ adUnitId })
      _interstitialAds[adUnitId] = ad
      // 预热：创建后立即加载，提高首次 show() 成功率
      ad.load().catch(() => {})
    }

    let settled = false
    let attempts = 0
    const MAX_ATTEMPTS = 2

    // 清理事件监听，防止同一实例上重复绑定 onError/onClose
    const cleanup = () => {
      ad.offClose(handleClose)
      ad.offError(handleError)
    }

    const handleClose = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(true)
      // 关闭后立即预加载下一次
      ad.load().catch(() => {})
    }
    const handleError = (err) => {
      log.error('插屏广告错误', err)
    }
    const fail = (err) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    ad.onClose(handleClose)
    ad.onError(handleError)

    // 先确保 load 成功再 show，避免微信弹出"加载广告..."Toast
    const attempt = () => {
      ad.load()
        .then(() => ad.show())
        .catch(() => {
          if (attempts >= MAX_ATTEMPTS) {
            fail(new Error('插屏广告加载失败'))
            return
          }
          attempts++
          attempt()
        })
    }
    attempt()
  })
}

/**
 * 按广告类型播放广告
 * @param {string} adType - 'rewarded' | 'interstitial' | 'none'
 * @param {object} adUnits - { rewarded: 'adunit-xxx', interstitial: 'adunit-yyy' }
 * @returns {Promise<boolean>} true=播放完成/无需播放, false=用户中途关闭
 */
function showAd(adType, adUnits) {
  if (!adType || adType === 'none') {
    return Promise.resolve(true)
  }
  if (adType === 'rewarded') {
    return showRewardedVideo(adUnits && adUnits.rewarded)
  }
  if (adType === 'interstitial') {
    return showInterstitial(adUnits && adUnits.interstitial)
  }
  return Promise.resolve(true)
}

module.exports = {
  showRewardedVideo,
  showInterstitial,
  showAd,
}
