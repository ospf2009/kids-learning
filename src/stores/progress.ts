/**
 * 学习进度管理
 * 记录做题数、正确率、章节完成情况
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { progressDB, quizDB, wrongDB, generateId, type DBProgress, type DBWrongQuestion, type DBQuizResult } from '@/db'

export const useProgressStore = defineStore('progress', () => {
  const isLoading = ref(false)

  // 今日统计（本地临时）
  const todayQuestionCount = ref(0)
  const todayStats = ref({ correctAnswers: 0, wrongAnswers: 0, quizzesCompleted: 0 })

  // 各章节进度缓存
  const progressMap = ref<Map<string, DBProgress>>(new Map())
  const wrongQuestions = ref<DBWrongQuestion[]>([])

  // 未复习的错题
  const unretriedWrongQuestions = computed(() =>
    wrongQuestions.value.filter(w => !w.retried || !w.retryCorrect)
  )

  // 加载用户数据
  async function loadUserData() {
    const auth = useAuthStore()
    if (!auth.currentUser) return

    isLoading.value = true
    try {
      const userId = auth.currentUser.id

      // 加载今日统计（从 quizResults 计算）
      const results = await quizDB.getByUser(userId)
      const today = new Date().toISOString().split('T')[0]
      let qCount = 0
      let cCount = 0
      let quizCount = 0
      for (const r of results) {
        if (r.date.startsWith(today)) {
          qCount += r.totalQuestions
          cCount += r.correctAnswers
          quizCount++
        }
      }
      todayQuestionCount.value = qCount
      todayStats.value = { correctAnswers: cCount, wrongAnswers: qCount - cCount, quizzesCompleted: quizCount }

      // 加载错题
      wrongQuestions.value = await wrongDB.getByUser(userId)
    } catch (e) {
      console.error('Failed to load user data:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 获取最近学习的章节
  function getLastStudiedChapter(): { subject: string; chapterId: string } | null {
    return null // 简化实现
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
      // 如果是错误答案，记录错题
      if (!isCorrect) {
        const wrong: DBWrongQuestion = {
          id: generateId(),
          userId,
          questionId,
          chapterId,
          subject,
          gradeId,
          question,
          userAnswer,
          correctAnswer,
          options,
          date: new Date().toISOString(),
          retried: false,
          retryCorrect: false,
        }
        await wrongDB.add(wrong)
        wrongQuestions.value.push(JSON.parse(JSON.stringify(wrong)))
      }

      // 更新进度 — 所有数据深拷贝后操作，避免 Proxy 污染 IDB
      let progress = await progressDB.getByUserChapter(userId, chapterId)
      if (!progress) {
        const p: DBProgress = {
          id: generateId(),
          userId,
          chapterId,
          subject,
          gradeId,
          completed: false,
          score: isCorrect ? 1 : 0,
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0,
          attempts: 1,
          lastAttemptDate: new Date().toISOString(),
        }
        await progressDB.add(p)
        progressMap.value.set(chapterId, p)
      } else {
        const p = JSON.parse(JSON.stringify(progress))
        p.totalQuestions += 1
        p.correctAnswers += isCorrect ? 1 : 0
        p.score = p.correctAnswers
        p.attempts += 1
        p.lastAttemptDate = new Date().toISOString()
        await progressDB.put(p)
        progressMap.value.set(chapterId, p)
      }

      // 写入测验结果表（用于今日统计）
      const today = new Date().toISOString().split('T')[0]
      const quizResult: DBQuizResult = {
        id: generateId(),
        userId,
        chapterId,
        subject,
        gradeId,
        score: isCorrect ? 1 : 0,
        totalQuestions: 1,
        correctAnswers: isCorrect ? 1 : 0,
        date: new Date().toISOString(),
      }
      await quizDB.add(quizResult)

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
    loadUserData,
    getLastStudiedChapter,
    getCompletedCount,
    recordAnswer,
  }
})
