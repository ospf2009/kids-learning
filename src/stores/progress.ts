/**
 * 学习进度管理
 * 记录做题数、正确率、章节完成情况
 * 使用后端 API
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { wrongDB, quizDB, generateId, type DBWrongQuestion } from '@/db'

export const useProgressStore = defineStore('progress', () => {
  const isLoading = ref(false)

  // 今日统计（本地临时）
  const todayQuestionCount = ref(0)
  const todayStats = ref({ correctAnswers: 0, wrongAnswers: 0, quizzesCompleted: 0 })

  // 错题列表
  const wrongQuestions = ref<DBWrongQuestion[]>([])

  // 未复习的错题
  const unretriedWrongQuestions = computed(() =>
    wrongQuestions.value.filter(w => !w.retried || !w.retryCorrect)
  )

  // 加载用户数据（错题、今日统计）
  async function loadUserData() {
    const auth = useAuthStore()
    if (!auth.currentUser) return

    isLoading.value = true
    try {
      const userId = auth.currentUser.id

      // 加载今日统计
      const results = await quizDB.getByUser(userId)
      const today = new Date().toISOString().split('T')[0]
      let qCount = 0
      let cCount = 0
      let quizCount = 0
      for (const r of results) {
        if (r.date && r.date.startsWith(today)) {
          qCount += r.totalQuestions || 0
          cCount += r.correctAnswers || 0
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

  // 获取某年级某科的已完成章节数
  function getCompletedCount(subject: string, gradeId: string): number {
    return 0 // 简化实现，可通过 user store 的 completedLessons 获取
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
    // 错误答案 → 记录错题到 API
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
      try {
        await wrongDB.add(wrong)
        wrongQuestions.value.unshift(wrong)
      } catch (e) {
        console.error('Failed to record wrong question:', e)
      }
    }
  }

  return {
    isLoading,
    todayQuestionCount,
    todayStats,
    wrongQuestions,
    unretriedWrongQuestions,
    loadUserData,
    getCompletedCount,
    recordAnswer,
  }
})
