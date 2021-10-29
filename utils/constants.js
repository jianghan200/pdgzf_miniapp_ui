const prodServer = 'https://pdgzf.vencloud.cn'
const qaServer = 'https://pdgzfqa.vencloud.cn'
const hkServer = 'http://hk.han.pm:9908'
const userinfoQaServer = 'https://api.pdgzfqa.vencloud.cn'
const userinfoProdServer = 'https://api.pdgzf.vencloud.cn'
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

const emailRegex = /[a-z0-9-.]{1,30}@[a-z0-9-]{1,65}.(com|net|org|info|biz|([a-z]{2,3}.[a-z]{2}))/;
const isEmail = str => {
  return emailRegex.test(str)
}

const vipSampleProjectId = 246635
// 2021-04-26
const vipStartDate = new Date(2021, 3, 26)

module.exports = {
  server: prodServer,
  userinfoServer: userinfoProdServer,
  allRoomTypes : [1,2,3,4,5,6,7,8],
  id2Type,
  isEmail : isEmail,
  vipPid : vipSampleProjectId,
  mockStartDate : vipStartDate
}