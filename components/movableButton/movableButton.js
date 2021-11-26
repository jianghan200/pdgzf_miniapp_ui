Component({
  properties: {
    name : '',
    cuIcon : '',
    targetPath : ''
  },

  data: {
  },

  methods: {
    gotoReport(e) {
      wx.navigateTo({
        url: this.properties.targetPath,
      })
    }
  }
})