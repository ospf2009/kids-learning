/**
 * 认证状态管理
 * 使用后端 API 存储
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type ApiUser } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<ApiUser | null>(null)
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
        const { user } = await userApi.get(savedUserId)
        if (user) {
          currentUser.value = user
        }
      } catch (e) {
        console.error('Failed to restore session:', e)
        localStorage.removeItem('kids-learning-current-user')
      }
    }
  }

  // 注册
  async function register(username: string, password: string, grade: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const { user } = await userApi.register(username, password, grade)
      currentUser.value = user
      localStorage.setItem('kids-learning-current-user', user.id)
      return true
    } catch (e: any) {
      error.value = e.message || '注册失败'
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
      const { user } = await userApi.login(username, password)
      currentUser.value = user
      localStorage.setItem('kids-learning-current-user', user.id)
      return true
    } catch (e: any) {
      error.value = e.message || '登录失败'
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
      const { user } = await userApi.update(currentUser.value.id, { grade: newGrade })
      currentUser.value = user
    } catch (e) {
      console.error('Update grade failed:', e)
    }
  }

  // 更新头像
  async function updateAvatar(newAvatar: string) {
    if (!currentUser.value) return
    try {
      const { user } = await userApi.update(currentUser.value.id, { avatar: newAvatar })
      currentUser.value = user
    } catch (e) {
      console.error('Update avatar failed:', e)
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
