const app = getApp()

Component({
  properties: {
    tab: String,
    unreadCount: {
      type: Number,
      value: 0
    }
  },

  methods: {
    switchTab(e) {
      this.triggerEvent('switchtab', e.currentTarget.dataset.tabname)
    }
  }
})