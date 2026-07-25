const prodServer = 'https://api.pdgzf.cn/api'
// const userinfoProdServer = 'https://api.pdgzf.cn/user_api'
const userinfoProdServer = 'https://api.pdgzf.cn'
const prodFeedbackServer = 'https://pdgzf.cn'
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
const rentableCountCategory = ['小于10套', '10 ~ 50', '50 ~ 100', '大于100套']
const rentableCountLimits = function(category) {
  let res = []
  switch(category) {
    case '小于10套':
      res = [0, 10]
      break;
    case '10 ~ 50':
      res = [10, 50]
      break;
    case '50 ~ 100':
      res = [50, 100]
      break;
    case '大于100套':
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

// 随机生成一个昵称
const  randomNikName= ['小宇宙爆发', '咸鱼翻身', '清风徐来', '夜色温柔', '白茶清欢', '星河入梦', '江海寄余生', '山海有归期', '人间理想', '满船清梦', '云边有个小卖部', '风月不相关', '热爱可抵岁月漫长', '人间白月光', '不负相思意', '雾散月明', '一身仙气', '孤独患者', '浪漫主义者', '热爱105°C的你', '银河落九天', '山有木兮', '四月是你的谎言', '风吹过的夏天', '南风知我意', '晚风与你', '满级小可爱', '盐味汽水', '竹马与青梅', '猫与海', '软软糯糯', '温柔野兽', '不羁先生', '白衬衫少年', '长街听风', '野猫南巷', '清酒暖风', '清茶煮雨', '一纸荒年', '人海拾荒', '青石上旧忆', '薄荷味拥抱', '仲夏夜之梦', '秋色连波', '冬日热红酒', '朝九晚五', '人间清醒', '城南花已开', '春风十里', '远山如黛', '月下独酌', '黑白棋局', '温酒与月', '星光沉醉', '拥抱太阳的月亮', '热烈且自由', '晴野栀子', '蓝鲸迷航', '云中漫步', '热忱如初', '偏爱与例外', '鹤见', '光年之外', '浪潮之巅', '不止于喜欢', '飞行家', '追风赶月', '无名之辈', '笑忘书', '风起长林', '风和日暖', '不必在意', '心上秋', '南桥以南', '北城以北', '月色真美', '以梦为马', '风带走云', '栀子花开', '温柔本身', '港岛妹妹', '独木桥上', '晚来天欲雪', '故人长绝', '第十三月', '清醒梦', '溺海不知归', '热爱生活', '认真且怂', '白日梦一号', '夜行的鲸', '等风也等你', '热巧克力', '奶油云朵', '青柠苏打', '柚子汽水', '乌龙桃桃', '椰子星球', '人间烟火气', '旧巷少年', '月与海', '风与酒', '孤岛惊魂', '山川皆无恙', '赤道与北极', '玫瑰少年', '披星戴月', '浪漫满屋', '晚星坠落', '追光者', '银河护卫', '时间旅人', '月球漫步', '森林木琴', '海盐冰激凌', '白露未晞', '清风不问归期', '风栖晚亭', '雁过无痕', '无事小神仙', '桃之夭夭', '松间月', '山雨欲来', '眉目成诗', '山楂味的秋天', '风起时想你', '可爱多多', '可乐不加冰', '糖果纸', '软糖骑士', '奶茶去冰半糖', '芝士葡萄', '榛子拿铁', '云雾缭绕', '木棉与海', '晚安行星', '春和景明', '听风说梦', '温柔一刀', '清醒且可爱', '糯米糍', '满分心动', '桃气满满', '野生甜', '今日份开心', '人间惊鸿客', '一眼误终生', '月亮邮差', '风的告白', '山海同路', '啵啵小熊', '甜野猫', '小王子', 'Captain Nemo', 'Wind Walker', 'Star Rover', 'Moonlighter', 'Night Coder', 'Paper Plane', 'Sky Painter', 'Cloud Chaser', 'Dream Catcher', 'Aurora Runner', 'Shadow Dancer', 'Misty Forest', 'Silent Ocean', 'Pixel Poet', 'Nebula Kid', 'Retro Rider', 'Coffee & Code', 'Bug Hunter', 'Light Seeker', 'Time Binder', 'Mr. Sunshine', 'Ms. Stardust', '北冥有鱼', '扶摇直上', '花开一春', '惊鸿一面', '秋水长天', '听风与我', '热望如初']

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
  randomNikName: randomNikName,
  officialAccount: officialAccount,
  vip_wp_category: vip_wp_category,
  excluded_wp_category_ids: do_not_display_wp_category_ids
}