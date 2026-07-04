import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { userApi, dailyApi } from '@/api'
import { getCurrentLevel, getNextLevel } from '@/data/rewards'

export interface DailyTask {
  id: string
  subject: 'chinese' | 'math' | 'english'
  title: string
  icon: string
  total: number
  completed: number
  isCompleted: boolean
}

export const useUserStore = defineStore('user', () => {
  // === 状态 ===
  const name = ref('小朋友')
  const stars = ref(0)
  const streak = ref(0)
  const lastStudyDate = ref('')
  const completedLessons = ref<Record<string, string[]>>({})
  const achievements = ref<string[]>([])
  const badges = ref<string[]>([])
  const dailyTasks = ref<DailyTask[]>([])

  // === 计算属性 ===
  const currentLevel = computed(() => getCurrentLevel(stars.value))
  const nextLevel = computed(() => getNextLevel(stars.value))
  const levelProgress = computed(() => {
    if (!nextLevel.value || !currentLevel.value) return 100
    const current = stars.value - currentLevel.value.minStars
    const needed = nextLevel.value.minStars - currentLevel.value.minStars
    return Math.min(100, Math.round((current / needed) * 100))
  })

  const totalCompleted = computed(() => {
    return Object.values(completedLessons.value).reduce((sum, arr) => sum + arr.length, 0)
  })

  const todayCompleted = computed(() => {
    return dailyTasks.value.filter(t => t.isCompleted).length
  })

  const todayProgress = computed(() => {
    if (dailyTasks.value.length === 0) return 0
    return Math.round((todayCompleted.value / dailyTasks.value.length) * 100)
  })

  // 获取当前登录用户的 ID
  function getUserId(): string | null {
    const auth = useAuthStore()
    return auth.currentUser?.id || null
  }

  // 同步用户数据到 API
  async function syncToServer() {
    const userId = getUserId()
    if (!userId) return

    try {
      await userApi.update(userId, {
        stars: stars.value,
        streak: streak.value,
        lastStudyDate: lastStudyDate.value,
        completedLessons: completedLessons.value,
        achievements: achievements.value,
        badges: badges.value,
      })
    } catch (e) {
      console.error('Sync to server failed:', e)
    }
  }

  // 同步每日任务到 API
  async function syncDailyTasks() {
    const userId = getUserId()
    if (!userId || dailyTasks.value.length === 0) return

    try {
      const today = new Date().toISOString().split('T')[0]
      await dailyApi.save(userId, today, dailyTasks.value)
    } catch (e) {
      console.error('Sync daily tasks failed:', e)
    }
  }

  // === 初始化每日任务 ===
  function initDailyTasks() {
    const today = new Date().toISOString().split('T')[0]
    if (lastStudyDate.value === today && dailyTasks.value.length > 0) return

    dailyTasks.value = [
      { id: 'daily-chinese', subject: 'chinese', title: '语文练习', icon: '[书]', total: 5, completed: 0, isCompleted: false },
      { id: 'daily-math', subject: 'math', title: '数学练习', icon: '[数]', total: 5, completed: 0, isCompleted: false },
      { id: 'daily-english', subject: 'english', title: '英语练习', icon: '[英]', total: 5, completed: 0, isCompleted: false },
    ]

    // 检查连续学习
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastStudyDate.value !== today && lastStudyDate.value !== yesterdayStr) {
      streak.value = 0
    }
  }

  // === 完成题目 ===
  function completeQuestion(subject: 'chinese' | 'math' | 'english', correct: boolean) {
    const task = dailyTasks.value.find(t => t.subject === subject)
    if (task && !task.isCompleted) {
      task.completed = Math.min(task.completed + 1, task.total)
      if (task.completed >= task.total) {
        task.isCompleted = true
      }
    }

    if (correct) {
      stars.value += 2
    } else {
      stars.value += 1
    }

    // 异步同步（不等待完成）
    syncToServer()
    syncDailyTasks()
  }

  // === 完成课程 ===
  function completeLesson(subject: string, lessonId: string) {
    if (!completedLessons.value[subject]) {
      completedLessons.value[subject] = []
    }
    if (!completedLessons.value[subject]!.includes(lessonId)) {
      completedLessons.value[subject]!.push(lessonId)
    }

    // 更新连续学习
    const today = new Date().toISOString().split('T')[0] || ''
    if (lastStudyDate.value !== today) {
      streak.value++
      lastStudyDate.value = today
    }

    syncToServer()
  }

  // === 解锁成就 ===
  function unlockAchievement(achievementId: string) {
    if (!achievements.value.includes(achievementId)) {
      achievements.value.push(achievementId)
      syncToServer()
    }
  }

  // === 兑换奖励 ===
  function redeemReward(cost: number): boolean {
    if (stars.value >= cost) {
      stars.value -= cost
      syncToServer()
      return true
    }
    return false
  }

  // === 从 API 加载用户状态 ===
  async function loadFromServer() {
    const auth = useAuthStore()
    if (!auth.currentUser) return

    try {
      const { user } = await userApi.get(auth.currentUser.id)
      stars.value = user.stars || 0
      streak.value = user.streak || 0
      lastStudyDate.value = user.last_study_date || ''

      try {
        completedLessons.value = JSON.parse(user.completed_lessons || '{}')
      } catch { completedLessons.value = {} }

      try {
        achievements.value = JSON.parse(user.achievements || '[]')
      } catch { achievements.value = [] }

      try {
        badges.value = JSON.parse(user.badges || '[]')
      } catch { badges.value = [] }

      // 加载每日任务
      const today = new Date().toISOString().split('T')[0]
      try {
        const { tasks } = await dailyApi.get(auth.currentUser.id, today)
        if (tasks.length > 0) {
          dailyTasks.value = tasks
        }
      } catch { /* 忽略 */ }

      initDailyTasks()
    } catch (e) {
      console.error('Load from server failed:', e)
    }
  }

  // === 兼容 localStorage（降级方案） ===
  function saveToLocalStorage() {
    // 不再使用 localStorage，但保留接口以防万一
  }

  function loadFromLocalStorage() {
    // 不再使用 localStorage
  }

  return {
    name, stars, streak, lastStudyDate,
    completedLessons, achievements, badges, dailyTasks,
    currentLevel, nextLevel, levelProgress,
    totalCompleted, todayCompleted, todayProgress,
    initDailyTasks, completeQuestion, completeLesson,
    unlockAchievement, redeemReward,
    saveToLocalStorage, loadFromLocalStorage,
    loadFromServer, syncToServer,
  }
})
