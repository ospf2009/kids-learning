<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { grades, getGradeName } from '@/data/grades'
import { ref } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const showGradePicker = ref(false)

function changeGrade(id: string) {
  authStore.updateGrade(id)
  showGradePicker.value = false
}

function goBack() { router.push('/') }
</script>

<template>
  <div class="profile-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>👤 个人中心</h1>
    </header>

    <div class="profile-card">
      <div class="avatar-big">{{ authStore.avatar }}</div>
      <div class="username">{{ authStore.username }}</div>
      <div class="grade-tag">{{ getGradeName(authStore.grade) }}</div>
    </div>

    <div class="settings">
      <div class="setting-item" @click="showGradePicker = !showGradePicker">
        <span class="setting-label">📚 切换年级</span>
        <span class="setting-value">{{ getGradeName(authStore.grade) }} ▸</span>
      </div>
      <div class="grade-picker" v-if="showGradePicker">
        <div
          v-for="g in grades"
          :key="g.id"
          class="grade-option"
          :class="{ active: g.id === authStore.grade }"
          @click="changeGrade(g.id)"
        >
          {{ g.name }}
        </div>
      </div>

      <div class="setting-item" @click="authStore.logout(); router.push('/login')">
        <span class="setting-label">🚪 退出登录</span>
        <span class="setting-value">-></span>
      </div>
    </div>

    <div class="info-section">
      <h3>💡 说明</h3>
      <p>数据保存在本设备浏览器中，更换设备需要重新注册。</p>
      <p style="margin-top: 8px;">支持一年级上/下、二年级上/下，共4个年级。</p>
    </div>
  </div>
</template>

<style scoped>
.profile-page { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; }
.back-btn:hover { border-color: var(--color-primary); }
h1 { font-size: 20px; }

.profile-card { background: white; border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 16px; }
.avatar-big { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #FF6B6B, #FFD700); display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 12px; }
.username { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 4px; }
.grade-tag { font-size: 13px; color: #888; background: #F5F5F5; display: inline-block; padding: 4px 12px; border-radius: 12px; }

.settings { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 16px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; cursor: pointer; border-bottom: 1px solid #F5F5F5; }
.setting-item:last-child { border-bottom: none; }
.setting-item:hover { background: #F9F9F9; }
.setting-label { font-size: 15px; font-weight: 600; color: #333; }
.setting-value { font-size: 14px; color: #888; }
.grade-picker { border-top: 1px solid #F0F0F0; }
.grade-option { padding: 12px 16px; text-align: center; cursor: pointer; font-size: 15px; border-bottom: 1px solid #F5F5F5; }
.grade-option:last-child { border-bottom: none; }
.grade-option:hover { background: #F5F5F5; }
.grade-option.active { background: #E8FFF8; color: var(--color-primary); font-weight: 700; }

.info-section { background: #FFF9E6; border-radius: 16px; padding: 16px; }
.info-section h3 { font-size: 15px; margin-bottom: 8px; }
.info-section p { font-size: 13px; color: #888; line-height: 1.6; }
</style>
