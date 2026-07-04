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
  } catch {
    errorMsg.value = '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-emoji">&#x2728;</div>
      <h1 class="auth-title">创建账号</h1>
      <p class="auth-sub">开启学习之旅</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="输入用户名" maxlength="20" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入密码" maxlength="32" />
        </div>
        <div class="field">
          <label>年级</label>
          <select v-model="grade">
            <option v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary auth-btn" :disabled="loading">
          {{ loading ? '注册中…' : '注册并开始' }}
        </button>
      </form>

      <p class="switch-link">
        已有账号？
        <router-link to="/login" class="link">登录</router-link>
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
.field input, .field select {
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
.field input:focus, .field select:focus {
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
