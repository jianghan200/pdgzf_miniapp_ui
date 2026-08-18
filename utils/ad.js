// 广告工具：激励视频 + 插屏广告
// adUnitId 从 /gate/config 接口下发，不写死
// 注意：微信激励视频广告实例建议按次创建，复用实例在旧机型/旧版本微信上容易出现
// "operateVideoPlayer:fail:internal error" 等内部错误，因此每次播放新建实例。

const log = require('./log')

/**
 * 播放激励视频广告
 * @param {string} adUnitId
 * @returns {Promise<boolean>} true=看完, false=中途关闭
 */
function showRewardedVideo(adUnitId) {
  return new Promise((resolve, reject) => {
    if (!adUnitId) {
      reject(new Error('广告位未配置'))
      return
    }

    // 每次播放创建新实例，避免旧实例状态残留导致 internal error
    const ad = wx.createRewardedVideoAd({ adUnitId })
    let settled = false
    let attempts = 0
    const MAX_ATTEMPTS = 2

    const cleanup = () => {
      try {
        ad.offClose(handleClose)
        ad.offError(handleError)
        // 销毁实例，释放播放器资源
        if (typeof ad.destroy === 'function') {
          ad.destroy()
        }
      } catch (e) {}
    }

    const handleClose = (res) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(!!(res && res.isEnded))
    }

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

    const attempt = () => {
      ad.load()
        .then(() => ad.show())
        .catch((err) => {
          log.error('激励视频广告 load/show 失败，准备重试', err)
          if (attempts >= MAX_ATTEMPTS) {
            fail(new Error('激励视频广告加载失败'))
            return
          }
          attempts++
          // 简单延时后再重试，避免旧机型上立即重试触发内部错误
          setTimeout(attempt, 300)
        })
    }

    attempt()
  })
}

/**
 * 播放插屏广告
 * @param {string} adUnitId
 * @returns {Promise<boolean>}
 */
function showInterstitial(adUnitId) {
  return new Promise((resolve, reject) => {
    if (!adUnitId) {
      reject(new Error('插屏广告位未配置'))
      return
    }

    const ad = wx.createInterstitialAd({ adUnitId })
    let settled = false
    let attempts = 0
    const MAX_ATTEMPTS = 2

    const cleanup = () => {
      try {
        ad.offClose(handleClose)
        ad.offError(handleError)
        if (typeof ad.destroy === 'function') {
          ad.destroy()
        }
      } catch (e) {}
    }

    const handleClose = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(true)
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

    const attempt = () => {
      ad.load()
        .then(() => ad.show())
        .catch((err) => {
          log.error('插屏广告 load/show 失败，准备重试', err)
          if (attempts >= MAX_ATTEMPTS) {
            fail(new Error('插屏广告加载失败'))
            return
          }
          attempts++
          setTimeout(attempt, 300)
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
