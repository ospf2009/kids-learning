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

const lastStudied = computed(() => progressStore.getLastStudiedChapter())

const subjectCards = [
  { id: 'chinese', name: '语文', icon: '📖', color: 'var(--color-chinese)', route: '/practice/chinese' },
  { id: 'math', name: '数学', icon: '🔢', color: 'var(--color-math)', route: '/practice/math' },
  { id: 'english', name: '英语', icon: '🔤', color: 'var(--color-english)', route: '/practice/english' },
]

function goToSubject(route: string) {
  playClickSound()
  router.push(route)
}

function goToRewards() {
  playClickSound()
  router.push('/rewards')
}

function goToGames() {
  playClickSound()
  router.push('/games')
}

function goToProfile() {
  playClickSound()
  router.push('/profile')
}

function goToWrongBook() {
  playClickSound()
  router.push('/wrong-book')
}

function goToDailyChallenge() {
  playClickSound()
  router.push('/daily-challenge')
}

function continueLastStudy() {
  playClickSound()
  if (lastStudied.value) {
    router.push(`/practice/${lastStudied.value.subject}/${lastStudied.value.chapterId}`)
  }
}
</script>

<template>
  <div class="home">
    <!-- 顶部问候 -->
    <header class="header">
      <div class="greeting-section">
        <div class="avatar" @click="goToProfile">
          {{ authStore.avatar }}
        </div>
        <div class="greeting-text">
          <h1>{{ greeting }}，{{ authStore.username }}！</h1>
          <p class="level-info">
            B {{ getGradeName(authStore.grade) }}
            <span class="stars">* {{ userStore.stars }}</span>
          </p>
        </div>
      </div>
      <div class="streak-badge" v-if="userStore.streak > 0">
        * {{ userStore.streak }}天连续学习
      </div>
    </header>

    <!-- 今日学习统计 -->
    <section class="today-stats">
      <h2 class="section-title">📚 今日学习</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-value">{{ progressStore.todayQuestionCount }}</div>
          <div class="stat-label">做题数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✔</div>
          <div class="stat-value">{{ progressStore.todayStats.correctAnswers }}</div>
          <div class="stat-label">✅ 答对</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{{ progressStore.todayStats.quizzesCompleted }}</div>
          <div class="stat-label">完成测验</div>
        </div>
      </div>
    </section>

    <!-- 快速入口 -->
    <section class="quick-actions">
      <h2 class="section-title">⚡ 快速入口</h2>
      <div class="actions-grid">
        <button class="action-card" @click="continueLastStudy" :disabled="!lastStudied">
          <div class="action-icon">📖</div>
          <div class="action-text">继续上次学习</div>
        </button>
        <button class="action-card" @click="goToDailyChallenge">
          <div class="action-icon">🔥</div>
          <div class="action-text">每日挑战</div>
        </button>
        <button class="action-card" @click="goToWrongBook">
          <div class="action-icon">📋</div>
          <div class="action-text">错题本</div>
          <div class="action-badge" v-if="progressStore.unretriedWrongQuestions.length > 0">
            {{ progressStore.unretriedWrongQuestions.length }}
          </div>
        </button>
        <button class="action-card" @click="goToProfile">
          <div class="action-icon">👤</div>
          <div class="action-text">个人中心</div>
        </button>
      </div>
    </section>

    <!-- 学科入口 -->
    <section class="subjects">
      <h2 class="section-title">📝 章节练习</h2>
      <div class="subjects-grid">
        <div
          v-for="subject in subjectCards"
          :key="subject.id"
          class="subject-card"
          :style="{ '--subject-color': subject.color }"
          @click="goToSubject(subject.route)"
        >
          <div class="subject-emoji">{{ subject.emoji }}</div>
          <div class="subject-icon">{{ subject.icon }}</div>
          <div class="subject-name">{{ subject.name }}</div>
          <div class="subject-progress">
            {{ progressStore.getCompletedCount(subject.id, authStore.grade) }} 章已完成
          </div>
          <div class="subject-arrow">-></div>
        </div>
      </div>
    </section>

    <!-- 游戏入口 -->
    <section class="games">
      <h2 class="section-title">🎮 游戏中心</h2>
      <div class="game-card" @click="goToGames">
        <div class="game-icon">🎮</div>
        <div class="game-info">
          <div class="game-name">⭐ 接星星</div>
          <div class="game-desc">接住星星避开炸弹，看你能得多少分！</div>
        </div>
        <div class="game-arrow">-></div>
      </div>
    </section>

    <!-- 奖励入口 -->
    <section class="rewards">
      <h2 class="section-title">🏆 奖励中心</h2>
      <div class="reward-card" @click="goToRewards">
        <div class="reward-icon">⭐</div>
        <div class="reward-info">
          <div class="reward-name">我的星星：{{ userStore.stars }}</div>
          <div class="reward-level">{{ userStore.currentLevel?.icon }} {{ userStore.currentLevel?.name }}</div>
        </div>
        <div class="reward-arrow">-></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding-bottom: 32px;
}

/* === 头部 === */
.header {
  background: linear-gradient(135deg, #FFFAF5, #FFF0E0);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.greeting-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), #FFD700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  cursor: pointer;
  transition: transform var(--transition-normal);
  box-shadow: 0 4px 12px rgba(255, 230, 109, 0.4);
}

.avatar:hover {
  transform: scale(1.1) rotate(10deg);
}

.greeting-text h1 {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin-bottom: 4px;
}

.level-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  color: var(--color-accent);
  font-weight: 600;
}

.streak-badge {
  display: inline-block;
  margin-top: var(--space-md);
  padding: 6px 16px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* === 区域标题 === */
.section-title {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === 今日统计 === */
.today-stats {
  margin-bottom: var(--space-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* === 快速入口 === */
.quick-actions {
  margin-bottom: var(--space-xl);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.action-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal) var(--bounce);
  box-shadow: var(--shadow-sm);
  border: 3px solid transparent;
  font-family: var(--font-family);
}

.action-card:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.action-text {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.action-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: var(--font-size-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === 学科入口 === */
.subjects {
  margin-bottom: var(--space-xl);
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.subject-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal) var(--bounce);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border: 3px solid transparent;
}

.subject-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--subject-color);
}

.subject-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--subject-color);
}

.subject-card:active {
  transform: translateY(-2px) scale(0.98);
}

.subject-emoji {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 20px;
  opacity: 0.6;
}

.subject-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.subject-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.subject-progress {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.subject-arrow {
  font-size: var(--font-size-md);
  color: var(--subject-color);
  opacity: 0;
  transition: all var(--transition-normal);
}

.subject-card:hover .subject-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* === 游戏入口 === */
.games {
  margin-bottom: var(--space-xl);
}

.game-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: linear-gradient(135deg, #FFF0F0, #FFE8E8);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-normal) var(--bounce);
  box-shadow: var(--shadow-sm);
  border: 3px solid transparent;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.game-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), #FF8E8E);
  border-radius: var(--radius-md);
}

.game-info {
  flex: 1;
}

.game-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.game-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.game-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: 700;
  transition: transform var(--transition-normal);
}

.game-card:hover .game-arrow {
  transform: translateX(4px);
}

/* === 奖励入口 === */
.rewards {
  margin-bottom: var(--space-xl);
}

.reward-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: linear-gradient(135deg, #FFF9E6, #FFF3CC);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-normal) var(--bounce);
  box-shadow: var(--shadow-sm);
  border: 3px solid transparent;
}

.reward-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-accent);
}

.reward-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-accent), #FFD700);
  border-radius: var(--radius-md);
}

.reward-info {
  flex: 1;
}

.reward-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.reward-level {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.reward-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-accent);
  font-weight: 700;
  transition: transform var(--transition-normal);
}

.reward-card:hover .reward-arrow {
  transform: translateX(4px);
}
</style>
