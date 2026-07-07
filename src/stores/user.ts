import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { api } from '@/utils/api'
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

export interface UserState {
  name: string
  stars: number
  streak: number
  lastStudyDate: string
  completedLessons: Record<string, string[]>
  achievements: string[]
  badges: string[]
  dailyTasks: DailyTask[]
  todayDate: string
}

export const useUserStore = defineStore('user', () => {
  const name = ref<string>('小朋友')
  const stars = ref<number>(0)
  const streak = ref<number>(0)
  const lastStudyDate = ref<string>('')
  const completedLessons = ref<Record<string, string[]>>({})
  const achievements = ref<string[]>([])
  const badges = ref<string[]>([])
  const dailyTasks = ref<DailyTask[]>([])

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

  // 从 API 同步用户数据到本地 store
  async function syncFromApi() {
    const auth = useAuthStore()
    if (!auth.currentUser) return

    const apiUser = auth.currentUser
    stars.value = apiUser.stars
    streak.value = apiUser.streak
    lastStudyDate.value = apiUser.lastStudyDate
    completedLessons.value = apiUser.completedLessons || {}
    achievements.value = apiUser.achievements || []
    badges.value = apiUser.badges || []
  }

  // 初始化每日任务
  function initDailyTasks() {
    const today = new Date().toISOString().split('T')[0]
    if (lastStudyDate.value === today && dailyTasks.value.length > 0) return

    dailyTasks.value = [
      { id: 'daily-chinese', subject: 'chinese', title: '语文练习', icon: '[书]', total: 5, completed: 0, isCompleted: false },
      { id: 'daily-math', subject: 'math', title: '数学练习', icon: '[数]', total: 5, completed: 0, isCompleted: false },
      { id: 'daily-english', subject: 'english', title: '英语练习', icon: '[英]', total: 5, completed: 0, isCompleted: false },
    ]

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastStudyDate.value === yesterdayStr) {
      // 连续学习
    } else if (lastStudyDate.value !== today) {
      streak.value = 0
    }
  }

  // 完成题目
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
  }

  // 完成课程
  async function completeLesson(subject: string, lessonId: string) {
    if (!completedLessons.value[subject]) {
      completedLessons.value[subject] = []
    }
    if (!completedLessons.value[subject]!.includes(lessonId)) {
      completedLessons.value[subject]!.push(lessonId)
    }

    const today = new Date().toISOString().split('T')[0] || ''
    if (lastStudyDate.value !== today) {
      streak.value++
      lastStudyDate.value = today
    }

    await saveToServer()
    saveToLocalStorage()
  }

  // 解锁成就
  function unlockAchievement(achievementId: string) {
    if (!achievements.value.includes(achievementId)) {
      achievements.value.push(achievementId)
      saveToServer()
      saveToLocalStorage()
    }
  }

  // 兑换奖励
  function redeemReward(cost: number): boolean {
    if (stars.value >= cost) {
      stars.value -= cost
      saveToServer()
      saveToLocalStorage()
      return true
    }
    return false
  }

  // 将用户数据同步到 API 服务器
  async function saveToServer() {
    const auth = useAuthStore()
    if (!auth.currentUser) return
    try {
      await api.updateUser(auth.currentUser.id, {
        stars: stars.value,
        streak: streak.value,
        lastStudyDate: lastStudyDate.value,
        completedLessons: completedLessons.value,
        achievements: achievements.value,
        badges: badges.value,
      })
      // 同步回来更新 auth store
      const { user } = await api.getUser(auth.currentUser.id)
      auth.currentUser.stars = user.stars
      auth.currentUser.streak = user.streak
      auth.currentUser.lastStudyDate = user.last_study_date
      auth.currentUser.completedLessons = JSON.parse(user.completed_lessons || '{}')
      auth.currentUser.achievements = JSON.parse(user.achievements || '[]')
      auth.currentUser.badges = JSON.parse(user.badges || '[]')
    } catch (e) {
      console.error('[user] saveToServer failed:', e)
    }
  }

  // 持久化备用（localStorage）
  function saveToLocalStorage() {
    const data: UserState = {
      name: name.value,
      stars: stars.value,
      streak: streak.value,
      lastStudyDate: lastStudyDate.value,
      completedLessons: completedLessons.value,
      achievements: achievements.value,
      badges: badges.value,
      dailyTasks: dailyTasks.value,
      todayDate: new Date().toISOString().split('T')[0] || '',
    }
    localStorage.setItem('kids-learning-user', JSON.stringify(data))
  }

  function loadFromLocalStorage() {
    const raw = localStorage.getItem('kids-learning-user')
    if (!raw) return

    try {
      const data: UserState = JSON.parse(raw)
      name.value = data.name || '小朋友'
      stars.value = data.stars || 0
      streak.value = data.streak || 0
      lastStudyDate.value = data.lastStudyDate || ''
      completedLessons.value = (data.completedLessons || {}) as Record<string, string[]>
      achievements.value = (data.achievements || []) as string[]
      badges.value = (data.badges || []) as string[]
      dailyTasks.value = data.dailyTasks || []
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
  }

  return {
    name, stars, streak, lastStudyDate,
    completedLessons, achievements, badges, dailyTasks,
    currentLevel, nextLevel, levelProgress,
    totalCompleted, todayCompleted, todayProgress,
    syncFromApi, initDailyTasks, completeQuestion, completeLesson,
    unlockAchievement, redeemReward,
    saveToServer, saveToLocalStorage, loadFromLocalStorage,
  }
})
