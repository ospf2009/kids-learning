/**
 * 学习进度管理
 * 全部走 API
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { generateId } from '@/db'
import { api, type ApiWrongQuestion, type ApiQuizResult } from '@/utils/api'

/** 前端 progress 类型 */
export interface FrontProgress {
  id: string
  userId: string
  chapterId: string
  subject: string
  gradeId: string
  completed: boolean
  score: number
  totalQuestions: number
  correctAnswers: number
  attempts: number
  lastAttemptDate: string
}

/** 前端错题类型 */
export interface FrontWrongQuestion {
  id: string
  userId: string
  questionId: string
  chapterId: string
  subject: string
  gradeId: string
  question: string
  userAnswer: string
  correctAnswer: string
  options: string[]
  date: string
  retried: boolean
  retryCorrect: boolean
}

/** 前端测验结果类型 */
export interface FrontQuizResult {
  id: string
  userId: string
  chapterId: string
  subject: string
  gradeId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  date: string
}

/** 容错解析 options 字段：服务端该字段可能是 null / 空串 / 非 JSON 文本，
 *  都统一回退为空数组，避免 JSON.parse 抛 "Unexpected end of JSON input" 中断整页加载 */
function parseOptions(raw: string | null | undefined): string[] {
  if (!raw) return []
  const s = String(raw).trim()
  if (!s) return []
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

function mapWrongQuestion(w: ApiWrongQuestion): FrontWrongQuestion {
  return {
    id: w.id,
    userId: w.user_id,
    questionId: w.question_id,
    chapterId: w.chapter_id,
    subject: w.subject,
    gradeId: w.grade_id,
    question: w.question,
    userAnswer: w.user_answer,
    correctAnswer: w.correct_answer,
    options: parseOptions(w.options),
    date: w.date,
    retried: !!w.retried,
    retryCorrect: !!w.retry_correct,
  }
}

function mapQuizResult(r: ApiQuizResult): FrontQuizResult {
  return {
    id: r.id,
    userId: r.user_id,
    chapterId: r.chapter_id,
    subject: r.subject,
    gradeId: r.grade_id,
    score: r.score,
    totalQuestions: r.total_questions,
    correctAnswers: r.correct_answers,
    date: r.date,
  }
}

export const useProgressStore = defineStore('progress', () => {
  const isLoading = ref(false)

  // 今日统计（本地临时）
  const todayQuestionCount = ref(0)
  const todayStats = ref({ correctAnswers: 0, wrongAnswers: 0, quizzesCompleted: 0 })

  // 各章节进度缓存
  const progressMap = ref<Map<string, FrontProgress>>(new Map())
  const wrongQuestions = ref<FrontWrongQuestion[]>([])

  // 未复习的错题
  const unretriedWrongQuestions = computed(() =>
    wrongQuestions.value.filter(w => !w.retried || !w.retryCorrect)
  )

  /** 待复习的错题队列（跨页面传递，避免 URL query 超长被截断） */
  const reviewQueue = ref<FrontWrongQuestion[]>([])

  // 加载用户数据
  async function loadUserData() {
    const auth = useAuthStore()
    if (!auth.currentUser) return

    isLoading.value = true
    try {
      const userId = auth.currentUser.id

      // 加载今日统计（从 quizResults 计算）
      const { results } = await api.getQuizResults(userId)
      const apiResults = results.map(mapQuizResult)

      const today = new Date().toISOString().split('T')[0]
      let qCount = 0
      let cCount = 0
      let quizCount = 0
      for (const r of apiResults) {
        if (r.date.startsWith(today)) {
          qCount += r.totalQuestions
          cCount += r.correctAnswers
          quizCount++
        }
      }
      todayQuestionCount.value = qCount
      todayStats.value = { correctAnswers: cCount, wrongAnswers: qCount - cCount, quizzesCompleted: quizCount }

      // 加载错题（逐条容错：单条解析失败不影响整页，其余错题照常展示）
      const wqData = await api.getWrongQuestions(userId)
      const loaded: FrontWrongQuestion[] = []
      for (const w of wqData.questions) {
        try {
          loaded.push(mapWrongQuestion(w))
        } catch (err) {
          console.warn('[progress] skip broken wrong-question:', w?.id, err)
        }
      }
      wrongQuestions.value = loaded
    } catch (e) {
      console.error('Failed to load user data:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 获取最近学习的章节
  function getLastStudiedChapter(): { subject: string; chapterId: string } | null {
    return null
  }

  // 获取某年级某科的已完成章节数
  function getCompletedCount(subject: string, gradeId: string): number {
    let count = 0
    progressMap.value.forEach((p) => {
      if (p.subject === subject && p.gradeId === gradeId && p.completed) {
        count++
      }
    })
    return count
  }

  // 记录一次答题
  async function recordAnswer(
    userId: string,
    subject: string,
    gradeId: string,
    chapterId: string,
    questionId: string,
    question: string,
    userAnswer: string,
    correctAnswer: string,
    options: string[],
    isCorrect: boolean
  ) {
    try {
      // 如果是错误答案，记录错题走 API
      if (!isCorrect) {
        const { id } = await api.addWrongQuestion({
          userId, chapterId, subject, gradeId,
          questionId, question, userAnswer, correctAnswer, options,
        })
        const wrong: FrontWrongQuestion = {
          id, userId, questionId, chapterId, subject, gradeId,
          question, userAnswer, correctAnswer, options,
          date: new Date().toISOString(),
          retried: false, retryCorrect: false,
        }
        wrongQuestions.value.push(wrong)
      }

      // 更新进度 — 先拿本地缓存的
      const existing = progressMap.value.get(chapterId)
      if (existing) {
        existing.totalQuestions += 1
        existing.correctAnswers += isCorrect ? 1 : 0
        existing.score = existing.correctAnswers
        existing.attempts += 1
        existing.lastAttemptDate = new Date().toISOString()
      } else {
        const p: FrontProgress = {
          id: generateId(), userId, chapterId, subject, gradeId,
          completed: false,
          score: isCorrect ? 1 : 0,
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0,
          attempts: 1,
          lastAttemptDate: new Date().toISOString(),
        }
        progressMap.value.set(chapterId, p)
      }

      // 写入测验结果（走 API）
      await api.addQuizResult({
        userId, chapterId, subject, gradeId,
        score: isCorrect ? 1 : 0,
        totalQuestions: 1,
        correctAnswers: isCorrect ? 1 : 0,
      })

      // 同步更新本地今日统计
      todayQuestionCount.value += 1
      if (isCorrect) {
        todayStats.value.correctAnswers += 1
      } else {
        todayStats.value.wrongAnswers += 1
      }
    } catch (e) {
      console.error('[progress] recordAnswer error:', e)
    }
  }

  return {
    isLoading,
    todayQuestionCount,
    todayStats,
    wrongQuestions,
    unretriedWrongQuestions,
    reviewQueue,
    setReviewQueue(list: FrontWrongQuestion[]) { reviewQueue.value = list },
    clearReviewQueue() { reviewQueue.value = [] },
    loadUserData,
    getLastStudiedChapter,
    getCompletedCount,
    recordAnswer,
    // === 错题操作（API 同步） ===
    async removeWrong(id: string) {
      try {
        await api.deleteWrongQuestion(id)
      } catch (e) {
        console.error('[progress] remove wrong failed:', e)
      }
      wrongQuestions.value = wrongQuestions.value.filter(w => w.id !== id)
    },
    async clearAllWrong() {
      const ids = wrongQuestions.value.map(w => w.id)
      for (const id of ids) {
        try { await api.deleteWrongQuestion(id) } catch (e) { console.error('[progress] clear wrong:', e) }
      }
      wrongQuestions.value = []
    },
    async clearMasteredWrong() {
      const mastered = wrongQuestions.value.filter(w => w.retried && w.retryCorrect)
      for (const w of mastered) {
        try { await api.deleteWrongQuestion(w.id) } catch (e) { console.error('[progress] clear mastered:', e) }
      }
      wrongQuestions.value = wrongQuestions.value.filter(w => !(w.retried && w.retryCorrect))
    },
    /** 复习结果同步：retried + retryCorrect 写回 API 并刷新本地状态 */
    async updateWrongRetry(id: string, retried: boolean, retryCorrect: boolean) {
      try {
        await api.updateWrongQuestionRetry(id, retried, retryCorrect)
      } catch (e) {
        console.error('[progress] update wrong retry failed:', e)
      }
      const w = wrongQuestions.value.find(x => x.id === id)
      if (w) {
        w.retried = retried
        w.retryCorrect = retryCorrect
      }
    },
  }
})
