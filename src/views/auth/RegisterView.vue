<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { grades } from '@/data/grades'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const grade = ref('grade1-down')
const errorMsg = ref('')
const loading = ref(false)

async function handleRegister() {
  errorMsg.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  try {
    const ok = await authStore.register(username.value.trim(), password.value, grade.value)
    if (ok) {
      router.push('/')
    } else {
      errorMsg.value = authStore.error || '注册失败'
    }
  } catch (e) {
    errorMsg.value = '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="logo">⭐</div>
      <h1>学习乐园</h1>
      <p class="subtitle">开始学习之旅</p>

      <form @submit.prevent="handleRegister">
        <div class="field">
          <label>👤 用户名</label>
          <input v-model="username" type="text" placeholder="输入用户名" maxlength="20" />
        </div>
        <div class="field">
          <label>🔒 密码</label>
          <input v-model="password" type="password" placeholder="输入密码" maxlength="32" />
        </div>
        <div class="field">
          <label>📚 年级</label>
          <select v-model="grade">
            <option v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="error" v-if="errorMsg">{{ errorMsg }}</div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '注册中...' : '* 注册并开始' }}
        </button>
      </form>

      <div class="switch-link">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
.auth-card { background: white; border-radius: 24px; padding: 32px; max-width: 400px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.1); text-align: center; }
.logo { font-size: 64px; margin-bottom: 8px; }
h1 { font-size: 28px; color: #333; margin-bottom: 4px; }
.subtitle { color: #888; margin-bottom: 24px; }
.field { text-align: left; margin-bottom: 16px; }
.field label { display: block; font-size: 14px; font-weight: 600; color: #555; margin-bottom: 6px; }
.field input, .field select { width: 100%; padding: 12px 16px; border: 2px solid #EEE; border-radius: 12px; font-size: 16px; font-family: inherit; transition: border-color 0.2s; box-sizing: border-box; }
.field input:focus, .field select:focus { outline: none; border-color: var(--color-primary); }
.error { color: #FF6B6B; font-size: 14px; margin-bottom: 16px; }
.submit-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--color-primary), #FF8E8E); color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
.submit-btn:hover:not(:disabled) { transform: scale(1.02); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.switch-link { margin-top: 20px; font-size: 14px; color: #888; }
.switch-link a { color: var(--color-primary); text-decoration: none; font-weight: 600; }
</style>
