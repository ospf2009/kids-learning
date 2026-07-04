/**
 * 认证状态管理
 * 纯前端，IndexedDB 存储
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userDB, hashPassword, generateId, type DBUser } from '@/db'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<DBUser | null>(null)
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
        const user = await userDB.get(savedUserId)
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
      // 检查用户名是否已存在
      const existing = await userDB.getByUsername(username)
      if (existing) {
        error.value = '用户名已存在'
        return false
      }

      // 创建用户
      const passwordHash = await hashPassword(password)
      const user: DBUser = {
        id: generateId(),
        username,
        passwordHash,
        grade,
        avatar: 'S',
        createdAt: new Date().toISOString(),
      }

      await userDB.add(user)
      currentUser.value = user
      localStorage.setItem('kids-learning-current-user', user.id)
      return true
    } catch (e) {
      console.error('Register failed:', e)
      error.value = '注册失败，请重试'
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
      const user = await userDB.getByUsername(username)
      if (!user) {
        error.value = '用户名不存在'
        return false
      }

      const passwordHash = await hashPassword(password)
      if (user.passwordHash !== passwordHash) {
        error.value = '密码错误'
        return false
      }

      currentUser.value = user
      localStorage.setItem('kids-learning-current-user', user.id)
      return true
    } catch (e) {
      console.error('Login failed:', e)
      error.value = '登录失败，请重试'
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
    currentUser.value.grade = newGrade
    await userDB.put(currentUser.value)
  }

  // 更新头像
  async function updateAvatar(newAvatar: string) {
    if (!currentUser.value) return
    currentUser.value.avatar = newAvatar
    await userDB.put(currentUser.value)
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
