/**
 * 语文考点知识库 + 模板化出题
 * 基于人教版一年级上下册、二年级上下册核心考点
 * 数据落点：前端知识库 + localStorage 缓存（首次生成存下，手动重生成）
 */

import type { Chapter, Question, GradeId } from '@/data/chapters'

// ===== 基础工具 =====
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
/** 从候选中生成干扰项，保证不含正确答案 */
function makeDistractors(correct: string, pool: string[], count: number): string[] {
  const set = new Set(pool.filter(p => p !== correct))
  const res: string[] = []
  for (const s of shuffle(Array.from(set))) {
    if (res.length >= count) break
    res.push(s)
  }
  // 池子不够时补随机汉字
  const filler = ['天', '地', '人', '口', '手', '水', '火', '木', '山', '石', '田', '土']
  while (res.length < count) {
    const f = filler[randInt(0, filler.length - 1)]
    if (f !== correct && !res.includes(f)) res.push(f)
  }
  return shuffle(res).slice(0, count)
}

// ===== 一、生字词库（看拼音写词语 / 字音字形）=====
export interface WordEntry {
  word: string      // 汉字
  pinyin: string    // 全拼（无声调或带声调均可，仅作题干/答案）
  strokeOrder?: string // 易错笔顺提示
  grade: GradeId
}
export const wordBank: WordEntry[] = [
  // 一年级上册 识字（一）
  { word: '天', pinyin: 'tiān', grade: 'grade1-up' },
  { word: '地', pinyin: 'dì', grade: 'grade1-up' },
  { word: '人', pinyin: 'rén', grade: 'grade1-up' },
  { word: '你', pinyin: 'nǐ', grade: 'grade1-up' },
  { word: '我', pinyin: 'wǒ', grade: 'grade1-up' },
  { word: '他', pinyin: 'tā', grade: 'grade1-up' },
  { word: '一', pinyin: 'yī', grade: 'grade1-up' },
  { word: '二', pinyin: 'èr', grade: 'grade1-up' },
  { word: '三', pinyin: 'sān', grade: 'grade1-up' },
  { word: '上', pinyin: 'shàng', strokeOrder: '竖、横、横', grade: 'grade1-up' },
  { word: '口', pinyin: 'kǒu', grade: 'grade1-up' },
  { word: '目', pinyin: 'mù', strokeOrder: '竖、横折、横、横、横', grade: 'grade1-up' },
  { word: '耳', pinyin: 'ěr', grade: 'grade1-up' },
  { word: '手', pinyin: 'shǒu', strokeOrder: '撇、横、横、竖钩', grade: 'grade1-up' },
  { word: '火', pinyin: 'huǒ', strokeOrder: '点、撇、撇、捺', grade: 'grade1-up' },
  // 一年级上册 识字（二）
  { word: '日', pinyin: 'rì', grade: 'grade1-up' },
  { word: '月', pinyin: 'yuè', grade: 'grade1-up' },
  { word: '水', pinyin: 'shuǐ', grade: 'grade1-up' },
  { word: '山', pinyin: 'shān', grade: 'grade1-up' },
  { word: '石', pinyin: 'shí', grade: 'grade1-up' },
  { word: '田', pinyin: 'tián', grade: 'grade1-up' },
  { word: '禾', pinyin: 'hé', grade: 'grade1-up' },
  { word: '对', pinyin: 'duì', grade: 'grade1-up' },
  { word: '云', pinyin: 'yún', grade: 'grade1-up' },
  { word: '雨', pinyin: 'yǔ', grade: 'grade1-up' },
  { word: '风', pinyin: 'fēng', grade: 'grade1-up' },
  { word: '花', pinyin: 'huā', grade: 'grade1-up' },
  // 一年级下册 识字（一）
  { word: '春', pinyin: 'chūn', strokeOrder: '横、横、横、撇、捺、竖、横折、横、横', grade: 'grade1-down' },
  { word: '冬', pinyin: 'dōng', grade: 'grade1-down' },
  { word: '雪', pinyin: 'xuě', strokeOrder: '横、点、横撇、竖、点、点、点、点、横折、横、横', grade: 'grade1-down' },
  { word: '飞', pinyin: 'fēi', grade: 'grade1-down' },
  { word: '入', pinyin: 'rù', strokeOrder: '撇、捺', grade: 'grade1-down' },
  { word: '姓', pinyin: 'xìng', grade: 'grade1-down' },
  { word: '什', pinyin: 'shén', grade: 'grade1-down' },
  { word: '么', pinyin: 'me', grade: 'grade1-down' },
  { word: '双', pinyin: 'shuāng', strokeOrder: '横撇、点、横撇、点', grade: 'grade1-down' },
  { word: '国', pinyin: 'guó', strokeOrder: '竖、横折、横、横、竖、横、点、横', grade: 'grade1-down' },
  { word: '方', pinyin: 'fāng', strokeOrder: '点、横、横折钩、撇', grade: 'grade1-down' },
  { word: '青', pinyin: 'qīng', grade: 'grade1-down' },
  { word: '清', pinyin: 'qīng', grade: 'grade1-down' },
  { word: '晴', pinyin: 'qíng', grade: 'grade1-down' },
  { word: '情', pinyin: 'qíng', grade: 'grade1-down' },
  { word: '请', pinyin: 'qǐng', grade: 'grade1-down' },
  // 一年级下册 心愿
  { word: '吃', pinyin: 'chī', grade: 'grade1-down' },
  { word: '叫', pinyin: 'jiào', grade: 'grade1-down' },
  { word: '主', pinyin: 'zhǔ', grade: 'grade1-down' },
  { word: '江', pinyin: 'jiāng', grade: 'grade1-down' },
  { word: '住', pinyin: 'zhù', grade: 'grade1-down' },
  { word: '没', pinyin: 'méi', grade: 'grade1-down' },
  { word: '以', pinyin: 'yǐ', grade: 'grade1-down' },
  { word: '会', pinyin: 'huì', grade: 'grade1-down' },
  { word: '走', pinyin: 'zǒu', strokeOrder: '横、竖、横、竖、横、撇、捺', grade: 'grade1-down' },
  { word: '北', pinyin: 'běi', strokeOrder: '竖、横、提、撇、竖弯钩', grade: 'grade1-down' },
  { word: '京', pinyin: 'jīng', grade: 'grade1-down' },
  { word: '门', pinyin: 'mén', grade: 'grade1-down' },
  { word: '广', pinyin: 'guǎng', strokeOrder: '点、横、撇', grade: 'grade1-down' },
  { word: '过', pinyin: 'guò', grade: 'grade1-down' },
  { word: '各', pinyin: 'gè', strokeOrder: '撇、横撇、捺、竖、横折、横', grade: 'grade1-down' },
  { word: '种', pinyin: 'zhǒng', grade: 'grade1-down' },
  { word: '样', pinyin: 'yàng', strokeOrder: '横、竖、撇、点、点、撇、横、横、横、竖', grade: 'grade1-down' },
  // 一年级下册 家人
  { word: '思', pinyin: 'sī', strokeOrder: '竖、横折、横、竖、横、点、斜钩、点、点', grade: 'grade1-down' },
  { word: '床', pinyin: 'chuáng', grade: 'grade1-down' },
  { word: '前', pinyin: 'qián', grade: 'grade1-down' },
  { word: '光', pinyin: 'guāng', strokeOrder: '竖、点、撇、横、撇、竖弯钩', grade: 'grade1-down' },
  { word: '低', pinyin: 'dī', grade: 'grade1-down' },
  { word: '故', pinyin: 'gù', grade: 'grade1-down' },
  { word: '乡', pinyin: 'xiāng', grade: 'grade1-down' },
  { word: '色', pinyin: 'sè', grade: 'grade1-down' },
  { word: '外', pinyin: 'wài', grade: 'grade1-down' },
  { word: '看', pinyin: 'kàn', strokeOrder: '撇、横、横、撇、竖、横折、横、横、横', grade: 'grade1-down' },
  { word: '爸', pinyin: 'bà', grade: 'grade1-down' },
  { word: '晚', pinyin: 'wǎn', grade: 'grade1-down' },
  { word: '笑', pinyin: 'xiào', grade: 'grade1-down' },
  // 二年级上册 大自然的秘密
  { word: '两', pinyin: 'liǎng', grade: 'grade2-up' },
  { word: '宽', pinyin: 'kuān', grade: 'grade2-up' },
  { word: '孩', pinyin: 'hái', grade: 'grade2-up' },
  { word: '跳', pinyin: 'tiào', grade: 'grade2-up' },
  { word: '变', pinyin: 'biàn', grade: 'grade2-up' },
  { word: '极', pinyin: 'jí', strokeOrder: '横、竖、撇、点、撇、横折折撇、捺', grade: 'grade2-up' },
  { word: '片', pinyin: 'piàn', grade: 'grade2-up' },
  { word: '海', pinyin: 'hǎi', strokeOrder: '点、点、提、撇、横、竖折、横折钩、点、横、点', grade: 'grade2-up' },
  { word: '带', pinyin: 'dài', strokeOrder: '横、竖、竖、竖、点、横撇、竖、横折钩、竖、竖', grade: 'grade2-up' },
  { word: '法', pinyin: 'fǎ', grade: 'grade2-up' },
  { word: '如', pinyin: 'rú', grade: 'grade2-up' },
  { word: '知', pinyin: 'zhī', grade: 'grade2-up' },
  { word: '识', pinyin: 'shí', grade: 'grade2-up' },
  // 二年级上册 识字（场景歌/树之歌）
  { word: '园', pinyin: 'yuán', grade: 'grade2-up' },
  { word: '孔', pinyin: 'kǒng', grade: 'grade2-up' },
  { word: '桥', pinyin: 'qiáo', grade: 'grade2-up' },
  { word: '群', pinyin: 'qún', grade: 'grade2-up' },
  { word: '队', pinyin: 'duì', grade: 'grade2-up' },
  { word: '旗', pinyin: 'qí', grade: 'grade2-up' },
  { word: '铜', pinyin: 'tóng', grade: 'grade2-up' },
  { word: '号', pinyin: 'hào', grade: 'grade2-up' },
  { word: '杨', pinyin: 'yáng', grade: 'grade2-up' },
  { word: '桐', pinyin: 'tóng', grade: 'grade2-up' },
  { word: '松', pinyin: 'sōng', grade: 'grade2-up' },
  { word: '棉', pinyin: 'mián', grade: 'grade2-up' },
  { word: '枫', pinyin: 'fēng', grade: 'grade2-up' },
  { word: '桂', pinyin: 'guì', grade: 'grade2-up' },
  // 二年级上册 儿童生活
  { word: '称', pinyin: 'chēng', grade: 'grade2-up' },
  { word: '柱', pinyin: 'zhù', grade: 'grade2-up' },
  { word: '底', pinyin: 'dǐ', grade: 'grade2-up' },
  { word: '杆', pinyin: 'gǎn', grade: 'grade2-up' },
  { word: '秤', pinyin: 'chèng', grade: 'grade2-up' },
  { word: '做', pinyin: 'zuò', grade: 'grade2-up' },
  { word: '岁', pinyin: 'suì', grade: 'grade2-up' },
  { word: '站', pinyin: 'zhàn', grade: 'grade2-up' },
  { word: '船', pinyin: 'chuán', grade: 'grade2-up' },
  { word: '然', pinyin: 'rán', grade: 'grade2-up' },
  { word: '奖', pinyin: 'jiǎng', grade: 'grade2-up' },
  { word: '信', pinyin: 'xìn', grade: 'grade2-up' },
  { word: '今', pinyin: 'jīn', grade: 'grade2-up' },
  { word: '写', pinyin: 'xiě', grade: 'grade2-up' },
  { word: '圆', pinyin: 'yuán', grade: 'grade2-up' },
  { word: '珠', pinyin: 'zhū', grade: 'grade2-up' },
  { word: '笔', pinyin: 'bǐ', grade: 'grade2-up' },
  { word: '灯', pinyin: 'dēng', grade: 'grade2-up' },
  { word: '电', pinyin: 'diàn', grade: 'grade2-up' },
  { word: '影', pinyin: 'yǐng', grade: 'grade2-up' },
  // 二年级上册 家乡
  { word: '楼', pinyin: 'lóu', grade: 'grade2-up' },
  { word: '依', pinyin: 'yī', grade: 'grade2-up' },
  { word: '尽', pinyin: 'jìn', grade: 'grade2-up' },
  { word: '黄', pinyin: 'huáng', grade: 'grade2-up' },
  { word: '层', pinyin: 'céng', grade: 'grade2-up' },
  { word: '照', pinyin: 'zhào', grade: 'grade2-up' },
  { word: '炉', pinyin: 'lú', grade: 'grade2-up' },
  { word: '烟', pinyin: 'yān', grade: 'grade2-up' },
  { word: '挂', pinyin: 'guà', grade: 'grade2-up' },
  { word: '川', pinyin: 'chuān', grade: 'grade2-up' },
  { word: '南', pinyin: 'nán', grade: 'grade2-up' },
  { word: '部', pinyin: 'bù', grade: 'grade2-up' },
  { word: '些', pinyin: 'xiē', grade: 'grade2-up' },
  { word: '巨', pinyin: 'jù', grade: 'grade2-up' },
  { word: '位', pinyin: 'wèi', grade: 'grade2-up' },
  { word: '每', pinyin: 'měi', grade: 'grade2-up' },
  { word: '升', pinyin: 'shēng', grade: 'grade2-up' },
  { word: '闪', pinyin: 'shǎn', grade: 'grade2-up' },
  { word: '狗', pinyin: 'gǒu', grade: 'grade2-up' },
  // 二年级下册 春天
  { word: '脱', pinyin: 'tuō', grade: 'grade2-down' },
  { word: '袄', pinyin: 'ǎo', grade: 'grade2-down' },
  { word: '寻', pinyin: 'xún', grade: 'grade2-down' },
  { word: '姑', pinyin: 'gū', grade: 'grade2-down' },
  { word: '娘', pinyin: 'niáng', grade: 'grade2-down' },
  { word: '柳', pinyin: 'liǔ', grade: 'grade2-down' },
  { word: '桃', pinyin: 'táo', grade: 'grade2-down' },
  { word: '杏', pinyin: 'xìng', grade: 'grade2-down' },
  { word: '荡', pinyin: 'dàng', grade: 'grade2-down' },
  { word: '邮', pinyin: 'yóu', grade: 'grade2-down' },
  { word: '递', pinyin: 'dì', grade: 'grade2-down' },
  { word: '员', pinyin: 'yuán', grade: 'grade2-down' },
  { word: '原', pinyin: 'yuán', grade: 'grade2-down' },
  { word: '叔', pinyin: 'shū', grade: 'grade2-down' },
  { word: '局', pinyin: 'jú', grade: 'grade2-down' },
  { word: '堆', pinyin: 'duī', grade: 'grade2-down' },
  { word: '礼', pinyin: 'lǐ', grade: 'grade2-down' },
  // 二年级下册 爱心
  { word: '锋', pinyin: 'fēng', grade: 'grade2-down' },
  { word: '昨', pinyin: 'zuó', grade: 'grade2-down' },
  { word: '冒', pinyin: 'mào', grade: 'grade2-down' },
  { word: '留', pinyin: 'liú', grade: 'grade2-down' },
  { word: '弯', pinyin: 'wān', grade: 'grade2-down' },
  { word: '背', pinyin: 'bēi', grade: 'grade2-down' },
  { word: '洒', pinyin: 'sǎ', grade: 'grade2-down' },
  { word: '温', pinyin: 'wēn', grade: 'grade2-down' },
  { word: '暖', pinyin: 'nuǎn', grade: 'grade2-down' },
  { word: '能', pinyin: 'néng', grade: 'grade2-down' },
  { word: '桌', pinyin: 'zhuō', grade: 'grade2-down' },
  { word: '味', pinyin: 'wèi', grade: 'grade2-down' },
  { word: '买', pinyin: 'mǎi', grade: 'grade2-down' },
  { word: '具', pinyin: 'jù', grade: 'grade2-down' },
  { word: '甘', pinyin: 'gān', grade: 'grade2-down' },
  { word: '甜', pinyin: 'tián', grade: 'grade2-down' },
  { word: '菜', pinyin: 'cài', grade: 'grade2-down' },
  { word: '劳', pinyin: 'láo', grade: 'grade2-down' },
  // 二年级下册 传统文化
  { word: '州', pinyin: 'zhōu', grade: 'grade2-down' },
  { word: '华', pinyin: 'huá', grade: 'grade2-down' },
  { word: '岛', pinyin: 'dǎo', grade: 'grade2-down' },
  { word: '峡', pinyin: 'xiá', grade: 'grade2-down' },
  { word: '民', pinyin: 'mín', grade: 'grade2-down' },
  { word: '族', pinyin: 'zú', grade: 'grade2-down' },
  { word: '谊', pinyin: 'yì', grade: 'grade2-down' },
  { word: '齐', pinyin: 'qí', grade: 'grade2-down' },
  { word: '奋', pinyin: 'fèn', grade: 'grade2-down' },
  { word: '贴', pinyin: 'tiē', grade: 'grade2-down' },
  { word: '街', pinyin: 'jiē', grade: 'grade2-down' },
  { word: '舟', pinyin: 'zhōu', grade: 'grade2-down' },
  { word: '艾', pinyin: 'ài', grade: 'grade2-down' },
  { word: '敬', pinyin: 'jìng', grade: 'grade2-down' },
  { word: '转', pinyin: 'zhuǎn', grade: 'grade2-down' },
  { word: '团', pinyin: 'tuán', grade: 'grade2-down' },
  { word: '热', pinyin: 'rè', grade: 'grade2-down' },
  { word: '闹', pinyin: 'nào', grade: 'grade2-down' },
]

// ===== 二、拼音规则考点 =====
export const pinyinData = {
  singleFinals: ['a', 'o', 'e', 'i', 'u', 'ü'],
  initials: ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'],
  overall: ['zhi','chi','shi','ri','zi','ci','si','yi','wu','yu','ye','yue','yuan','yin','yun','ying'],
  // jqx 与 ü 相拼去两点
  jqxRules: [
    { jqx: 'j', withU: 'ü', result: 'ju', note: 'j 和 ü 相拼，ü 去掉两点' },
    { jqx: 'q', withU: 'ü', result: 'qu', note: 'q 和 ü 相拼，ü 去掉两点' },
    { jqx: 'x', withU: 'ü', result: 'xu', note: 'x 和 ü 相拼，ü 去掉两点' },
  ],
  tonePoem: '有 a 不放过，没 a 找 o e，i u 并列标在后',
}

// ===== 三、形声字 / 偏旁族 =====
export const phoneticFamilies: Record<string, {base: string, members: {char: string, meaning: string}[]}> = {
  qing: {
    base: '青',
    members: [
      { char: '清', meaning: '与水有关' },
      { char: '晴', meaning: '与日有关' },
      { char: '情', meaning: '与心有关' },
      { char: '请', meaning: '与言有关' },
      { char: '睛', meaning: '与目有关' },
    ],
  },
  ming: {
    base: '明',
    members: [
      { char: '明', meaning: '日+月，明亮' },
      { char: '林', meaning: '双木为林' },
      { char: '森', meaning: '三木为森' },
      { char: '从', meaning: '双人跟从' },
      { char: '众', meaning: '三人成众' },
    ],
  },
}

// ===== 四、词语搭配 / 量词 / 近反义 =====
export const measureWords: {noun: string, measure: string}[] = [
  { noun: '海鸥', measure: '只' }, { noun: '帆船', measure: '条' }, { noun: '鱼塘', measure: '方' },
  { noun: '稻田', measure: '块' }, { noun: '垂柳', measure: '行' }, { noun: '花园', measure: '座' },
  { noun: '小溪', measure: '道' }, { noun: '翠竹', measure: '丛' }, { noun: '队旗', measure: '面' },
  { noun: '铜号', measure: '把' }, { noun: '小蝌蚪', measure: '群' }, { noun: '大眼睛', measure: '对' },
  { noun: '桥', measure: '座' }, { noun: '花', measure: '朵' }, { noun: '月亮', measure: '轮' },
  { noun: '书', measure: '本' }, { noun: '大象', measure: '头' }, { noun: '墙', measure: '堵' },
  { noun: '信', measure: '封' }, { noun: '小路', measure: '条' }, { noun: '雪莲', measure: '朵' },
]
export const adjNounPairs: {adj: string, noun: string}[] = [
  { adj: '弯弯', noun: '的小路' }, { adj: '洁白', noun: '的雪莲' }, { adj: '大大', noun: '的脑袋' },
  { adj: '长长', noun: '的尾巴' }, { adj: '雪白', noun: '的肚皮' }, { adj: '雄伟', noun: '的天安门' },
  { adj: '宽宽', noun: '的公路' }, { adj: '青青', noun: '的假山' },
]
export const synAntPairs: {word: string, syn?: string, ant?: string}[] = [
  { word: '保护', syn: '爱护', ant: '破坏' },
  { word: '喜欢', syn: '喜爱', ant: '讨厌' },
  { word: '快活', syn: '快乐', ant: '难过' },
  { word: '长', syn: '', ant: '短' },
  { word: '温和', syn: '', ant: '暴躁' },
  { word: '高兴', syn: '开心', ant: '伤心' },
]
export const specialWords: {type: 'ABB'|'ABAC'|'AABB', examples: string[]}[] = [
  { type: 'ABB', examples: ['绿油油', '亮晶晶', '静悄悄', '黑沉沉', '红彤彤', '白花花'] },
  { type: 'ABAC', examples: ['游来游去', '飞来飞去', '走来走去', '自言自语', '无边无际'] },
  { type: 'AABB', examples: ['平平安安', '慌慌张张', '安安静静', '快快乐乐', '干干净净'] },
]

// ===== 五、多音字 =====
export const polyphones: {char: string, readings: {pinyin: string, meaning: string}[]}[] = [
  { char: '长', readings: [{ pinyin: 'cháng', meaning: '长短' }, { pinyin: 'zhǎng', meaning: '长大' }] },
  { char: '乐', readings: [{ pinyin: 'lè', meaning: '快乐' }, { pinyin: 'yuè', meaning: '音乐' }] },
  { char: '只', readings: [{ pinyin: 'zhī', meaning: '一只' }, { pinyin: 'zhǐ', meaning: '只有' }] },
  { char: '种', readings: [{ pinyin: 'zhǒng', meaning: '种子' }, { pinyin: 'zhòng', meaning: '种地' }] },
  { char: '觉', readings: [{ pinyin: 'jué', meaning: '感觉' }, { pinyin: 'jiào', meaning: '睡觉' }] },
  { char: '地', readings: [{ pinyin: 'dì', meaning: '土地' }, { pinyin: 'de', meaning: '轻轻地' }] },
  { char: '行', readings: [{ pinyin: 'xíng', meaning: '行走' }, { pinyin: 'háng', meaning: '银行' }] },
  { char: '好', readings: [{ pinyin: 'hǎo', meaning: '好人' }, { pinyin: 'hào', meaning: '爱好' }] },
  { char: '没', readings: [{ pinyin: 'méi', meaning: '没有' }, { pinyin: 'mò', meaning: '淹没' }] },
  { char: '教', readings: [{ pinyin: 'jiāo', meaning: '教书' }, { pinyin: 'jiào', meaning: '教室' }] },
]

// ===== 六、古诗 / 日积月累 =====
export interface Poem { title: string; author: string; lines: string[]; grade: GradeId }
export const poems: Poem[] = [
  { title: '咏鹅', author: '骆宾王', grade: 'grade1-up', lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'] },
  { title: '画', author: '王维', grade: 'grade1-up', lines: ['远看山有色，', '近听水无声。', '春去花还在，', '人来鸟不惊。'] },
  { title: '春晓', author: '孟浩然', grade: 'grade1-down', lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'] },
  { title: '静夜思', author: '李白', grade: 'grade1-down', lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'] },
  { title: '赠汪伦', author: '李白', grade: 'grade1-down', lines: ['李白乘舟将欲行，', '忽闻岸上踏歌声。', '桃花潭水深千尺，', '不及汪伦送我情。'] },
  { title: '寻隐者不遇', author: '贾岛', grade: 'grade1-down', lines: ['松下问童子，', '言师采药去。', '只在此山中，', '云深不知处。'] },
  { title: '梅花', author: '王安石', grade: 'grade2-up', lines: ['墙角数枝梅，', '凌寒独自开。', '遥知不是雪，', '为有暗香来。'] },
  { title: '登鹳雀楼', author: '王之涣', grade: 'grade2-up', lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'] },
  { title: '望庐山瀑布', author: '李白', grade: 'grade2-up', lines: ['日照香炉生紫烟，', '遥看瀑布挂前川。', '飞流直下三千尺，', '疑是银河落九天。'] },
  { title: '村居', author: '高鼎', grade: 'grade2-down', lines: ['草长莺飞二月天，', '拂堤杨柳醉春烟。', '儿童散学归来早，', '忙趁东风放纸鸢。'] },
  { title: '咏柳', author: '贺知章', grade: 'grade2-down', lines: ['碧玉妆成一树高，', '万条垂下绿丝绦。', '不知细叶谁裁出，', '二月春风似剪刀。'] },
]

// ===== 七、课文理解（主旨/道理）=====
export interface ReadingPoint { chapterId: string; question: string; answer: string; options: string[] }
export const readingPoints: ReadingPoint[] = [
  // 一年级下册
  { chapterId: 'ch1d-2', question: '《小青蛙》中“清、晴、情、请”都带有哪个字？', answer: '青', options: ['青', '生', '明'] },
  { chapterId: 'ch1d-2', question: '“清”字和什么有关？', answer: '水', options: ['水', '火', '土'] },
  { chapterId: 'ch1d-2', question: '“晴”字是什么旁？', answer: '日字旁', options: ['日字旁', '三点水', '言字旁'] },
  // 二年级上册
  { chapterId: 'ch2u-1', question: '小蝌蚪长大后变成了什么？', answer: '青蛙', options: ['青蛙', '乌龟', '大鱼'] },
  { chapterId: 'ch2u-1', question: '小蝌蚪先长出什么腿？', answer: '后腿', options: ['后腿', '前腿', '尾巴'] },
  { chapterId: 'ch2u-2', question: '《我是什么》中“我”可以变成什么？', answer: '水', options: ['水', '火', '风'] },
  { chapterId: 'ch2u-3', question: '《植物妈妈有办法》中蒲公英靠什么传播种子？', answer: '风', options: ['风', '动物', '太阳'] },
  { chapterId: 'ch2u-4', question: '一（ ）海鸥，填哪个量词？', answer: '只', options: ['只', '条', '座'] },
  { chapterId: 'ch2u-5', question: '“杨树高，榕树壮”写的是哪种树？', answer: '杨树和榕树', options: ['杨树和榕树', '松树和柏树', '柳树和桃树'] },
  { chapterId: 'ch2u-8', question: '《彩虹》中“我”想把秋千挂在彩虹上，表达了对谁的思念？', answer: '哥哥', options: ['哥哥', '爸爸', '老师'] },
  { chapterId: 'ch2u-11', question: '《登鹳雀楼》的作者是谁？', answer: '王之涣', options: ['王之涣', '李白', '杜甫'] },
  { chapterId: 'ch2u-12', question: '《望庐山瀑布》的作者是谁？', answer: '李白', options: ['李白', '杜甫', '白居易'] },
  { chapterId: 'ch2u-13', question: '《黄山奇石》写了黄山的什么？', answer: '奇形怪状的石头', options: ['奇石', '大树', '瀑布'] },
  { chapterId: 'ch2u-14', question: '《日月潭》在哪里？', answer: '台湾', options: ['台湾', '海南', '北京'] },
  { chapterId: 'ch2u-15', question: '《葡萄沟》的水果很有名，在哪个省？', answer: '新疆', options: ['新疆', '西藏', '云南'] },
  { chapterId: 'ch2u-16', question: '《坐井观天》告诉我们什么道理？', answer: '看问题要全面', options: ['看问题要全面', '要多吃井水', '天很小'] },
  { chapterId: 'ch2u-17', question: '《寒号鸟》告诉我们什么道理？', answer: '要勤劳，不能拖延', options: ['要勤劳不能拖延', '要睡觉', '要唱歌'] },
  { chapterId: 'ch2u-18', question: '《我要的是葫芦》告诉我们什么？', answer: '事物有联系，不能只看表面', options: ['事物有联系', '葫芦好吃', '叶子没用'] },
  { chapterId: 'ch2u-19', question: '《八角楼上》写的是谁在灯下写文章？', answer: '毛主席', options: ['毛主席', '周总理', '朱德'] },
  { chapterId: 'ch2u-20', question: '《朱德的扁担》体现了朱德怎样的精神？', answer: '以身作则、同甘共苦', options: ['以身作则', '怕吃苦', '不干活'] },
  { chapterId: 'ch2u-21', question: '《难忘的泼水节》写的是谁和傣族人民一起过节？', answer: '周总理', options: ['周总理', '毛主席', '朱德'] },
  // 二年级下册
  { chapterId: 'ch2d-1', question: '《找春天》中“我们”去哪里找春天？', answer: '田野、河边', options: ['田野河边', '家里', '学校'] },
]

// ===================================================================
//                      模板化生成函数（6 维度）
// ===================================================================

let uid = 0
function qid(prefix: string) { return `${prefix}-${Date.now()}-${uid++}` }

// 维度1：字音字形（看拼音写词语 / 笔顺）
function genPhonetic(grade: GradeId, n: number): Question[] {
  const pool = wordBank.filter(w => w.grade === grade)
  return pick(pool, n).map(w => ({
    id: qid('ph'),
    type: 'fill' as const,
    question: `看拼音写汉字：${w.pinyin} → ___`,
    answer: w.word,
    hint: w.strokeOrder ? `笔顺：${w.strokeOrder}` : undefined,
  }))
}

// 维度2：拼音规则（声母/韵母/整体认读/jqx去点/标调）
function genPinyin(grade: GradeId, n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const f = pinyinData.singleFinals[randInt(0, pinyinData.singleFinals.length - 1)]
      const wrong = makeDistractors(f, pinyinData.initials.concat(['ang', 'ing', 'eng', 'ong']), 3)
      return { id: qid('py'), type: 'choice' as const,
        question: `下面哪个是单韵母？`,
        options: shuffle([f, ...wrong]).slice(0, 4),
        answer: f }
    },
    () => {
      const o = pinyinData.overall[randInt(0, pinyinData.overall.length - 1)]
      const wrong = makeDistractors(o, ['ba', 'ma', 'he', 'da', 'lu', 'po'], 3)
      return { id: qid('py'), type: 'choice' as const,
        question: `下面哪个是整体认读音节？`,
        options: shuffle([o, ...wrong]).slice(0, 4),
        answer: o }
    },
    () => {
      const r = pinyinData.jqxRules[randInt(0, pinyinData.jqxRules.length - 1)]
      const wrong = makeDistractors(r.result, [`${r.jqx}u`, `${r.jqx}ü`, 'ju', 'qu', 'xu'], 3)
      return { id: qid('py'), type: 'choice' as const,
        question: `${r.jqx} 和 ü 相拼，写成什么？`,
        options: shuffle([r.result, ...wrong]).slice(0, 4),
        answer: r.result, hint: r.note }
    },
    () => ({
      id: qid('py'), type: 'judge' as const,
      question: `标调口诀：“有 a 不放过，没 a 找 o e”`,
      answer: '对',
    }),
  ]
  while (qs.length < n) qs.push(builders[randInt(0, builders.length - 1)]())
  return shuffle(qs)
}

// 维度3：词语积累（近反义/量词/形声字/特殊词）
function genVocab(grade: GradeId, n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const p = synAntPairs[randInt(0, synAntPairs.length - 1)]
      if (p.ant) {
        const wrong = makeDistractors(p.ant, synAntPairs.map(x => x.word).concat(['大','小','多','少']), 3)
        return { id: qid('vb'), type: 'choice' as const,
          question: `“${p.word}”的反义词是什么？`,
          options: shuffle([p.ant, ...wrong]).slice(0, 4), answer: p.ant }
      }
      const wrong = makeDistractors(p.syn!, synAntPairs.map(x => x.word), 3)
      return { id: qid('vb'), type: 'choice' as const,
        question: `“${p.word}”的近义词是什么？`,
        options: shuffle([p.syn!, ...wrong]).slice(0, 4), answer: p.syn! }
    },
    () => {
      const m = measureWords[randInt(0, measureWords.length - 1)]
      const wrong = makeDistractors(m.measure, measureWords.map(x => x.measure), 3)
      return { id: qid('vb'), type: 'fill' as const,
        question: `一（ ）${m.noun}`,
        answer: m.measure, hint: `量词搭配：一${m.measure}${m.noun}` }
    },
    () => {
      const fam = phoneticFamilies.qing
      const mem = fam.members[randInt(0, fam.members.length - 1)]
      const wrong = makeDistractors(mem.meaning, fam.members.map(x => x.meaning), 3)
      return { id: qid('vb'), type: 'choice' as const,
        question: `“${mem.char}”字和什么有关？`,
        options: shuffle([mem.meaning, ...wrong]).slice(0, 4), answer: mem.meaning }
    },
    () => {
      const sw = specialWords[randInt(0, specialWords.length - 1)]
      const ex = sw.examples[randInt(0, sw.examples.length - 1)]
      return { id: qid('vb'), type: 'fill' as const,
        question: `照样子写词语（${sw.type}式）：${ex} → ___`,
        answer: sw.examples[(randInt(0, sw.examples.length - 1))],
        hint: `${sw.type}式词语示例：${sw.examples.join('、')}` }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度4：词语搭配（形容词+名词 / 多音字）
function genCollocation(grade: GradeId, n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const p = adjNounPairs[randInt(0, adjNounPairs.length - 1)]
      return { id: qid('cl'), type: 'fill' as const,
        question: `（${p.adj}）${p.noun.replace(/^的/, '')}`,
        answer: p.adj, hint: `词语搭配：（${p.adj}）${p.noun}` }
    },
    () => {
      const pl = polyphones[randInt(0, polyphones.length - 1)]
      const r = pl.readings[randInt(0, pl.readings.length - 1)]
      const wrong = pl.readings.filter(x => x.pinyin !== r.pinyin).map(x => x.pinyin)
        .concat(['hǎo','dì']).slice(0, 3)
      return { id: qid('cl'), type: 'choice' as const,
        question: `“${pl.char}”在“${r.meaning}”中读什么？`,
        options: shuffle([r.pinyin, ...wrong]).slice(0, 4), answer: r.pinyin }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度5：句子仿写（题干给例句，填空末词/结构）
function genSentence(grade: GradeId, n: number): Question[] {
  const patterns: {hint: string, q: string, a: string, opts: string[]}[] = [
    { hint: '“我多想……”写愿望', q: '我多想_________________。', a: '去北京看看', opts: ['去北京看看', '吃饭了', '睡觉'] },
    { hint: '“……十分……”', q: '今天的天气十分_________。', a: '晴朗', opts: ['晴朗', '吃饭', '书本'] },
    { hint: '“一……就……”', q: '我一到学校就_________。', a: '读书', opts: ['读书', '月亮', '苹果'] },
    { hint: '比喻句：像……', q: '春天像个_________________。', a: '害羞的小姑娘', opts: ['害羞的小姑娘', '大大的书', '红色的笔'] },
    { hint: '“有时候……有时候……”', q: '我有时候_________，有时候_________。', a: '开心', opts: ['开心', '桌子', '云朵'] },
  ]
  return pick(patterns, n).map(p => ({
    id: qid('st'), type: 'fill' as const, question: p.q, answer: p.a, hint: p.hint,
  }))
}

// 维度6：课文理解 + 古诗积累
function genReading(chapter: Chapter, grade: GradeId, n: number): Question[] {
  const qs: Question[] = []
  // 课文主旨/道理
  const rp = readingPoints.filter(r => r.chapterId === chapter.id)
  for (const r of pick(rp, Math.min(n, rp.length))) {
    qs.push({ id: qid('rd'), type: 'choice' as const, question: r.question,
      options: shuffle(r.options).slice(0, 4), answer: r.answer })
  }
  // 古诗：本年级随机一首，按原文填空（选择题形式，避免手输汉字）
  const gradePoems = poems.filter(p => p.grade === grade)
  if (gradePoems.length && qs.length < n) {
    const poem = gradePoems[randInt(0, gradePoems.length - 1)]
    const line = poem.lines[randInt(0, poem.lines.length - 1)]
    // 挖空最后一个非标点汉字，给出选项
    const match = line.match(/(.+)([一-龥])[。，]$/)
    if (match) {
      const before = line.replace(match[2] + (/[。，]$/.test(line) ? /[。，]$/ : /$/), '（ ）')
      // 从同首诗其他字 + 常见字里取干扰项
      const others = poem.lines.join('').split('').filter(c => /[一-龥]/.test(c) && c !== match[2])
      const wrong = makeDistractors(match[2], others.concat(['花', '月', '山', '水', '人', '风']), 3)
      qs.push({
        id: qid('rd'), type: 'choice' as const,
        question: `《${poem.title}》填空：${before}`,
        options: shuffle([match[2], ...wrong]).slice(0, 4),
        answer: match[2], hint: `出自《${poem.title}》（${poem.author}）`,
      })
    } else {
      qs.push({
        id: qid('rd'), type: 'choice' as const,
        question: `《${poem.title}》的作者是谁？`,
        options: shuffle([poem.author, '杜甫', '白居易', '苏轼']).slice(0, 4),
        answer: poem.author,
      })
    }
  }
  return qs.slice(0, n)
}

// ===================================================================
//            主入口：根据章节 id 与年级生成语文题
// ===================================================================
const chapterExamMap: Record<string, ('phonetic'|'pinyin'|'vocab'|'collocation'|'sentence'|'reading')[]> = {
  // 一年级上册
  'ch1u-pinyin':    ['pinyin', 'pinyin', 'phonetic'],
  'ch1u-shengzi1':  ['phonetic', 'phonetic', 'vocab'],
  'ch1u-shengzi2':  ['phonetic', 'vocab', 'vocab'],
  // 一年级下册
  'ch1d-1':         ['phonetic', 'vocab', 'reading'],
  'ch1d-2':         ['phonetic', 'vocab', 'reading'],
  // 二年级上册
  'ch2u-1': ['reading', 'reading', 'vocab'],
  'ch2u-2': ['reading', 'reading', 'vocab'],
  'ch2u-3': ['reading', 'reading', 'vocab'],
  'ch2u-4': ['vocab', 'vocab', 'phonetic'],     // 场景歌·量词
  'ch2u-5': ['reading', 'vocab', 'phonetic'],   // 树之歌
  'ch2u-6': ['vocab', 'vocab', 'phonetic'],     // 拍手歌
  'ch2u-7': ['vocab', 'vocab', 'phonetic'],     // 田家四季歌
  'ch2u-8': ['reading', 'reading', 'vocab'],
  'ch2u-11': ['reading', 'reading', 'vocab'],
  'ch2u-12': ['reading', 'reading', 'vocab'],
  'ch2u-13': ['reading', 'vocab', 'phonetic'],
  'ch2u-14': ['reading', 'vocab', 'phonetic'],
  'ch2u-15': ['reading', 'vocab', 'phonetic'],
  'ch2u-16': ['reading', 'reading', 'vocab'],
  'ch2u-17': ['reading', 'reading', 'vocab'],
  'ch2u-18': ['reading', 'reading', 'vocab'],
  'ch2u-19': ['reading', 'reading', 'vocab'],
  'ch2u-20': ['reading', 'reading', 'vocab'],
  'ch2u-21': ['reading', 'reading', 'vocab'],
  // 二年级下册
  'ch2d-1': ['reading', 'reading', 'phonetic'],
}

/** 语文动态章节判定 */
export function isDynamicChineseChapter(chapterId: string): boolean {
  return chapterId in chapterExamMap || chapterId.startsWith('ch')
}

/** 生成语文章节题目（每维度生成 3 题，混合原静态题，约 10-15 题） */
export function generateChineseQuestions(chapter: Chapter, grade: GradeId): Question[] {
  const dims = chapterExamMap[chapter.id] || ['phonetic', 'vocab', 'reading']
  const qs: Question[] = []
  for (const d of dims) {
    switch (d) {
      case 'phonetic':    qs.push(...genPhonetic(grade, 3)); break
      case 'pinyin':      qs.push(...genPinyin(grade, 3)); break
      case 'vocab':       qs.push(...genVocab(grade, 3)); break
      case 'collocation': qs.push(...genCollocation(grade, 3)); break
      case 'sentence':    qs.push(...genSentence(grade, 3)); break
      case 'reading':     qs.push(...genReading(chapter, grade, 3)); break
    }
  }
  // 混入原静态题（去重 id），保证题量充足且贴近课本
  const staticQ = (chapter.questions || []).map(q => ({ ...q, id: `static-${q.id}` }))
  const merged = [...qs, ...staticQ]
  return shuffle(merged)
}
