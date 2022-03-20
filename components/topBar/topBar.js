// components/topBar.js
Component({
  properties: {
    tab: String
  },

  methods: {
    onSwitchTab(e) {
      this.triggerEvent('switchdiscoverytab', e.currentTarget.dataset.tabname)
    }
  }
})
