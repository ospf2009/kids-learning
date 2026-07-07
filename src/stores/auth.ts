/**
 * 认证状态管理
 * 注册/登录/用户信息走 API，updateGrade/updateAvatar 同时写 API 和 localStorage
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, type ApiUser } from '@/utils/api'

/** 前端用户数据类型（兼容 API 返回的下划线命名） */
export interface FrontUser {
  id: string
  username: string
  grade: string
  avatar: string
  stars: number
  streak: number
  lastStudyDate: string
  completedLessons: Record<string, string[]>
  achievements: string[]
  badges: string[]
  createdAt: string
}

/** 将 API 返回的 user 转为前端格式 */
function mapApiUser(apiUser: ApiUser): FrontUser {
  return {
    id: apiUser.id,
    username: apiUser.username,
    grade: apiUser.grade,
    avatar: apiUser.avatar,
    stars: apiUser.stars,
    streak: apiUser.streak,
    lastStudyDate: apiUser.last_study_date,
    completedLessons: JSON.parse(apiUser.completed_lessons || '{}'),
    achievements: JSON.parse(apiUser.achievements || '[]'),
    badges: JSON.parse(apiUser.badges || '[]'),
    createdAt: apiUser.created_at,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<FrontUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const username = computed(() => currentUser.value?.username || '')
  const grade = computed(() => currentUser.value?.grade || 'grade1-down')
  const avatar = computed(() => currentUser.value?.avatar || 'S')

  // 从 localStorage 恢复登录状态
  async function restoreSession() {
    const savedUserId = localStorage.getItem('kids-learning-current-user')
    if (savedUserId) {
      try {
        const { user } = await api.getUser(savedUserId)
        currentUser.value = mapApiUser(user)
      } catch (e) {
        console.error('[auth] restoreSession failed:', e)
        localStorage.removeItem('kids-learning-current-user')
      }
    }
  }

  // 注册
  async function register(username: string, password: string, grade: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const { user } = await api.register(username, password, grade)
      currentUser.value = mapApiUser(user)
      localStorage.setItem('kids-learning-current-user', user.id)
      return true
    } catch (e: any) {
      console.error('Register failed:', e)
      error.value = e.message || '注册失败，请重试'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 登录
  async function login(username: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const { user } = await api.login(username, password)
      currentUser.value = mapApiUser(user)
      localStorage.setItem('kids-learning-current-user', user.id)
      return true
    } catch (e: any) {
      console.error('Login failed:', e)
      error.value = e.message || '登录失败，请重试'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  function logout() {
    currentUser.value = null
    localStorage.removeItem('kids-learning-current-user')
  }

  // 更新年级
  async function updateGrade(newGrade: string) {
    if (!currentUser.value) return
    try {
      const { user } = await api.updateUser(currentUser.value.id, { grade: newGrade })
      currentUser.value = mapApiUser(user)
    } catch (e) {
      console.error('[auth] updateGrade failed:', e)
    }
  }

  // 更新头像
  async function updateAvatar(newAvatar: string) {
    if (!currentUser.value) return
    try {
      const { user } = await api.updateUser(currentUser.value.id, { avatar: newAvatar })
      currentUser.value = mapApiUser(user)
    } catch (e) {
      console.error('[auth] updateAvatar failed:', e)
    }
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  return {
    currentUser, isLoading, error,
    isLoggedIn, username, grade, avatar,
    restoreSession, register, login, logout,
    updateGrade, updateAvatar, clearError,
  }
})
