const server = 'http://jp.han.pm:9908'
const ROOM_TYPE = ["未知", "一室", "一室一厅", "两室", "两室一厅", "三室", "三室一厅", "四室", "五室"]
const id2Type = id => {
  let res = ''
  switch(id) {
    case 0:
      res = ROOM_TYPE[0]
      break
    case 1:
      res = ROOM_TYPE[1]
      break
    case 2:
      res = ROOM_TYPE[2]
      break
    case 3:
      res = ROOM_TYPE[3]
      break
    case 4:
      res = ROOM_TYPE[4]
      break
    case 5:
      res = ROOM_TYPE[5]
      break
    case 6:
      res = ROOM_TYPE[6]
      break
    case 7:
      res = ROOM_TYPE[7]
      break
    case 8:
      res = ROOM_TYPE[8]
      break
    default:
      res = ROOM_TYPE[0]
  }

  return res
}

module.exports = {
  server,
  id2Type
}