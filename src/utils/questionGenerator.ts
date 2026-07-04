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
