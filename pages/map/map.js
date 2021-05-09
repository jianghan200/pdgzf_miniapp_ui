// var qqMap = require('../../tencentMap/qqmap-wx-jssdk')
// var qqmapsdk;
let app = getApp()

Page({
  data: {
    selfLatitude: 31.23037,
    selfLongitude: 121.4737,
    markers: []
  },

  onLoad() {
    let self = this

    wx.getLocation({
      type: "wgs84",
      success: function (res) {
        var latitude = res.latitude
        var longitude = res.longitude

        console.log("当前位置的经纬度为：", latitude, longitude)

        self.setData({
          selfLatitude: latitude,
          selfLongitude: longitude,
        })
      }
    })

    let rawData = wx.getStorageSync('projects')

    if (rawData) {
      console.log(rawData)

      let newMarkers = self.data.markers
      
      for (let i = 0; i < rawData.length; i++) {
        let entry = rawData[i]
        let marker = {
          id: i,
          title: entry.name,
          iconPath: '/assets/coordinate.jpeg',
          latitude: entry.latitude,
          longitude: entry.longitude,
          width: 28,
          height: 32
        }
        newMarkers.push(marker)
      }

      self.setData({
        markers: newMarkers
      })
    }
  }
})