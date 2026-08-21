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
          const w = this.data.size || 120
          const h = this.data.size || 120
          const dpr = Math.min(wx.getWindowInfo().pixelRatio || 2, 3)

          canvas.width = w * dpr
          canvas.height = h * dpr
          ctx.scale(dpr, dpr)

          this._canvas = canvas
          this._ctx = ctx
          this._w = w
          this._h = h
          this._dpr = dpr
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

    _getConfig() {
      return {
        particleCount: 1200,
        trailSpan: 0.45,
        durationMs: 10800,
        rotationDurationMs: 28000,
        pulseDurationMs: 4600,
        strokeWidth: 3,
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
        radius: 2.0 + fade * 5.0,
        opacity: 0.15 + fade * 0.65
      }
    },

    // 三色渐变：亮粉 → 天青 → 柠檬黄
    _triColor(t, alpha) {
      const colors = [
        [255, 45, 120],    // 亮粉 #FF2D78
        [0, 212, 255],     // 天青 #00D4FF
        [255, 230, 0]      // 柠檬黄 #FFE600
      ]
      const seg = t * 2
      const i = Math.min(Math.floor(seg), 1)
      const f = seg - i
      const c0 = colors[i], c1 = colors[i + 1]
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f)
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f)
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f)
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
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

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(this._dpr, this._dpr)

      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-w / 2, -h / 2)

      // 绘制多巴胺三色玫瑰曲线
      const pathPoints = this._buildPath(detailScale, cfg, scale)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = cfg.strokeWidth * (w / 120)
      for (let i = 1; i < pathPoints.length; i++) {
        const t = i / pathPoints.length
        const alpha = 0.25 + Math.sin(t * Math.PI) * 0.35
        ctx.beginPath()
        ctx.strokeStyle = this._triColor(t, alpha)
        ctx.moveTo(pathPoints[i - 1].x, pathPoints[i - 1].y)
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y)
        ctx.stroke()
      }

      // 绘制多巴胺三色粒子拖尾
      for (let i = 0; i < cfg.particleCount; i++) {
        const particle = this._getParticle(i, progress, detailScale, cfg, scale)
        const t = ((i / cfg.particleCount) + progress) % 1
        ctx.beginPath()
        ctx.fillStyle = this._triColor(t, particle.opacity)
        ctx.arc(particle.x, particle.y, particle.radius * (w / 120), 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      this._rafId = canvas.requestAnimationFrame(() => {
        this._renderLoop()
      })
    }
  }
})
