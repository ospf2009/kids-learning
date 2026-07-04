<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    const ok = await authStore.login(username.value.trim(), password.value)
    if (ok) {
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } else {
      errorMsg.value = authStore.error || '账号或密码错误'
    }
  } catch {
    errorMsg.value = '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-emoji">&#x2B50;</div>
      <h1 class="auth-title">欢迎回来</h1>
      <p class="auth-sub">登录继续学习</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" maxlength="20" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" maxlength="32" />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary auth-btn" :disabled="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="switch-link">
        还没有账号？
        <router-link to="/register" class="link">注册</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
}
.auth-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-6);
  max-width: 380px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  text-align: center;
  animation: fadeInUp 0.3s ease;
}
.auth-emoji { font-size: 48px; margin-bottom: var(--space-3); }
.auth-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.auth-sub { font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--space-6); }
.auth-form { text-align: left; }
.field { margin-bottom: var(--space-4); }
.field label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.field input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-family: inherit;
  background: var(--bg-input);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(232,99,99,0.1);
  background: white;
}
.error-msg { color: var(--color-danger); font-size: var(--font-size-sm); margin-bottom: var(--space-3); }
.auth-btn { width: 100%; padding: 12px; font-size: var(--font-size-md); margin-top: var(--space-2); }
.switch-link { margin-top: var(--space-5); font-size: var(--font-size-sm); color: var(--text-tertiary); }
.link { color: var(--color-primary); font-weight: 600; text-decoration: none; }
.link:hover { text-decoration: underline; }
</style>
