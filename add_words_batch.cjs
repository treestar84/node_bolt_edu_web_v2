const fs = require('fs');
const crypto = require('crypto');
const path = 'server/data/words.json';
let words = [];
try {
  words = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch {
  words = [];
}
const now = new Date().toISOString();
const uuid = () => crypto.randomUUID();
const add = (name, nameEn, category) => ({
  id: uuid(),
  name,
  nameEn,
  imageUrl: `https://placehold.co/200x200?text=${encodeURIComponent(nameEn)}`,
  audioKo: '',
  audioEn: '',
  category,
  minAge: 3,
  maxAge: 6,
  ownerType: 'global',
  createdAt: now,
  updatedAt: now
});
const newWordsRaw = [
  ['공','ball','toys'],
  ['곰인형','teddy bear','toys'],
  ['블록','blocks','toys'],
  ['퍼즐','puzzle','toys'],
  ['로봇','robot','toys'],
  ['장난감 전화기','toy phone','toys'],
  ['인형','doll','toys'],
  ['토끼','rabbit','animals'],
  ['코끼리','elephant','animals'],
  ['사자','lion','animals'],
  ['오리','duck','animals'],
  ['물고기','fish','animals'],
  ['닭','chicken','animals'],
  ['기차','train','vehicles'],
  ['비행기','airplane','vehicles'],
  ['헬리콥터','helicopter','vehicles'],
  ['자전거','bicycle','vehicles']
];
let added = 0, skipped = 0, errors = 0;
for (const [k, e, c] of newWordsRaw) {
  try {
    if (words.find(w => w.name === k && w.nameEn === e && w.category === c)) {
      skipped++;
      continue;
    }
    words.push(add(k, e, c));
    added++;
  } catch (err) {
    errors++;
    console.error('❌ 등록 실패:', k, e, c, err.message);
  }
}
fs.writeFileSync(path, JSON.stringify(words, null, 2));
console.log(`단어 자동 등록 완료: ${added}개, 중복 스킵: ${skipped}개, 에러: ${errors}개`); 