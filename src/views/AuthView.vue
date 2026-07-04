<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { grades } from '@/data/grades'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const grade = ref('grade1-up')
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  if (mode.value === 'register') {
    const result = await authStore.register(username.value.trim(), password.value, grade.value)
    if (!result.ok) { errorMsg.value = result.msg; return }
  } else {
    const result = await authStore.login(username.value.trim(), password.value)
    if (!result.ok) { errorMsg.value = result.msg; return }
  }
  router.push('/')
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="logo">⭐</div>
      <h1>学习乐园</h1>
      <p class="subtitle">{{ mode === 'login' ? '欢迎回来！' : '开始学习之旅' }}</p>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'; errorMsg = ''">登录</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'; errorMsg = ''">注册</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>👤 用户名</label>
          <input v-model="username" type="text" placeholder="输入用户名" maxlength="20" />
        </div>
        <div class="field">
          <label>🔒 密码</label>
          <input v-model="password" type="password" placeholder="输入密码" maxlength="32" />
        </div>
        <div class="field" v-if="mode === 'register'">
          <label>📚 年级</label>
          <select v-model="grade">
            <option v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="error" v-if="errorMsg">{{ errorMsg }}</div>

        <button type="submit" class="submit-btn">
          {{ mode === 'login' ? '[R] 登录' : '* 注册并开始' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
.auth-card { background: white; border-radius: 24px; padding: 32px; max-width: 400px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.1); text-align: center; }
.logo { font-size: 64px; margin-bottom: 8px; }
h1 { font-size: 28px; color: #333; margin-bottom: 4px; }
.subtitle { color: #888; margin-bottom: 24px; }
.tabs { display: flex; gap: 8px; margin-bottom: 24px; background: #F5F5F5; border-radius: 12px; padding: 4px; }
.tabs button { flex: 1; padding: 10px; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; background: transparent; color: #888; transition: all 0.2s; }
.tabs button.active { background: white; color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.field { text-align: left; margin-bottom: 16px; }
.field label { display: block; font-size: 14px; font-weight: 600; color: #555; margin-bottom: 6px; }
.field input, .field select { width: 100%; padding: 12px 16px; border: 2px solid #EEE; border-radius: 12px; font-size: 16px; font-family: inherit; transition: border-color 0.2s; box-sizing: border-box; }
.field input:focus, .field select:focus { outline: none; border-color: var(--color-primary); }
.error { color: #FF6B6B; font-size: 14px; margin-bottom: 16px; }
.submit-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--color-primary), #FF8E8E); color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
.submit-btn:hover { transform: scale(1.02); }
.submit-btn:active { transform: scale(0.98); }
</style>
