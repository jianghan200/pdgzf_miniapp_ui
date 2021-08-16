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

    let todayProjects = wx.getStorageSync('todayProjects')
    if (todayProjects) {
      let pId = options.pid
      // flatMap
      let projects = []
      todayProjects.forEach(area => {
        projects = projects.concat(area.projects)
      })

      let theProject = projects.find(p => p.pId == pId)
      // 此小区的所有房屋的信息
      let housesInfo = 
        theProject.houses.map(house => {
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
        pName: theProject.pName,
        houses: housesInfo
      })
    }
  }
})