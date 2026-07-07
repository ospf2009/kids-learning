/**
 * 动态题目生成器
 * 用于生成随机数学题，保证每次练习题目不同
 */

import type { Chapter, Question, GradeId, Subject } from '@/data/chapters'

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

/** 生成随机数学题 */
function generateMathQuestions(context: GeneratorContext): Question[] {
  const questions: Question[] = []
  const grade = context.gradeId

  if (grade === 'grade1-up') {
    // 一年级上册：10以内加减法
    for (let i = 0; i < 8; i++) {
      const a = randInt(1, 9)
      const b = randInt(1, 9 - a)
      const correct = a + b
      const distractors = generateDistractors(correct, 3, 0, 10)
      questions.push({
        id: `gen-add-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} + ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
        hint: `${a}加${b}等于几？`
      })
    }
    for (let i = 0; i < 7; i++) {
      const a = randInt(2, 10)
      const b = randInt(1, a - 1)
      const correct = a - b
      const distractors = generateDistractors(correct, 3, 0, 10)
      questions.push({
        id: `gen-sub-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} - ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
        hint: `${a}减${b}等于几？`
      })
    }
  } else if (grade === 'grade1-down') {
    // 一年级下册：20以内加减法
    for (let i = 0; i < 8; i++) {
      const a = randInt(2, 19)
      const b = randInt(1, Math.min(9, 20 - a))
      const correct = a + b
      const distractors = generateDistractors(correct, 3, 0, 20)
      questions.push({
        id: `gen-add1-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} + ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
        hint: `${a}加${b}等于几？`
      })
    }
    for (let i = 0; i < 7; i++) {
      const a = randInt(5, 20)
      const b = randInt(1, a - 1)
      const correct = a - b
      const distractors = generateDistractors(correct, 3, 0, 20)
      questions.push({
        id: `gen-sub1-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} - ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
        hint: `${a}减${b}等于几？`
      })
    }
  } else if (grade === 'grade2-up') {
    // 二年级：100以内加减法
    for (let i = 0; i < 8; i++) {
      const a = randInt(10, 90)
      const b = randInt(1, Math.min(50, 100 - a))
      const correct = a + b
      const distractors = generateDistractors(correct, 3, 0, 100)
      questions.push({
        id: `gen-add2-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} + ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
      })
    }
    for (let i = 0; i < 7; i++) {
      const a = randInt(30, 99)
      const b = randInt(10, 60)
      if (a <= b) continue
      const correct = a - b
      const distractors = generateDistractors(correct, 3, 0, 100)
      questions.push({
        id: `gen-sub2-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} - ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
      })
    }
  } else if (grade === 'grade2-down') {
    // 二年级下册：乘法除法
    // 乘法：2-9乘法表内的
    for (let i = 0; i < 10; i++) {
      const a = randInt(2, 9)
      const b = randInt(2, 9)
      const correct = a * b
      const distractors = generateDistractors(correct, 3, 1, 81)
      questions.push({
        id: `gen-mul-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} x ${b} = ?`,
        options: shuffleArray([String(correct), ...distractors.map(String)]),
        answer: String(correct),
        hint: `${a}乘以${b}用乘法口诀`
      })
    }
    for (let i = 0; i < 5; i++) {
      const b = randInt(2, 9)
      const c = randInt(1, 9)
      const a = b * c
      const distractors = generateDistractors(c, 3, 1, 81)
      questions.push({
        id: `gen-div-${Date.now()}-${i}`,
        type: 'choice',
        question: `${a} ÷ ${b} = ?`,
        options: shuffleArray([String(c), ...distractors.map(String)]),
        answer: String(c),
        hint: `${a}除以${b}`
      })
    }
  }

  return shuffleArray(questions)
}

/** 判断某个章节是否支持动态出题 */
export function isDynamicChapter(chapter: Chapter, subject: Subject): boolean {
  // 数学的"加法入门""减法入门"等操作类章节使用动态出题
  if (subject !== 'math') return false
  const dynIds = ['m1u-add', 'm1u-sub', 'm1d-20add', 'm1d-20sub',
                  'm2u-100add', 'm2u-100sub', 'm2d-table', 'm2d-div',
                  'm1u-count']
  return dynIds.includes(chapter.id)
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

/** 获取题目列表（混合静态+动态题目，随机排序） */
export function getMixedQuestions(chapter: Chapter, subject: Subject, gradeId: GradeId): Question[] {
  const staticQuestions = chapter.questions

  if (!isDynamicChapter(chapter, subject)) {
    return shuffleArray(staticQuestions)
  }

  // 混合：3/4 动态 + 1/4 静态，确保总量够
  const dynamicCount = Math.max(15, staticQuestions.length + 5)
  const dynamicQuestions = generateMathQuestions({ gradeId, subject })

  // 取一部分静态，一部分动态（去重）
  const mixed = [
    ...shuffleArray(staticQuestions).slice(0, Math.min(5, staticQuestions.length)),
    ...dynamicQuestions.slice(0, dynamicCount - 5)
  ]

  return shuffleArray(mixed)
}
