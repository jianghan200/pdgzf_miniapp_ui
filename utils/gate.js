// 内容门槛（gate）前端工具
// 封装 /gate/config /gate/status /gate/unlock /ab/event 接口

const market = require('./market')
const ad = require('./ad')

let _cachedConfig = null
let _configPromise = null

function getGateConfig(forceRefresh) {
  if (_cachedConfig && !forceRefresh) {
    return Promise.resolve(_cachedConfig)
  }
  if (_configPromise && !forceRefresh) {
    return _configPromise
  }
  _configPromise = market.getGateConfig().then((res) => {
    if (res && res.status === 0 && res.data) {
      _cachedConfig = res.data
      return res.data
    }
    return {
      enabled: false,
      gates: {},
      ad_units: {},
      ab: { enabled: false, variants: {} },
    }
  }).catch(() => {
    return { enabled: false, gates: {}, ad_units: {}, ab: { enabled: false, variants: {} } }
  }).finally(() => {
    _configPromise = null
  })
  return _configPromise
}

function getGateStatus(houseId) {
  return market.getGateStatus(houseId).then((res) => {
    if (res && res.status === 0 && res.data) {
      return res.data
    }
    return {
      price: { visible: true, ad_type: 'none' },
      description: { visible: true, ad_type: 'none' },
      chat: { visible: true, ad_type: 'none' },
    }
  })
}

/**
 * 解锁指定房源（看完广告后调用）
 */
function unlockGate(houseId, adType) {
  return market.unlockGate({ house_id: houseId, ad_type: adType || 'rewarded' })
    .then((res) => !!(res && res.status === 0))
    .catch(() => false)
}

/**
 * 播放广告 + 解锁，一步到位
 * @param {number} houseId
 * @param {string} gateType - 'price' | 'description' | 'chat'
 * @returns {Promise<boolean>} true=解锁成功
 */
function watchAdAndUnlock(houseId, gateType) {
  return getGateConfig().then((cfg) => {
    if (!cfg.enabled) return true
    const gateCfg = cfg.gates && cfg.gates[gateType]
    if (!gateCfg || !gateCfg.enabled) return true

    let adType = gateCfg.ad_type || 'rewarded'
    if (cfg.ab && cfg.ab.enabled && cfg.ab.variants && cfg.ab.variants.gate_ad_type) {
      adType = cfg.ab.variants.gate_ad_type
    }

    reportAbEvent({
      experiment: 'gate_ad_type',
      variant: adType,
      event_type: 'ad_show',
      house_id: houseId,
      gate_type: gateType,
    })

    return ad.showAd(adType, cfg.ad_units).then((completed) => {
      if (!completed) {
        reportAbEvent({
          experiment: 'gate_ad_type',
          variant: adType,
          event_type: 'ad_error',
          house_id: houseId,
          gate_type: gateType,
        })
        return false
      }
      reportAbEvent({
        experiment: 'gate_ad_type',
        variant: adType,
        event_type: 'ad_complete',
        house_id: houseId,
        gate_type: gateType,
      })
      return unlockGate(houseId, adType).then((ok) => {
        if (ok) {
          reportAbEvent({
            experiment: 'gate_ad_type',
            variant: adType,
            event_type: 'gate_unlock',
            house_id: houseId,
            gate_type: gateType,
          })
        }
        return ok
      })
    })
  })
}

function reportAbEvent(data) {
  market.reportAbEvent(data).catch(() => {})
}

module.exports = {
  getGateConfig,
  getGateStatus,
  unlockGate,
  watchAdAndUnlock,
  reportAbEvent,
}
