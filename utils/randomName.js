/* utils/avatarNick.js -------------------------------------------------- */
// MySQL CRC32 的纯 JS 实现（与 SELECT CRC32(?) 结果完全一致）
const CRC32_TABLE = (() => {
  const table = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;   // 与 MySQL 返回值一致
}

/* 与 SQL 逻辑完全对齐的生成函数 ----------------------------------------- */
function getRandomNameAndAvatar(userinfo, nicknamePool = []) {
  const unionId = userinfo.unionId;
  if (!unionId || !nicknamePool || !nicknamePool.length) {
    fallback(userinfo, nicknamePool);
    return;
  }

  const idx = Math.abs(crc32(unionId)) % 181;          // 对应 SQL: ABS(CRC32(u.union_id)%181)
  const suffix = Math.abs(crc32(unionId)) % 97;        // 对应 SQL: ABS(CRC32(u.union_id)%97)
  const avatarIdx = Math.abs(crc32(unionId)) % 1000;   // 对应 SQL: ABS(CRC32(u.union_id)%1000)

  userinfo.wxNickName = `${nicknamePool[idx]}${suffix}`;
  userinfo.wxAvatarUrl = `http://cdn.pdgzf.cn/upload/avatars/png/avatar${avatarIdx}.png`;
}

/* 兜底：无 unionId 或池子为空时随机 */
function fallback(userinfo, nicknamePool) {
  const name = (nicknamePool && nicknamePool.length)
    ? nicknamePool[Math.floor(Math.random() * nicknamePool.length)]
    : '微信用户';
  userinfo.wxNickName = `${name}${Math.floor(Math.random() * 100)}`;
  userinfo.wxAvatarUrl = 'http://cdn.pdgzf.cn/upload/avatars/png/avatar0.png';
}

module.exports = { getRandomNameAndAvatar };