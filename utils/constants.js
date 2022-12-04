const prodServer = 'https://pdgzf.vencloud.cn/api'
const qaServer = 'https://pdgzfqa.vencloud.cn'
const hkServer = 'http://hk.han.pm:9908'
const userinfoQaServer = 'https://api.pdgzfqa.vencloud.cn'
const userinfoProdServer = 'https://pdgzf.vencloud.cn/user_api'
const prodFeedbackServer = 'https://pd.vencloud.cn'
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

// 浦江海德
const vipSampleProjectId = 349481
// 2021-04-26
const vipStartDate = new Date(2021, 3, 26)

// allProjects页使用的小区房间数区间
const rentableCountCategory = ['小于10', '10 ~ 50', '50 ~ 100', '大于100']
const rentableCountLimits = function(category) {
  let res = []
  switch(category) {
    case '小于10':
      res = [0, 10]
      break;
    case '10 ~ 50':
      res = [10, 50]
      break;
    case '50 ~ 100':
      res = [50, 100]
      break;
    case '大于100':
      res = [100, 10000]
      break;
    default:
      res = []
  }
  return res
}

const vipJiraTypes = ['新功能', '改进', '举报Bug']
const commonJiratypes = ['改进', '举报Bug']

// 微信号
const consultant = 'meo365'

// 公租房受理中心的地址（腾讯地图坐标系）
const officeCoordinate = {
  lng: 121.51972900889912,
  lat: 31.180158541429936,
  address: '上海市浦东新区浦三路930弄'
}

// 随机生成一个用户名
const guanLanGaoShou = ['樱木花道(Sakuragi Hanamichi)', '流川枫(Rukawa Kaede)', '赤木刚宪(Takenori Akagi)', '三井 寿(Hisashi Mitsui)', '宫城良田 (Ryouta Miyagi)', '井上 彩子(Inoue Ayako)', '赤木 晴子(Haruko Akagi )', '木暮公延(Kiminobu Kogure)', '牧绅一(SHINICHI MAKI)', '神宗一郎(SOICHIROJIN)', '清田信长(NOBUNGAKIYOTA)', '田冈茂一(MOICHITAOKA)', '鱼住纯(JUNUOZUMI)', '福田吉兆(Kicchou Fukuda)', '越野宏明(Hiroaki Koshino)', '相田彦一(Hikoichi Aida)', '藤真健司(Kenji Fujima)', '花形透(Touru Hanagata)', '青田龙彦(Tatsuhiko Aota)', '水户洋平(Youhei Mitou)']

const aot = ['艾伦·耶格尔', '韩吉·佐耶', '三笠·阿克曼', '利威尔·阿克曼', '阿明·阿诺德', '莱纳·布朗', '希琪·德利斯', '马可·博特', '尤弥尔', '奇行种', '萨莎·布劳斯', '康尼·斯普林格', '让·基尔希斯坦', '贝特霍尔德·胡佛', '埃尔文·史密斯', '亚妮·雷恩哈特', '吉克·耶格尔', '皮克小姐姐']

const deathNotes = ['夜神月(Light Yagami)', 'Ryuk', '弥·海莎(Misa Amane)', 'Rem', 'L']

var usernames = guanLanGaoShou.concat(aot).concat(deathNotes)

// 洗牌
const shuffleUsernames = function(array) {
  let len = array.length;
  for (let i = len - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 伪随机即可，真随机影响速度
const randomUserName = function() {
  shuffleUsernames(usernames)
  shuffleUsernames(usernames)
  shuffleUsernames(usernames)
  return usernames[0]
}

// 公众号的名称
const officialAccount = 'PD生活'

// WP文章中VIP内容的ID
const vip_wp_category = 18

// WP文章中不能显示的类别
const do_not_display_wp_category_ids = [8, 5, 2, 18]

module.exports = {
  server: prodServer,
  userinfoServer: userinfoProdServer,
  allRoomTypes : [1,2,3,4,5,6,7,8],
  id2Type,
  isEmail : isEmail,
  vipPid : vipSampleProjectId,
  mockStartDate : vipStartDate,
  rentableCountCategory : rentableCountCategory,
  rentableCountLimits : rentableCountLimits,
  vipJiraTypes : vipJiraTypes,
  commonJiratypes : commonJiratypes,
  prodFeedbackServer : prodFeedbackServer,
  consultant : consultant,
  officeCoordinate: officeCoordinate,
  randomUserName: randomUserName,
  officialAccount: officialAccount,
  vip_wp_category: vip_wp_category,
  excluded_wp_category_ids: do_not_display_wp_category_ids
}