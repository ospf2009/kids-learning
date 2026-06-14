<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const subjectCards = [
  { id: 'chinese', name: '语文', icon: '📖', color: 'var(--color-chinese)', route: '/chinese', emoji: '🌸' },
  { id: 'math', name: '数学', icon: '🔢', color: 'var(--color-math)', route: '/math', emoji: '🔷' },
  { id: 'english', name: '英语', icon: '🔤', color: 'var(--color-english)', route: '/english', emoji: '🌈' },
]

function goToSubject(route: string) {
  router.push(route)
}

function goToRewards() {
  router.push('/rewards')
}

function goToGames() {
  router.push('/games')
}
</script>

<template>
  <div class="home">
    <!-- 顶部问候 -->
    <header class="header">
      <div class="greeting-section">
        <div class="avatar" @click="goToRewards">
          {{ userStore.currentLevel.icon }}
        </div>
        <div class="greeting-text">
          <h1>{{ greeting }}，{{ userStore.name }}！</h1>
          <p class="level-info">
            {{ userStore.currentLevel.name }}
            <span class="stars">⭐ {{ userStore.stars }}</span>
          </p>
        </div>
      </div>
      <div class="streak-badge" v-if="userStore.streak > 0">
        🔥 {{ userStore.streak }}天连续学习
      </div>
    </header>

    <!-- 今日任务 -->
    <section class="daily-tasks">
      <h2 class="section-title">📋 今日任务</h2>
      <div class="tasks-grid">
        <div
          v-for="task in userStore.dailyTasks"
          :key="task.id"
          class="task-card"
          :class="{ completed: task.isCompleted }"
        >
          <div class="task-icon">{{ task.icon }}</div>
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-progress">
              <div class="progress-bar">
                <div
                  class="fill"
                  :style="{
                    width: (task.completed / task.total * 100) + '%',
                    background: task.isCompleted ? 'var(--color-secondary)' : 'var(--color-accent)'
                  }"
                ></div>
              </div>
              <span class="progress-text">{{ task.completed }}/{{ task.total }}</span>
            </div>
          </div>
          <div class="task-status">
            <span v-if="task.isCompleted" class="check">✅</span>
            <span v-else class="pending">⏳</span>
          </div>
        </div>
      </div>
      <div class="today-summary">
        <div class="summary-item">
          <span class="summary-label">完成进度</span>
          <span class="summary-value">{{ userStore.todayProgress }}%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">获得星星</span>
          <span class="summary-value">⭐ {{ userStore.stars }}</span>
        </div>
      </div>
    </section>

    <!-- 游戏入口 -->
    <section class="games">
      <h2 class="section-title">🎮 游戏中心</h2>
      <div class="game-card" @click="goToGames">
        <div class="game-icon">🌟</div>
        <div class="game-info">
          <div class="game-name">接星星</div>
          <div class="game-desc">接住星星避开炸弹，看你能得多少分！</div>
        </div>
        <div class="game-arrow">→</div>
      </div>
    </section>

    <!-- 学科入口 -->
    <section class="subjects">
      <h2 class="section-title">🎯 开始学习</h2>
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
          <div class="subject-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- 成就展示 -->
    <section class="achievements" v-if="userStore.achievements.length > 0">
      <h2 class="section-title">🏆 我的成就</h2>
      <div class="achievements-row">
        <div
          v-for="ach in userStore.achievements.slice(0, 5)"
          :key="ach"
          class="achievement-item"
        >
          {{ ach }}
        </div>
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

/* === 今日任务 === */
.daily-tasks {
  margin-bottom: var(--space-xl);
}

.tasks-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.task-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.task-card.completed {
  background: linear-gradient(135deg, #F0FFF0, #E8FFE8);
  border: 2px solid var(--color-secondary);
}

.task-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF5F5;
  border-radius: var(--radius-md);
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #F0F0F0;
  border-radius: var(--radius-full);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.8s var(--bounce);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  min-width: 40px;
}

.task-status {
  font-size: 24px;
}

.check {
  animation: bounce-in 0.5s var(--bounce);
}

/* === 今日总结 === */
.today-summary {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: linear-gradient(135deg, #FFF9F0, #FFF5E6);
  border-radius: var(--radius-md);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
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

/* === 成就 === */
.achievements {
  margin-bottom: var(--space-xl);
}

.achievements-row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.achievement-item {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-accent), #FFD700);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: var(--shadow-sm);
  animation: bounce-in 0.5s var(--bounce);
}
</style>
