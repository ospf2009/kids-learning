<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useRouter } from 'vue-router'
import { computed, onMounted } from 'vue'
import { getGradeName } from '@/data/grades'
import { playClickSound } from '@/utils/sound'

const userStore = useUserStore()
const authStore = useAuthStore()
const progressStore = useProgressStore()
const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

onMounted(async () => {
  userStore.loadFromLocalStorage()
  userStore.initDailyTasks()
  await progressStore.loadUserData()
})

const lastStudied = computed(() => {
  const p = progressStore.getLastStudiedChapter()
  return p
})

const subjectCards = [
  { id: 'chinese', name: '语文', icon: '书', color: 'var(--color-chinese)', bg: 'var(--color-chinese-bg)', route: '/practice/chinese' },
  { id: 'math', name: '数学', icon: '数', color: 'var(--color-math)', bg: 'var(--color-math-bg)', route: '/practice/math' },
  { id: 'english', name: '英语', icon: '英', color: 'var(--color-english)', bg: 'var(--color-english-bg)', route: '/practice/english' },
]

function go(route: string) { playClickSound(); router.push(route) }

const wrongCount = computed(() => progressStore.unretriedWrongQuestions.length)
</script>

<template>
  <div class="home">
    <!-- 顶部：头像 + 问候 + 连续 -->
    <div class="top-card">
      <div class="top-row">
        <div class="avatar-area" @click="go('/profile')">
          <div class="avatar-ring">
            <div class="avatar-emoji">{{ authStore.avatar || '😊' }}</div>
          </div>
        </div>
        <div class="greeting-area">
          <p class="greeting-line">{{ greeting }}！</p>
          <p class="name-line">{{ authStore.username || '小朋友' }}</p>
          <div class="meta-line">
            <span class="grade-tag">{{ getGradeName(authStore.grade) }}</span>
            <span class="star-count">★ {{ userStore.stars }}</span>
          </div>
        </div>
        <div v-if="userStore.streak > 0" class="streak-badge">
          <span class="streak-num">{{ userStore.streak }}</span>
          <span class="streak-label">天</span>
        </div>
      </div>
      <!-- 进度条 -->
      <div class="level-bar">
        <div class="level-bar-top">
          <span class="level-label">{{ userStore.currentLevel?.icon }} {{ userStore.currentLevel?.name }}</span>
          <span class="level-next">{{ userStore.nextLevel ? userStore.nextLevel.name + ' 还需 ' + (userStore.nextLevel.minStars - userStore.stars) + '★' : '满级' }}</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: userStore.levelProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 快捷入口：4格 -->
    <div class="quick-grid">
      <div class="quick-item" @click="go('/daily-challenge')">
        <div class="qi-icon qi-fire">&#x1F525;</div>
        <div class="qi-label">每日挑战</div>
      </div>
      <div class="quick-item" @click="go('/wrong-book')">
        <div class="qi-icon qi-book">&#x1F4D6;</div>
        <div class="qi-label">错题本</div>
        <div v-if="wrongCount > 0" class="qi-badge">{{ wrongCount }}</div>
      </div>
      <div class="quick-item" @click="go('/rewards')">
        <div class="qi-icon qi-star">&#x2605;</div>
        <div class="qi-label">奖励中心</div>
      </div>
      <div class="quick-item" @click="go('/games')">
        <div class="qi-icon qi-game">&#x1F3AE;</div>
        <div class="qi-label">游戏</div>
      </div>
    </div>

    <!-- 今日统计 -->
    <div class="section">
      <h2 class="section-title">今日学习</h2>
      <div class="stat-row">
        <div class="stat-block">
          <span class="stat-num">{{ progressStore.todayQuestionCount }}</span>
          <span class="stat-tag">做题</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-block">
          <span class="stat-num success">{{ progressStore.todayStats.correctAnswers }}</span>
          <span class="stat-tag">答对</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-block">
          <span class="stat-num">{{ progressStore.todayStats.correctAnswers + progressStore.todayStats.wrongAnswers > 0
            ? Math.round(progressStore.todayStats.correctAnswers / (progressStore.todayStats.correctAnswers + progressStore.todayStats.wrongAnswers) * 100)
            : 0 }}%</span>
          <span class="stat-tag">正确率</span>
        </div>
      </div>
    </div>

    <!-- 学科入口 -->
    <div class="section">
      <h2 class="section-title">章节练习</h2>
      <div class="subject-grid">
        <div v-for="s in subjectCards" :key="s.id" class="subject-card" :style="{ '--sc': s.color, '--sc-bg': s.bg }" @click="go(s.route)">
          <div class="sc-icon">{{ s.icon }}</div>
          <div class="sc-name">{{ s.name }}</div>
          <div class="sc-arrow">&rarr;</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 0 0 var(--space-8) 0;
  animation: fadeInUp 0.3s ease;
}

/* ===== 顶部卡片 ===== */
.top-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.top-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}
.avatar-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F59E0B, #F97316);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(245,158,11,0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
}
.avatar-ring:hover { transform: scale(1.05); }
.avatar-emoji { font-size: 26px; line-height: 1; }

.greeting-area { flex: 1; }
.greeting-line { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 2px; }
.name-line { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.meta-line { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-xs); }
.grade-tag { background: var(--bg-input); padding: 2px 8px; border-radius: var(--radius-sm); color: var(--text-secondary); }
.star-count { color: #F59E0B; font-weight: 600; }

.streak-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #FF6B6B, #F97316);
  border-radius: var(--radius-md);
  color: white;
  flex-shrink: 0;
}
.streak-num { font-size: 20px; font-weight: 800; line-height: 1; }
.streak-label { font-size: 10px; opacity: 0.85; }

/* 等级进度条 */
.level-bar { margin-top: var(--space-3); }
.level-bar-top { display: flex; justify-content: space-between; font-size: var(--font-size-xs); margin-bottom: 6px; }
.level-label { font-weight: 600; color: var(--text-primary); }
.level-next { color: var(--text-tertiary); }
.progress-bar { height: 6px; border-radius: var(--radius-full); }
.fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg, #F59E0B, #F97316); transition: width 0.5s ease; }

/* ===== 快捷入口 ===== */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: var(--space-5);
}
.quick-item {
  position: relative;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4) 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.quick-item:hover { border-color: #D1D5DB; box-shadow: var(--shadow-sm); transform: translateY(-2px); }
.qi-icon { width: 36px; height: 36px; margin: 0 auto 6px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; }
.qi-fire { background: #FFF7ED; }
.qi-book { background: #EFF6FF; }
.qi-star { background: #FFFBEB; }
.qi-game { background: #F0FDF4; }
.qi-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary); }
.qi-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 通用区域 ===== */
.section { margin-bottom: var(--space-5); }
.section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 今日统计 */
.stat-row {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.stat-block { flex: 1; text-align: center; }
.stat-num { display: block; font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary); }
.stat-num.success { color: var(--color-success); }
.stat-tag { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; display: block; }
.stat-divider { width: 1px; height: 32px; background: var(--border-color); flex-shrink: 0; }

/* 学科入口 */
.subject-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.subject-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.subject-card:hover {
  border-color: var(--sc);
  box-shadow: 0 0 0 1px var(--sc);
  transform: translateY(-2px);
}
.sc-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 6px;
  border-radius: var(--radius-md);
  background: var(--sc-bg);
  color: var(--sc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}
.sc-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.sc-arrow { position: absolute; bottom: 6px; right: 8px; font-size: 12px; color: var(--text-tertiary); opacity: 0; transition: opacity 0.2s; }
.subject-card:hover .sc-arrow { opacity: 1; }
</style>
