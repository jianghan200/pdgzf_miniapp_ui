const constants = require('../../utils/constants')

Page({
  data: {
    pName: '',
    houses: [
      {
        name: '',
        rent: 0,
        size: 1.0,
        type: ''
      }
    ]
  },

  onLoad: function (options) {
    let self = this

    let projects = wx.getStorageSync('houses')
    if (projects) {
      console.log(projects)

      let pId = options.pid
      let project = projects.find(elem => elem.pId == pId)
      let housesInfo = project.houses.map(house => {
        let pieces = house.fullName.split('/')
        pieces.splice(0, 1)
        let betterName = pieces.join('/')
        let houseInfo = {
          name: betterName,
          rent: house.rent,
          size: house.area,
          type: constants.id2Type(house.typeName)
        }
        return houseInfo
      })

      self.setData({
        pName: project.pName,
        houses: housesInfo
      })
    }
  }
})