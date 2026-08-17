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
    }

    const handleClose = (res) => {
      ad.offClose(handleClose)
      ad.offError(handleError)
      if (res && res.isEnded) {
        resolve(true)
      } else {
        resolve(false)
      }
    }
    const handleError = (err) => {
      ad.offClose(handleClose)
      ad.offError(handleError)
      log.error('激励视频广告错误', err)
      reject(err)
    }

    ad.onClose(handleClose)
    ad.onError(handleError)

    ad.show().catch(() => {
      ad.load().then(() => ad.show()).catch(handleError)
    })
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
    }

    const handleClose = () => {
      ad.offClose(handleClose)
      ad.offError(handleError)
      resolve(true)
    }
    const handleError = (err) => {
      ad.offClose(handleClose)
      ad.offError(handleError)
      log.error('插屏广告错误', err)
      reject(err)
    }

    ad.onClose(handleClose)
    ad.onError(handleError)

    ad.show().catch(() => {
      ad.load().then(() => ad.show()).catch(handleError)
    })
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
