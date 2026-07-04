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
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>个人中心</h1>
    </div>

    <!-- 头像信息 -->
    <div class="profile-card">
      <div class="pc-avatar">{{ authStore.avatar || '&#x1F60A;' }}</div>
      <div class="pc-name">{{ authStore.username }}</div>
      <span class="pc-grade">{{ getGradeName(authStore.grade) }}</span>
    </div>

    <!-- 设置 -->
    <div class="settings">
      <div class="setting-item" @click="showGradePicker = !showGradePicker">
        <span class="si-label">切换年级</span>
        <span class="si-value">{{ getGradeName(authStore.grade) }} &rarr;</span>
      </div>
      <div v-if="showGradePicker" class="grade-list">
        <div v-for="g in grades" :key="g.id"
          class="grade-opt"
          :class="{ active: g.id === authStore.grade }"
          @click="changeGrade(g.id)">{{ g.name }}</div>
      </div>

      <div class="setting-item" @click="authStore.logout(); router.push('/login')">
        <span class="si-label" style="color: var(--color-danger);">退出登录</span>
        <span class="si-value">&rarr;</span>
      </div>
    </div>

    <!-- 说明 -->
    <div class="notice">
      <p>数据保存在本设备浏览器中，更换设备需要重新注册。</p>
      <p>支持一年级上/下、二年级上/下，共4个年级。</p>
    </div>
  </div>
</template>

<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { font-size: var(--font-size-lg); }

.profile-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  text-align: center;
  margin-bottom: var(--space-5);
}
.pc-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #F59E0B);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin: 0 auto var(--space-3);
  box-shadow: 0 2px 8px rgba(232,99,99,0.3);
}
.pc-name { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2); }
.pc-grade { font-size: var(--font-size-xs); background: var(--bg-input); padding: 3px 12px; border-radius: var(--radius-full); color: var(--text-secondary); }

.settings {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-5);
}
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  cursor: pointer;
  border-bottom: 1px solid var(--border-color-light);
  transition: background 0.15s;
}
.setting-item:last-of-type { border-bottom: none; }
.setting-item:hover { background: var(--bg-card-hover); }
.si-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.si-value { font-size: var(--font-size-sm); color: var(--text-tertiary); }

.grade-list { border-top: 1px solid var(--border-color); }
.grade-opt {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  cursor: pointer;
  border-bottom: 1px solid var(--border-color-light);
  transition: all 0.15s;
}
.grade-opt:last-child { border-bottom: none; }
.grade-opt:hover { background: var(--bg-card-hover); }
.grade-opt.active { background: var(--color-math-bg); color: var(--color-math); font-weight: 700; }

.notice {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.6;
}
.notice p { margin-bottom: 4px; }
.notice p:last-child { margin-bottom: 0; }
</style>
