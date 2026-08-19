Component({
  properties: {
    size: { type: Number, value: 120 },
    color: { type: String, value: '' }
  },

  lifetimes: {
    attached() {
      this._animating = false
      this._startedAt = 0
      this._rafId = null
    },
    ready() {
      this._initCanvas()
    },
    detached() {
      this._stopAnimation()
    }
  },

  methods: {
    _initCanvas() {
      const query = this.createSelectorQuery()
      query.select('#roseCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = wx.getWindowInfo().pixelRatio || 2
          const w = res[0].width
          const h = res[0].height

          canvas.width = w * dpr
          canvas.height = h * dpr
          ctx.scale(dpr, dpr)

          this._canvas = canvas
          this._ctx = ctx
          this._w = w
          this._h = h
          this._startedAt = Date.now()
          this._animating = true
          this._renderLoop()
        })
    },

    _stopAnimation() {
      this._animating = false
      if (this._rafId && this._canvas) {
        this._canvas.cancelAnimationFrame(this._rafId)
        this._rafId = null
      }
    },

    // 玫瑰曲线参数
    _getConfig() {
      return {
        particleCount: 120,
        trailSpan: 0.45,
        durationMs: 10800,
        rotationDurationMs: 28000,
        pulseDurationMs: 4600,
        strokeWidth: 8,
        roseA: 9.2,
        roseABoost: 0.6,
        roseBreathBase: 0.72,
        roseBreathBoost: 0.28,
        roseK: 5,
        roseScale: 3.25
      }
    },

    _point(progress, detailScale, cfg) {
      const t = progress * Math.PI * 2
      const a = cfg.roseA + detailScale * cfg.roseABoost
      const k = Math.round(cfg.roseK)
      const r = a * (cfg.roseBreathBase + detailScale * cfg.roseBreathBoost) * Math.cos(k * t)
      return {
        x: 50 + Math.cos(t) * r * cfg.roseScale,
        y: 50 + Math.sin(t) * r * cfg.roseScale
      }
    },

    _getDetailScale(time, pulseDurationMs) {
      const pulseProgress = (time % pulseDurationMs) / pulseDurationMs
      const pulseAngle = pulseProgress * Math.PI * 2
      return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48
    },

    _getRotation(time, rotationDurationMs, rotate) {
      if (!rotate) return 0
      return -((time % rotationDurationMs) / rotationDurationMs) * 360
    },

    _buildPath(detailScale, cfg, scale) {
      const steps = 240
      const points = []
      for (let i = 0; i <= steps; i++) {
        const pt = this._point(i / steps, detailScale, cfg)
        points.push({ x: pt.x * scale, y: pt.y * scale })
      }
      return points
    },

    _getParticle(index, progress, detailScale, cfg, scale) {
      const tailOffset = index / (cfg.particleCount - 1)
      const pProgress = ((progress - tailOffset * cfg.trailSpan) % 1 + 1) % 1
      const pt = this._point(pProgress, detailScale, cfg)
      const fade = Math.pow(1 - tailOffset, 0.4)
      return {
        x: pt.x * scale,
        y: pt.y * scale,
        radius: 6.0 + fade * 12.0,
        opacity: 0.05 + fade * 0.85
      }
    },

    // 根据索引生成彩色（HSL）
    _hueColor(hue, alpha) {
      return `hsla(${hue}, 85%, 60%, ${alpha})`
    },

    _renderLoop() {
      if (!this._animating || !this._canvas) return
      const canvas = this._canvas
      const ctx = this._ctx
      const cfg = this._getConfig()
      const w = this._w
      const h = this._h
      const scale = w / 100
      const now = Date.now()
      const time = now - this._startedAt

      const progress = (time % cfg.durationMs) / cfg.durationMs
      const detailScale = this._getDetailScale(time, cfg.pulseDurationMs)
      const rotation = this._getRotation(time, cfg.rotationDurationMs, true)

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-w / 2, -h / 2)

      // 绘制彩色半透明玫瑰曲线
      const pathPoints = this._buildPath(detailScale, cfg, scale)
      ctx.lineWidth = cfg.strokeWidth * (w / 420)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < pathPoints.length; i++) {
        const hue = (i / pathPoints.length) * 360
        ctx.beginPath()
        ctx.strokeStyle = this._hueColor(hue, 0.18)
        ctx.moveTo(pathPoints[i - 1].x, pathPoints[i - 1].y)
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y)
        ctx.stroke()
      }

      // 绘制彩色粒子拖尾
      for (let i = 0; i < cfg.particleCount; i++) {
        const particle = this._getParticle(i, progress, detailScale, cfg, scale)
        const hue = ((i / cfg.particleCount) * 360 + progress * 360) % 360
        ctx.beginPath()
        ctx.fillStyle = this._hueColor(hue, particle.opacity)
        ctx.arc(particle.x, particle.y, particle.radius * (w / 420), 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      this._rafId = canvas.requestAnimationFrame(() => {
        this._renderLoop()
      })
    }
  }
})
