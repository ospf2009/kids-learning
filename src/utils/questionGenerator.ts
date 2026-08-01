/**
 * 动态题目生成器
 * 用于生成随机数学题，保证每次练习题目不同
 */

import type { Chapter, Question, GradeId, Subject } from '@/data/chapters'
import { generateChineseQuestions, isDynamicChineseChapter } from '@/data/examPoints'
import { api } from '@/utils/api'

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 生成范围内的随机整数 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 生成选择题干扰项 */
function generateDistractors(correct: number, count: number, min: number, max: number): number[] {
  const distractors = new Set<number>()
  distractors.add(correct)
  let attempts = 0
  while (distractors.size < count + 1 && attempts < 50) {
    const d = correct + randInt(-3, 3)
    if (d >= min && d <= max && d !== correct) {
      distractors.add(d)
    }
    attempts++
  }
  // 如果不够，补一些
  while (distractors.size < count + 1) {
    distractors.add(randInt(min, max))
  }
  // 去掉正确答案
  distractors.delete(correct)
  return shuffleArray(Array.from(distractors)).slice(0, count)
}

interface GeneratorContext {
  gradeId: GradeId
  subject: Subject
}

// ===== 数学题目缓存（账号绑定，存后端 SQLite）=====
/** 清空数学缓存（手动换一批题时调用，清后端对应用户章节） */
export function clearMathCache(userId: string, chapterId: string, gradeId: GradeId) {
  return api.clearQuizCache(userId, chapterId, 'math', gradeId)
}

let mathUid = 0
function mqid(prefix: string) { return `${prefix}-${Date.now()}-${mathUid++}` }

// ===== 英语题目缓存（账号绑定，存后端 SQLite）=====
/** 清空英语缓存（手动换一批题时调用，清后端对应用户章节） */
export function clearEnglishCache(userId: string, chapterId: string, gradeId: GradeId) {
  return api.clearQuizCache(userId, chapterId, 'english', gradeId)
}

let enUid = 0
function eqid(prefix: string) { return `${prefix}-${Date.now()}-${enUid++}` }

// ===== 英语维度生成器（按章节考点细分，听说启蒙为主）=====

// 通用：从候选池取干扰项（保证不含正确答案，字符串）
function makeEnDistractors(correct: string, pool: string[], count: number): string[] {
  const set = new Set(pool.filter(p => p !== correct))
  const res: string[] = []
  for (const s of shuffleArray(Array.from(set))) {
    if (res.length >= count) break
    res.push(s)
  }
  return shuffleArray(res).slice(0, count)
}

// 维度：英语字母（大小写配对 / 顺序 / 首字母）
const letterData = {
  upper: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
  lower: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],
  // 形状联想（趣味记忆）
  shape: { L: '像一把椅子', M: '像两座山峰', Z: '像一道闪电', S: '像小蛇', O: '像鸡蛋', T: '像锤子', X: '像交叉的路' } as Record<string, string>,
}
function eLetter(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const i = randInt(0, 25)
      const u = letterData.upper[i], l = letterData.lower[i]
      const wrong = makeEnDistractors(l, letterData.lower, 3)
      return { id: eqid('lt'), type: 'choice' as const, question: `大写字母 ${u} 对应的小写是？`,
        options: shuffleArray([l, ...wrong]).slice(0, 4), answer: l }
    },
    () => {
      const i = randInt(1, 24)
      const cur = letterData.upper[i]
      const next = letterData.upper[i + 1]
      const wrong = makeEnDistractors(next, letterData.upper, 3)
      return { id: eqid('lt'), type: 'choice' as const, question: `${cur} 的下一个字母是？`,
        options: shuffleArray([next, ...wrong]).slice(0, 4), answer: next }
    },
    () => {
      const i = randInt(1, 25)
      const prev = letterData.upper[i - 1]
      const cur = letterData.upper[i]
      const wrong = makeEnDistractors(prev, letterData.upper, 3)
      return { id: eqid('lt'), type: 'fill' as const, question: `___ ${cur}`, answer: prev }
    },
    () => {
      const keys = Object.keys(letterData.shape)
      const k = keys[randInt(0, keys.length - 1)]
      return { id: eqid('lt'), type: 'choice' as const, question: `哪个字母${letterData.shape[k]}？`,
        options: shuffleArray([k, ...makeEnDistractors(k, keys, 3)]).slice(0, 4), answer: k }
    },
    () => {
      const wordPool = [['apple','A'],['cat','C'],['dog','D'],['egg','E'],['fish','F'],['book','B'],['sun','S'],['water','W'],['red','R'],['blue','B']]
      const w = wordPool[randInt(0, wordPool.length - 1)]
      const wrong = makeEnDistractors(w[1], letterData.upper, 3)
      return { id: eqid('lt'), type: 'choice' as const, question: `"${w[0]}" 的首字母是？`,
        options: shuffleArray([w[1], ...wrong]).slice(0, 4), answer: w[1] }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：问候与自我介绍（听说交际）
const greetData = {
  words: [
    { en: 'Hello', zh: '你好' }, { en: 'Hi', zh: '你好' }, { en: 'Goodbye', zh: '再见' },
    { en: 'Good morning', zh: '早上好' }, { en: 'Good afternoon', zh: '下午好' },
    { en: 'Good night', zh: '晚安' }, { en: 'Thank you', zh: '谢谢你' },
    { en: "You're welcome", zh: '不客气' }, { en: 'Sorry', zh: '对不起' },
    { en: 'My name is...', zh: '我的名字是……' }, { en: 'I am...', zh: '我是……' },
  ],
  responses: { 'Thank you': "You're welcome", 'Sorry': 'That\'s OK', 'Hello': 'Hi', 'Goodbye': 'Bye' },
}
function eGreet(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const w = greetData.words[randInt(0, greetData.words.length - 1)]
      const wrong = makeEnDistractors(w.zh, greetData.words.map(x => x.zh), 3)
      return { id: eqid('gr'), type: 'choice' as const, question: `"${w.en}" 是什么意思？`,
        options: shuffleArray([w.zh, ...wrong]).slice(0, 4), answer: w.zh }
    },
    () => {
      const keys = Object.keys(greetData.responses)
      const k = keys[randInt(0, keys.length - 1)]
      const ans = greetData.responses[k as keyof typeof greetData.responses]
      const wrong = makeEnDistractors(ans, Object.values(greetData.responses), 3)
      return { id: eqid('gr'), type: 'choice' as const, question: `别人对你说 "${k}"，你应该回答？`,
        options: shuffleArray([ans, ...wrong]).slice(0, 4), answer: ans }
    },
    () => {
      const part = ['Good', 'morning'][randInt(0, 1)]
      const wrong = makeEnDistractors(part, ['Good', 'morning', 'afternoon', 'night', 'Hello'], 3)
      return { id: eqid('gr'), type: 'fill' as const,
        question: part === 'Good' ? '___ morning! 早上好！' : 'Good ___! 下午好！',
        answer: part === 'Good' ? 'Good' : 'afternoon',
        hint: '常用问候语：Good morning / Good afternoon' }
    },
    () => {
      const w = greetData.words[randInt(0, greetData.words.length - 1)]
      return { id: eqid('gr'), type: 'judge' as const,
        question: `"${w.en}" 的意思是"${w.zh}"`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：颜色（听说 + 认读）
const colorData = [
  { en: 'red', zh: '红色' }, { en: 'yellow', zh: '黄色' }, { en: 'blue', zh: '蓝色' },
  { en: 'green', zh: '绿色' }, { en: 'black', zh: '黑色' }, { en: 'white', zh: '白色' },
  { en: 'orange', zh: '橙色' }, { en: 'pink', zh: '粉色' }, { en: 'purple', zh: '紫色' },
]
function eColor(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const c = colorData[randInt(0, colorData.length - 1)]
      const wrong = makeEnDistractors(c.zh, colorData.map(x => x.zh), 3)
      return { id: eqid('cl'), type: 'choice' as const, question: `"${c.en}" 是什么颜色？`,
        options: shuffleArray([c.zh, ...wrong]).slice(0, 4), answer: c.zh }
    },
    () => {
      const c = colorData[randInt(0, colorData.length - 1)]
      const wrong = makeEnDistractors(c.en, colorData.map(x => x.en), 3)
      return { id: eqid('cl'), type: 'choice' as const, question: `“${c.zh}” 的英文是？`,
        options: shuffleArray([c.en, ...wrong]).slice(0, 4), answer: c.en }
    },
    () => {
      const c = colorData[randInt(0, colorData.length - 1)]
      // 挖空首字母
      return { id: eqid('cl'), type: 'fill' as const,
        question: `${c.en[0]!}___${c.en.slice(1)} （${c.zh}）`, answer: c.en[0]!,
        hint: `单词拼写：${c.en}` }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：数字 1-15（听说 + 认读）
const numberData = [
  { en: 'one', zh: '1', num: 1 }, { en: 'two', zh: '2', num: 2 }, { en: 'three', zh: '3', num: 3 },
  { en: 'four', zh: '4', num: 4 }, { en: 'five', zh: '5', num: 5 }, { en: 'six', zh: '6', num: 6 },
  { en: 'seven', zh: '7', num: 7 }, { en: 'eight', zh: '8', num: 8 }, { en: 'nine', zh: '9', num: 9 },
  { en: 'ten', zh: '10', num: 10 }, { en: 'eleven', zh: '11', num: 11 }, { en: 'twelve', zh: '12', num: 12 },
  { en: 'thirteen', zh: '13', num: 13 }, { en: 'fourteen', zh: '14', num: 14 }, { en: 'fifteen', zh: '15', num: 15 },
]
function eNumber(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const d = numberData[randInt(0, numberData.length - 1)]
      const wrong = makeEnDistractors(d.zh, numberData.map(x => x.zh), 3)
      return { id: eqid('nm'), type: 'choice' as const, question: `"${d.en}" 是几？`,
        options: shuffleArray([d.zh, ...wrong]).slice(0, 4), answer: d.zh }
    },
    () => {
      const d = numberData[randInt(0, numberData.length - 1)]
      const wrong = makeEnDistractors(d.en, numberData.map(x => x.en), 3)
      return { id: eqid('nm'), type: 'choice' as const, question: `“${d.zh}” 的英文是？`,
        options: shuffleArray([d.en, ...wrong]).slice(0, 4), answer: d.en }
    },
    () => {
      const d = numberData[randInt(0, numberData.length - 1)]
      return { id: eqid('nm'), type: 'fill' as const,
        question: `${d.en[0]!}___${d.en.slice(1)} （${d.zh}）`, answer: d.en[0]!,
        hint: `单词拼写：${d.en}` }
    },
    () => {
      const d = numberData[randInt(0, numberData.length - 1)]
      return { id: eqid('nm'), type: 'judge' as const, question: `"${d.en}" 的意思是 ${d.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：常见动物（听说 + 认读）
const animalData = [
  { en: 'cat', zh: '猫' }, { en: 'dog', zh: '狗' }, { en: 'bird', zh: '鸟' }, { en: 'fish', zh: '鱼' },
  { en: 'rabbit', zh: '兔子' }, { en: 'duck', zh: '鸭子' }, { en: 'pig', zh: '猪' }, { en: 'bear', zh: '熊' },
  { en: 'monkey', zh: '猴子' }, { en: 'elephant', zh: '大象' }, { en: 'tiger', zh: '老虎' }, { en: 'panda', zh: '熊猫' },
]
function eAnimal(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const a = animalData[randInt(0, animalData.length - 1)]
      const wrong = makeEnDistractors(a.zh, animalData.map(x => x.zh), 3)
      return { id: eqid('an'), type: 'choice' as const, question: `"${a.en}" 是什么动物？`,
        options: shuffleArray([a.zh, ...wrong]).slice(0, 4), answer: a.zh }
    },
    () => {
      const a = animalData[randInt(0, animalData.length - 1)]
      const wrong = makeEnDistractors(a.en, animalData.map(x => x.en), 3)
      return { id: eqid('an'), type: 'choice' as const, question: `“${a.zh}” 的英文是？`,
        options: shuffleArray([a.en, ...wrong]).slice(0, 4), answer: a.en }
    },
    () => {
      const a = animalData[randInt(0, animalData.length - 1)]
      return { id: eqid('an'), type: 'fill' as const,
        question: `${a.en[0]!}___${a.en.slice(1)} （${a.zh}）`, answer: a.en[0]!,
        hint: `单词拼写：${a.en}` }
    },
    () => {
      const a = animalData[randInt(0, animalData.length - 1)]
      return { id: eqid('an'), type: 'judge' as const, question: `"${a.en}" 是 ${a.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：家庭成员与朋友
const familyData = [
  { en: 'father', zh: '爸爸' }, { en: 'mother', zh: '妈妈' }, { en: 'brother', zh: '兄弟' },
  { en: 'sister', zh: '姐妹' }, { en: 'grandpa', zh: '爷爷/外公' }, { en: 'grandma', zh: '奶奶/外婆' },
  { en: 'friend', zh: '朋友' }, { en: 'family', zh: '家庭' },
]
function eFamily(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const f = familyData[randInt(0, familyData.length - 1)]
      const wrong = makeEnDistractors(f.zh, familyData.map(x => x.zh), 3)
      return { id: eqid('fm'), type: 'choice' as const, question: `"${f.en}" 是什么意思？`,
        options: shuffleArray([f.zh, ...wrong]).slice(0, 4), answer: f.zh }
    },
    () => {
      const f = familyData[randInt(0, familyData.length - 1)]
      return { id: eqid('fm'), type: 'fill' as const,
        question: `${f.en[0]!}___${f.en.slice(1)} （${f.zh}）`, answer: f.en[0]!,
        hint: `单词拼写：${f.en}` }
    },
    () => {
      const f = familyData[randInt(0, familyData.length - 1)]
      return { id: eqid('fm'), type: 'judge' as const, question: `"${f.en}" 是 ${f.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：食物
const foodData = [
  { en: 'rice', zh: '米饭' }, { en: 'bread', zh: '面包' }, { en: 'milk', zh: '牛奶' },
  { en: 'apple', zh: '苹果' }, { en: 'banana', zh: '香蕉' }, { en: 'egg', zh: '鸡蛋' },
  { en: 'cake', zh: '蛋糕' }, { en: 'water', zh: '水' }, { en: 'juice', zh: '果汁' }, { en: 'noodle', zh: '面条' },
]
function eFood(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const f = foodData[randInt(0, foodData.length - 1)]
      const wrong = makeEnDistractors(f.zh, foodData.map(x => x.zh), 3)
      return { id: eqid('fd'), type: 'choice' as const, question: `"${f.en}" 是什么？`,
        options: shuffleArray([f.zh, ...wrong]).slice(0, 4), answer: f.zh }
    },
    () => {
      const f = foodData[randInt(0, foodData.length - 1)]
      return { id: eqid('fd'), type: 'fill' as const,
        question: `${f.en[0]!}___${f.en.slice(1)} （${f.zh}）`, answer: f.en[0]!,
        hint: `单词拼写：${f.en}` }
    },
    () => {
      const f = foodData[randInt(0, foodData.length - 1)]
      return { id: eqid('fd'), type: 'judge' as const, question: `"${f.en}" 是 ${f.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：身体部位
const bodyData = [
  { en: 'head', zh: '头' }, { en: 'hand', zh: '手' }, { en: 'foot', zh: '脚' },
  { en: 'eye', zh: '眼睛' }, { en: 'nose', zh: '鼻子' }, { en: 'ear', zh: '耳朵' },
  { en: 'mouth', zh: '嘴巴' }, { en: 'arm', zh: '胳膊' }, { en: 'leg', zh: '腿' }, { en: 'finger', zh: '手指' },
]
function eBody(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const b = bodyData[randInt(0, bodyData.length - 1)]
      const wrong = makeEnDistractors(b.zh, bodyData.map(x => x.zh), 3)
      return { id: eqid('bd'), type: 'choice' as const, question: `"${b.en}" 是什么？`,
        options: shuffleArray([b.zh, ...wrong]).slice(0, 4), answer: b.zh }
    },
    () => {
      const b = bodyData[randInt(0, bodyData.length - 1)]
      return { id: eqid('bd'), type: 'fill' as const,
        question: `${b.en[0]!}___${b.en.slice(1)} （${b.zh}）`, answer: b.en[0]!,
        hint: `单词拼写：${b.en}` }
    },
    () => {
      const b = bodyData[randInt(0, bodyData.length - 1)]
      return { id: eqid('bd'), type: 'judge' as const, question: `"${b.en}" 是 ${b.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：衣物
const clothesData = [
  { en: 'shirt', zh: '衬衫' }, { en: 'pants', zh: '裤子' }, { en: 'shoes', zh: '鞋子' },
  { en: 'hat', zh: '帽子' }, { en: 'dress', zh: '连衣裙' }, { en: 'coat', zh: '外套' },
  { en: 'skirt', zh: '短裙' }, { en: 'socks', zh: '袜子' }, { en: 'sweater', zh: '毛衣' }, { en: 'jacket', zh: '夹克' },
]
function eClothes(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const c = clothesData[randInt(0, clothesData.length - 1)]
      const wrong = makeEnDistractors(c.zh, clothesData.map(x => x.zh), 3)
      return { id: eqid('ct'), type: 'choice' as const, question: `"${c.en}" 是什么？`,
        options: shuffleArray([c.zh, ...wrong]).slice(0, 4), answer: c.zh }
    },
    () => {
      const c = clothesData[randInt(0, clothesData.length - 1)]
      return { id: eqid('ct'), type: 'fill' as const,
        question: `${c.en[0]!}___${c.en.slice(1)} （${c.zh}）`, answer: c.en[0]!,
        hint: `单词拼写：${c.en}` }
    },
    () => {
      const c = clothesData[randInt(0, clothesData.length - 1)]
      return { id: eqid('ct'), type: 'judge' as const, question: `"${c.en}" 是 ${c.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：天气与日常表达（情景对话）
const weatherData = [
  { en: 'sunny', zh: '晴天' }, { en: 'rainy', zh: '雨天' }, { en: 'snowy', zh: '雪天' },
  { en: 'windy', zh: '有风的' }, { en: 'cloudy', zh: '多云的' }, { en: 'hot', zh: '热的' },
  { en: 'cold', zh: '冷的' }, { en: 'warm', zh: '温暖的' },
]
const weatherSentence = [
  { q: '今天下雨了，怎么说？', opts: ['It\'s sunny', 'It\'s rainy', 'It\'s windy'], a: 'It\'s rainy' },
  { q: '今天阳光明媚，怎么说？', opts: ['It\'s sunny', 'It\'s snowy', 'It\'s cold'], a: 'It\'s sunny' },
  { q: '天很冷，穿什么天气词？', opts: ['cold', 'warm', 'hot'], a: 'cold' },
]
function eWeather(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const w = weatherData[randInt(0, weatherData.length - 1)]
      const wrong = makeEnDistractors(w.zh, weatherData.map(x => x.zh), 3)
      return { id: eqid('wt'), type: 'choice' as const, question: `"${w.en}" 是什么天气/感觉？`,
        options: shuffleArray([w.zh, ...wrong]).slice(0, 4), answer: w.zh }
    },
    () => {
      const s = weatherSentence[randInt(0, weatherSentence.length - 1)]
      const wrong = makeEnDistractors(s.a, s.opts, 3)
      return { id: eqid('wt'), type: 'choice' as const, question: s.q,
        options: shuffleArray([s.a, ...wrong]).slice(0, 4), answer: s.a }
    },
    () => {
      const w = weatherData[randInt(0, weatherData.length - 1)]
      return { id: eqid('wt'), type: 'judge' as const, question: `"${w.en}" 是 ${w.zh}`, answer: '对' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// ===== 英语章节 → 出题维度映射（贴近人教版 PEP 一起点单元主题）=====
type EnDim = 'letter' | 'greet' | 'color' | 'number' | 'animal' |
  'family' | 'food' | 'body' | 'clothes' | 'weather'

const englishChapterExamMap: Record<string, EnDim[]> = {
  // 一年级上册
  'e1u-abc':   ['letter', 'letter', 'letter'],
  'e1u-abc2':  ['letter', 'letter', 'letter'],
  'e1u-hello': ['greet', 'greet', 'letter'],
  // 一年级下册
  'e1d-colors':   ['color', 'color', 'color'],
  'e1d-numbers':  ['number', 'number', 'number'],
  'e1d-animals':  ['animal', 'animal', 'animal'],
  // 二年级上册
  'e2u-family': ['family', 'family', 'greet'],
  'e2u-food':   ['food', 'food', 'food'],
  'e2u-body':   ['body', 'body', 'body'],
  // 二年级下册
  'e2d-clothes': ['clothes', 'clothes', 'clothes'],
  'e2d-weather': ['weather', 'weather', 'weather'],
}

/** 按章节考点生成英语题（每维度 3 题，混入原静态题，约 10-15 题） */
function generateEnglishQuestionsByChapter(chapter: Chapter): Question[] {
  const dims = englishChapterExamMap[chapter.id] || ['greet', 'color', 'number']
  const qs: Question[] = []
  for (const d of dims) {
    switch (d) {
      case 'letter':   qs.push(...eLetter(3)); break
      case 'greet':    qs.push(...eGreet(3)); break
      case 'color':    qs.push(...eColor(3)); break
      case 'number':   qs.push(...eNumber(3)); break
      case 'animal':   qs.push(...eAnimal(3)); break
      case 'family':   qs.push(...eFamily(3)); break
      case 'food':     qs.push(...eFood(3)); break
      case 'body':     qs.push(...eBody(3)); break
      case 'clothes':  qs.push(...eClothes(3)); break
      case 'weather':  qs.push(...eWeather(3)); break
    }
  }
  // 混入原静态题（去重 id），保证题量充足且贴近课本
  const staticQ = (chapter.questions || []).map(q => ({ ...q, id: `static-${q.id}` }))
  const merged = [...qs, ...staticQ]
  return shuffleArray(merged)
}

// ===== 数学维度生成器（按章节考点细分）=====

// 维度：数一数 / 数比大小 / 数的顺序
function mCount(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const target = randInt(1, 10)
      const wrong = makeMathDistractors(target, 1, 20, 3)
      return { id: mqid('cnt'), type: 'choice' as const, question: `数一数，图中有几个🍎？`, options: shuffleArray([String(target), ...wrong.map(String)]), answer: String(target) }
    },
    () => {
      const a = randInt(1, 9), b = randInt(1, 9); const big = Math.max(a, b), small = Math.min(a, b)
      return { id: mqid('cnt'), type: 'judge' as const, question: `${big} 比 ${small} 大`, answer: '对' }
    },
    () => {
      const a = randInt(1, 8); const miss = a + 1
      const wrong = makeMathDistractors(miss, 1, 12, 3)
      return { id: mqid('cnt'), type: 'fill' as const, question: `${a}, ___, ${a + 2}`, answer: String(miss) }
    },
    () => {
      const a = randInt(2, 9)
      const wrong = makeMathDistractors(a - 1, 1, 10, 3)
      return { id: mqid('cnt'), type: 'fill' as const, question: `${a} 前面的一个数是 ___`, answer: String(a - 1) }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：10以内加法（含"凑十法"提示可选）
function mAdd10(n: number, max = 10): Question[] {
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const a = randInt(1, max - 1)
    const b = randInt(1, max - a)
    const correct = a + b
    const wrong = makeMathDistractors(correct, 0, max, 3)
    qs.push({
      id: mqid('add'), type: 'choice' as const,
      question: `${a} + ${b} = ?`,
      options: shuffleArray([String(correct), ...wrong.map(String)]),
      answer: String(correct),
      hint: `${a} 加 ${b} 等于几？`,
    })
  }
  return qs
}

// 维度：10以内减法
function mSub10(n: number, max = 10): Question[] {
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const a = randInt(2, max)
    const b = randInt(1, a - 1)
    const correct = a - b
    const wrong = makeMathDistractors(correct, 0, max, 3)
    qs.push({
      id: mqid('sub'), type: 'choice' as const,
      question: `${a} - ${b} = ?`,
      options: shuffleArray([String(correct), ...wrong.map(String)]),
      answer: String(correct),
      hint: `${a} 减 ${b} 等于几？`,
    })
  }
  return qs
}

// 维度：20以内进位加法（凑十法）
function mAdd20(n: number): Question[] {
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const a = randInt(9, 19)            // 和至少为 11（进位）
    const b = randInt(2, 9)
    const correct = a + b
    if (correct > 20 || correct < 11) { i--; continue }
    const wrong = makeMathDistractors(correct, 11, 20, 3)
    qs.push({
      id: mqid('a20'), type: 'choice' as const,
      question: `${a} + ${b} = ?`,
      options: shuffleArray([String(correct), ...wrong.map(String)]),
      answer: String(correct),
      hint: `用"凑十法"：把 ${b} 分成几和几，先凑成 10`,
    })
  }
  return qs
}

// 维度：20以内退位减法（破十法）
function mSub20(n: number): Question[] {
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const a = randInt(11, 19)          // 被减数 11~19
    const b = randInt(2, 9)
    const correct = a - b
    if (correct < 1) { i--; continue }
    const wrong = makeMathDistractors(correct, 1, 18, 3)
    qs.push({
      id: mqid('s20'), type: 'choice' as const,
      question: `${a} - ${b} = ?`,
      options: shuffleArray([String(correct), ...wrong.map(String)]),
      answer: String(correct),
      hint: `用"破十法"或"想加算减"：因为 ${b} + ${correct} = ${a}`,
    })
  }
  return qs
}

// 维度：100以内加法（两位数+整十数/一位数，不进位为主）
function mAdd100(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const tens = randInt(1, 8) * 10
      const ones = randInt(1, 9)
      const correct = tens + ones
      const wrong = makeMathDistractors(correct, 10, 99, 3)
      return { id: mqid('a100'), type: 'choice' as const, question: `${tens} + ${ones} = ?`,
        options: shuffleArray([String(correct), ...wrong.map(String)]), answer: String(correct) }
    },
    () => {
      const a = randInt(10, 89), b = randInt(10, 90 - a)
      const correct = a + b
      const wrong = makeMathDistractors(correct, 10, 99, 3)
      return { id: mqid('a100'), type: 'choice' as const, question: `${a} + ${b} = ?`,
        options: shuffleArray([String(correct), ...wrong.map(String)]), answer: String(correct),
        hint: '笔算：相同数位对齐，从个位加起' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：100以内减法
function mSub100(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const tens = randInt(2, 9) * 10
      const ones = randInt(1, 9)
      const correct = tens - ones
      const wrong = makeMathDistractors(correct, 10, 99, 3)
      return { id: mqid('s100'), type: 'choice' as const, question: `${tens} - ${ones} = ?`,
        options: shuffleArray([String(correct), ...wrong.map(String)]), answer: String(correct) }
    },
    () => {
      const a = randInt(20, 99), b = randInt(10, a - 1)
      const correct = a - b
      const wrong = makeMathDistractors(correct, 1, 99, 3)
      return { id: mqid('s100'), type: 'choice' as const, question: `${a} - ${b} = ?`,
        options: shuffleArray([String(correct), ...wrong.map(String)]), answer: String(correct),
        hint: '笔算：相同数位对齐，从个位减起' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：认识图形（立体/平面）
function mShape(grade: GradeId, n: number): Question[] {
  const solid = [
    { name: '长方体', emoji: '📦' }, { name: '正方体', emoji: '🧊' },
    { name: '圆柱', emoji: '🥫' }, { name: '球', emoji: '⚽' },
  ]
  const plane = [
    { name: '长方形', emoji: '▭' }, { name: '正方形', emoji: '⬛' },
    { name: '三角形', emoji: '🔺' }, { name: '圆', emoji: '⭕' }, { name: '平行四边形', emoji: '🔻' },
  ]
  const pool = grade === 'grade1-up' ? solid : plane
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const t = pool[randInt(0, pool.length - 1)]
    const wrong = shuffleArray(pool.filter(p => p.name !== t.name)).slice(0, 3).map(p => p.name)
    qs.push({
      id: mqid('shp'), type: 'choice' as const,
      question: grade === 'grade1-up' ? `这个物体是${t.emoji}什么形状？` : `这个图形 ${t.emoji} 是什么？`,
      options: shuffleArray([t.name, ...wrong]).slice(0, 4),
      answer: t.name,
    })
  }
  return qs
}

// 维度：位置（上下左右前后）
function mPos(n: number): Question[] {
  const rel = ['上', '下', '左', '右', '前', '后']
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const r = rel[randInt(0, rel.length - 1)]
    const wrong = shuffleArray(rel.filter(x => x !== r)).slice(0, 3)
    qs.push({
      id: mqid('pos'), type: 'choice' as const,
      question: `看图：苹果在盘子的（ ${r} ）方`,
      options: shuffleArray([r, ...wrong]).slice(0, 4),
      answer: r,
    })
  }
  return qs
}

// 维度：人民币（元角分）
function mMoney(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const yuan = randInt(1, 9)
      const correct = yuan * 10
      const wrong = makeMathDistractors(correct, 1, 99, 3)
      return { id: mqid('mon'), type: 'choice' as const, question: `${yuan} 元 = ( ? ) 角`,
        options: shuffleArray([String(correct), ...wrong.map(String)]), answer: String(correct), hint: '1元 = 10角' }
    },
    () => {
      const jiao = randInt(2, 9)
      const correct = jiao
      const wrong = makeMathDistractors(correct, 1, 10, 3)
      return { id: mqid('mon'), type: 'choice' as const, question: `${jiao} 角 = ( ? ) 分`,
        options: shuffleArray([String(correct * 10), ...wrong.map(String)]), answer: String(correct * 10), hint: '1角 = 10分' }
    },
    () => {
      const a = randInt(1, 8), b = randInt(1, 9 - a)
      const correct = a + b
      const wrong = makeMathDistractors(correct, 1, 20, 3)
      return { id: mqid('mon'), type: 'choice' as const, question: `${a} 元 + ${b} 元 = ( ? ) 元`,
        options: shuffleArray([String(correct), ...wrong.map(String)]), answer: String(correct) }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：乘法口诀（指定起止范围 2~9）
function mMul(n: number, minF = 2, maxF = 9): Question[] {
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const a = randInt(minF, maxF)
    const b = randInt(2, 9)
    const correct = a * b
    const wrong = makeMathDistractors(correct, 1, 81, 3)
    qs.push({
      id: mqid('mul'), type: 'choice' as const,
      question: `${a} × ${b} = ?`,
      options: shuffleArray([String(correct), ...wrong.map(String)]),
      answer: String(correct),
      hint: `用乘法口诀：${a} 乘 ${b}`,
    })
  }
  return qs
}

// 维度：表内除法
function mDiv(n: number, maxF = 9): Question[] {
  const qs: Question[] = []
  for (let i = 0; i < n; i++) {
    const b = randInt(2, maxF)
    const c = randInt(1, maxF)
    const a = b * c
    const wrong = makeMathDistractors(c, 1, 9, 3)
    qs.push({
      id: mqid('div'), type: 'choice' as const,
      question: `${a} ÷ ${b} = ?`,
      options: shuffleArray([String(c), ...wrong.map(String)]),
      answer: String(c),
      hint: `想乘法口诀：${b} 乘 ( ? ) 得 ${a}`,
    })
  }
  return qs
}

// 维度：长度单位（厘米/米）
function mLen(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const wrong = shuffleArray(['1米', '10厘米', '100米', '1厘米']).filter(x => x !== '100厘米').slice(0, 3)
      return { id: mqid('len'), type: 'choice' as const, question: '1 米 = ( ? )',
        options: shuffleArray(['100厘米', ...wrong]).slice(0, 4), answer: '100厘米' }
    },
    () => {
      const wrong = shuffleArray(['米', '千克', '元']).slice(0, 3)
      return { id: mqid('len'), type: 'choice' as const, question: '量铅笔的长度，通常用什么作单位？',
        options: shuffleArray(['厘米', ...wrong]).slice(0, 4), answer: '厘米', hint: '较短物体用厘米' }
    },
    () => {
      const cm = randInt(2, 9) * 10
      const correct = cm
      const wrong = makeMathDistractors(correct, 10, 100, 3)
      return { id: mqid('len'), type: 'fill' as const, question: `${cm} 厘米 = ___ 分米`, answer: String(cm / 10), hint: '10厘米 = 1分米' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：角的认识
function mAngle(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const wrong = shuffleArray(['边', '面', '尖']).slice(0, 3)
      return { id: mqid('ang'), type: 'choice' as const, question: '一个角有（ ? ）个顶点和（ ? ）条边？',
        options: shuffleArray(['1个顶点，2条边', ...wrong.map(w => `1个顶点，${w}条边`)]).slice(0, 4),
        answer: '1个顶点，2条边' }
    },
    () => {
      const wrong = shuffleArray(['锐角', '钝角', '平角']).filter(x => x !== '直角').slice(0, 3)
      return { id: mqid('ang'), type: 'choice' as const, question: '三角板上的这个角是（ ? ）',
        options: shuffleArray(['直角', ...wrong]).slice(0, 4), answer: '直角' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：观察物体（不同方向看到的形状）
function mView(n: number): Question[] {
  const qs: Question[] = []
  const dirs = ['前面', '后面', '左面', '右面']
  for (let i = 0; i < n; i++) {
    const d = dirs[randInt(0, dirs.length - 1)]
    const wrong = shuffleArray(dirs.filter(x => x !== d)).slice(0, 3)
    qs.push({
      id: mqid('view'), type: 'choice' as const,
      question: `从${d}观察这个物体，看到的是什么形状？`,
      options: shuffleArray([`${d}看到的形状`, ...wrong.map(w => `${w}看到的形状`)]).slice(0, 4),
      answer: `${d}看到的形状`,
      hint: '观察位置不同，看到的形状可能不同',
    })
  }
  return qs
}

// 维度：认识时间
function mTime(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const h = randInt(1, 12)
      const correct = h * 5
      const wrong = makeMathDistractors(correct, 0, 60, 3)
      return { id: mqid('time'), type: 'choice' as const, question: `分针指向 12，${h} 时整，时针指向 ( ? )`,
        options: shuffleArray([String(h), ...wrong.map(String)]).slice(0, 4), answer: String(h) }
    },
    () => {
      const wrong = shuffleArray(['60分', '100分', '30分']).filter(x => x !== '60分').slice(0, 3)
      return { id: mqid('time'), type: 'choice' as const, question: '1 时 = ( ? )',
        options: shuffleArray(['60分', ...wrong]).slice(0, 4), answer: '60分' }
    },
    () => {
      const h = randInt(1, 11), m = [15, 30, 45][randInt(0, 2)]
      return { id: mqid('time'), type: 'fill' as const, question: `现在是 ${h} 时 ${m} 分，写成 ___:___`,
        answer: `${h}:${m}`, hint: '时:分 用冒号隔开' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 维度：搭配 / 排列组合
function mMatch(n: number): Question[] {
  const qs: Question[] = []
  const builders: (() => Question)[] = [
    () => {
      const a = randInt(2, 4), b = randInt(2, 4)
      const correct = a * b
      const wrong = makeMathDistractors(correct, 1, 20, 3)
      return { id: mqid('mt'), type: 'choice' as const, question: `从家到学校有 ${a} 条路，从学校到书店有 ${b} 条路，从家经学校到书店有几种走法？`,
        options: shuffleArray([String(correct), ...wrong.map(String)]).slice(0, 4), answer: String(correct), hint: '用乘法：A的每条路都能搭配B的每条路' }
    },
    () => {
      const items = ['红', '黄', '蓝', '绿']
      const k = randInt(2, 3)
      const pickArr = shuffleArray(items).slice(0, k)
      // 简单的两两搭配数 = C(k,2)
      const correct = (k * (k - 1)) / 2
      const wrong = makeMathDistractors(correct, 1, 10, 3)
      return { id: mqid('mt'), type: 'choice' as const, question: `有 ${pickArr.join('、')} ${k} 种颜色的球，每两个不同颜色搭配成一束，共有几种搭配？`,
        options: shuffleArray([String(correct), ...wrong.map(String)]).slice(0, 4), answer: String(correct), hint: '有序思考，不重复不遗漏' }
    },
  ]
  for (let i = 0; i < n; i++) qs.push(builders[randInt(0, builders.length - 1)]())
  return qs
}

// 数学数字干扰项生成（保证不含正确答案、范围合理）
function makeMathDistractors(correct: number, min: number, max: number, count: number): number[] {
  const set = new Set<number>()
  let attempts = 0
  while (set.size < count && attempts < 50) {
    const d = correct + randInt(-3, 3)
    if (d >= min && d <= max && d !== correct) set.add(d)
    attempts++
  }
  while (set.size < count) {
    const d = randInt(min, max)
    if (d !== correct) set.add(d)
  }
  return shuffleArray(Array.from(set)).slice(0, count)
}

// ===== 数学章节 → 出题维度映射 =====
// 每个维度对应一个考点生成器，按章节考点组合出贴近课本的题目
type MathDim = 'count' | 'add10' | 'sub10' | 'add20' | 'sub20' |
  'add100' | 'sub100' | 'shape' | 'pos' | 'money' |
  'mul' | 'div' | 'len' | 'angle' | 'view' | 'time' | 'match'

const mathChapterExamMap: Record<string, MathDim[]> = {
  // 一年级上册
  'm1u-count':  ['count', 'count', 'add10'],
  'm1u-add':    ['add10', 'add10', 'add10'],
  'm1u-sub':    ['sub10', 'sub10', 'sub10'],
  'm1u-shape':  ['shape', 'shape', 'shape'],
  // 一年级下册
  'm1d-pos':    ['pos', 'pos', 'add10'],
  'm1d-20add':  ['add20', 'add20', 'add10'],
  'm1d-20sub':  ['sub20', 'sub20', 'sub10'],
  'm1d-money':  ['money', 'money', 'add10'],
  // 二年级上册
  'm2u-len':    ['len', 'len', 'add100'],
  'm2u-100add': ['add100', 'add100', 'add100'],
  'm2u-100sub': ['sub100', 'sub100', 'sub100'],
  'm2u-angle':  ['angle', 'angle', 'add100'],
  'm2u-mul1':   ['mul', 'mul', 'mul'],        // 2~6 乘法口诀
  'm2u-view':   ['view', 'view', 'add100'],
  'm2u-mul2':   ['mul', 'mul', 'div'],        // 7~9 乘法口诀 + 除法初步
  'm2u-time':   ['time', 'time', 'add100'],
  'm2u-match':  ['match', 'match', 'mul'],
  // 二年级下册
  'm2d-table':  ['mul', 'mul', 'div'],        // 表内乘法 + 除法
  'm2d-div':    ['div', 'div', 'mul'],
}

/** 按章节考点生成数学题（每维度 3 题，混入原静态题，约 10-15 题） */
function generateMathQuestionsByChapter(chapter: Chapter, gradeId: GradeId): Question[] {
  const dims = mathChapterExamMap[chapter.id] || ['add10', 'sub10', 'mul']
  const qs: Question[] = []
  for (const d of dims) {
    switch (d) {
      case 'count':   qs.push(...mCount(3)); break
      case 'add10':   qs.push(...mAdd10(3)); break
      case 'sub10':   qs.push(...mSub10(3)); break
      case 'add20':   qs.push(...mAdd20(3)); break
      case 'sub20':   qs.push(...mSub20(3)); break
      case 'add100':  qs.push(...mAdd100(3)); break
      case 'sub100':  qs.push(...mSub100(3)); break
      case 'shape':   qs.push(...mShape(gradeId === 'grade1-up' ? 'grade1-up' : gradeId, 3)); break
      case 'pos':     qs.push(...mPos(3)); break
      case 'money':   qs.push(...mMoney(3)); break
      case 'mul':     qs.push(...mMul(3, gradeId === 'grade1-down' ? 2 : 2, 9)); break
      case 'div':     qs.push(...mDiv(3)); break
      case 'len':     qs.push(...mLen(3)); break
      case 'angle':   qs.push(...mAngle(3)); break
      case 'view':    qs.push(...mView(3)); break
      case 'time':    qs.push(...mTime(3)); break
      case 'match':   qs.push(...mMatch(3)); break
    }
  }
  // 混入原静态题（去重 id），保证题量充足且贴近课本
  const staticQ = (chapter.questions || []).map(q => ({ ...q, id: `static-${q.id}` }))
  const merged = [...qs, ...staticQ]
  return shuffleArray(merged)
}



/** 判断某个章节是否支持动态出题 */
export function isDynamicChapter(chapter: Chapter, subject: Subject): boolean {
  if (subject === 'math') {
    // 所有数学章节均按章节考点模板化动态出题
    return chapter.id.startsWith('m')
  }
  if (subject === 'chinese') {
    return isDynamicChineseChapter(chapter.id)
  }
  if (subject === 'english') {
    // 所有英语章节均按章节考点模板化动态出题
    return chapter.id.startsWith('e')
  }
  return false
}

// ===== 语文题目缓存（账号绑定，存后端 SQLite）=====
/** 清空语文缓存（手动重生成时调用，清后端对应用户章节） */
export function clearChineseCache(userId: string, chapterId: string, gradeId: GradeId) {
  return api.clearQuizCache(userId, chapterId, 'chinese', gradeId)
}

// ====== 选项图标映射 ======
// 根据选项文字自动匹配一个直观的 emoji 图标
const emojiMap: Record<string, string> = {
  // === 动物 ===
  '青蛙': '🐸', '鱼': '🐟', '乌龟': '🐢', '虾': '🦐', '蝌蚪': '🐸',
  '鸟': '🐦', '小鸟': '🐦', '燕子': '🐦', '喜鹊': '🐦',
  '狗': '🐕', '猫': '🐈', '兔': '🐰', '兔子': '🐰',
  '牛': '🐄', '羊': '🐑', '猪': '🐖', '鸡': '🐔', '鸭': '🦆',
  '马': '🐎', '驴': '🐴', '大象': '🐘', '老虎': '🐯', '狮子': '🦁',
  '猴子': '🐵', '熊': '🐻', '熊猫': '🐼', '狐狸': '🦊',
  '松鼠': '🐿️', '老鼠': '🐭', '蛇': '🐍', '龙': '🐉',
  '蝴蝶': '🦋', '蜜蜂': '🐝', '瓢虫': '🐞', '蜗牛': '🐌',
  '虫': '🐛', '虫子': '🐛', '害虫': '🐛',
  '鲸': '🐋', '海豚': '🐬', '鲨鱼': '🦈',
  '恐龙': '🦕',
  // === 自然/天气 ===
  '太阳': '☀️', '月亮': '🌙', '星星': '⭐', '星': '⭐',
  '云': '☁️', '乌云': '☁️', '雨': '🌧️', '雪': '❄️', '雪花': '❄️',
  '风': '🌬️', '火': '🔥', '水': '💧', '冰': '🧊',
  '山': '⛰️', '山': '⛰️', '石头': '🪨', '石': '🪨',
  '花': '🌸', '草': '🌿', '树': '🌳', '树木': '🌳', '叶': '🍃',
  '果': '🍎', '果实': '🍎', '种子': '🌱',
  // === 季节 ===
  '春': '🌸', '春天': '🌸', '夏': '☀️', '夏天': '☀️',
  '秋': '🍂', '秋天': '🍂', '冬': '❄️', '冬天': '❄️',
  // === 水果/食物 ===
  '苹果': '🍎', '梨': '🍐', '香蕉': '🍌', '葡萄': '🍇',
  '西瓜': '🍉', '桃子': '🍑', '草莓': '🍓',
  '面包': '🍞', '米饭': '🍚', '鸡蛋': '🥚', '牛奶': '🥛',
  // === 身体 ===
  '头': '👤', '脸': '😊', '眼睛': '👀', '眼': '👀',
  '耳朵': '👂', '鼻子': '👃', '嘴巴': '👄', '嘴': '👄',
  '手': '✋', '脚': '🦶', '尾巴': '🐾', '羽毛': '🪶',
  // === 颜色 ===
  '白': '⬜', '白色': '⬜', '黑': '⬛', '黑色': '⬛',
  '红': '🔴', '红色': '🔴', '黄': '🟡', '黄色': '🟡',
  '绿': '🟢', '绿色': '🟢', '蓝': '🔵', '蓝色': '🔵',
  // === 形状/数 ===
  '圆': '⭕', '方': '🟩', '三角': '🔺',
  '大': '📏', '小': '📐', '长': '📏', '短': '📐',
  '对': '⭕', '错': '❌',
  // === 日常 ===
  '书': '📖', '笔': '✏️', '铅笔': '✏️', '纸': '📄',
  '书包': '🎒', '尺子': '📏', '橡皮': '🧹',
  '房子': '🏠', '门': '🚪', '窗': '🪟',
  '灯': '💡', '电话': '📞', '电脑': '💻',
  '床': '🛏️', '桌': '🪑', '椅子': '🪑',
  '车': '🚗', '船': '🚢', '飞机': '✈️', '飞': '✈️',
  '衣服': '👕', '帽子': '🧢', '鞋': '👟',
  '旗': '🚩', '国旗': '🇨🇳',
  // === 天气/地点 ===
  '池塘': '🏞️', '大海': '🌊', '海': '🌊', '河': '🏞️',
  '江': '🏞️', '湖': '🏞️', '田野': '🌾', '田': '🌾',
  '城市': '🏙️', '乡村': '🏘️',
  // === 时间 ===
  '早上': '🌅', '早晨': '🌅', '中午': '☀️', '下午': '🌤️',
  '晚上': '🌙', '夜晚': '🌙', '今天': '📅', '昨天': '📅',
  // === 动作/状态 ===
  '跑': '🏃', '跳': '🤸', '走': '🚶', '游': '🏊',
  '飞': '✈️', '睡': '💤', '睡觉': '💤', '吃': '🍽️',
  '唱': '🎤', '歌': '🎵',
  // === 学习 ===
  '拼音': '🔤', '字母': '🔤', '声母': '🔤', '韵母': '🔤',
  '字': '📝', '词': '📝', '句': '📝',
  '笔画': '✍️', '部首': '📑', '结构': '🏗️',
  // === 数字 ===
  '一': '1️⃣', '二': '2️⃣', '三': '3️⃣', '四': '4️⃣',
  '五': '5️⃣', '六': '6️⃣', '七': '7️⃣', '八': '8️⃣',
  '九': '9️⃣', '十': '🔟',
  '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
  '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣',
  '9': '9️⃣', '0': '0️⃣',
  // === 其他 ===
  '喜欢': '❤️', '爱': '❤️', '快乐': '😄',
  '勇敢': '💪', '聪明': '🧠', '美丽': '💐',
}

/**
 * 根据选项文字返回对应的 emoji 图标
 * 如果没匹配到，返回一个默认图标
 */
export function getOptionEmoji(option: string): string {
  // 先尝试精确匹配
  if (emojiMap[option]) return emojiMap[option]

  // 尝试匹配包含关系
  for (const [key, value] of Object.entries(emojiMap)) {
    if (option.includes(key)) return value
  }

  // 默认图标
  return '▪️'
}

/**
 * 获取题目列表（混合静态+动态题目，随机排序）
 * 题目缓存与账号绑定：已登录时读/写后端 user_quiz_cache 表；
 * 未登录（理论上由路由守卫拦截，不会到达）则退回静态题。
 */
export async function getMixedQuestions(
  chapter: Chapter,
  subject: Subject,
  gradeId: GradeId,
  userId?: string
): Promise<Question[]> {
  const staticQuestions = chapter.questions

  if (!isDynamicChapter(chapter, subject)) {
    return shuffleArray(staticQuestions)
  }

  // 已登录：走后端账号绑定的题目缓存
  if (userId) {
    const cacheKey = `${gradeId}:${chapter.id}`
    try {
      const { questions } = await api.getQuizCache(userId, chapter.id, subject, gradeId)
      if (questions && (questions as Question[]).length) {
        return questions as Question[]
      }
    } catch (e) {
      console.error('[getMixedQuestions] 读取缓存失败，重新生成:', e)
    }

    // 缓存未命中：按科目生成并写回后端
    let generated: Question[]
    if (subject === 'chinese') {
      generated = generateChineseQuestions(chapter, gradeId)
    } else if (subject === 'math') {
      generated = generateMathQuestionsByChapter(chapter, gradeId)
    } else if (subject === 'english') {
      generated = generateEnglishQuestionsByChapter(chapter)
    } else {
      generated = shuffleArray(staticQuestions)
    }

    const toSave = generated.map(q => ({ ...q, id: `${cacheKey}:${q.id}` }))
    try {
      await api.saveQuizCache(userId, chapter.id, subject, gradeId, toSave)
    } catch (e) {
      console.error('[getMixedQuestions] 保存缓存失败:', e)
    }
    return toSave
  }

  // 兜底（未登录）：直接生成，不缓存
  if (subject === 'chinese') return generateChineseQuestions(chapter, gradeId)
  if (subject === 'math') return generateMathQuestionsByChapter(chapter, gradeId)
  if (subject === 'english') return generateEnglishQuestionsByChapter(chapter)
  return shuffleArray(staticQuestions)
}
