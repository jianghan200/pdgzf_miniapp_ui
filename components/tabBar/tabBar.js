Component({
  properties: {
    tab: String
  },

  data: {
  },

  methods: {
    switchTab(e) {
      this.triggerEvent('switchtab', e.currentTarget.dataset.tabname)
    }
  }
})