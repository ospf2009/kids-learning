<script setup lang="ts">
import { useRouter } from 'vue-router'
import { chineseLessons } from '@/data/chinese'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function goBack() {
  router.push('/')
}

function startLesson(lessonId: string) {
  router.push(`/chinese/${lessonId}`)
}

function isLessonCompleted(lessonId: string) {
  return userStore.completedLessons['chinese']?.includes(lessonId) || false
}
</script>

<template>
  <div class="chinese-home">
    <!-- 头部 -->
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>📖 语文乐园</h1>
      <div class="header-decoration">🌸</div>
    </header>

    <!-- 课程列表 -->
    <div class="lessons-grid">
      <div
        v-for="lesson in chineseLessons"
        :key="lesson.id"
        class="lesson-card"
        :class="{ completed: isLessonCompleted(lesson.id) }"
        @click="startLesson(lesson.id)"
      >
        <div class="lesson-icon">{{ lesson.icon }}</div>
        <div class="lesson-info">
          <h3>{{ lesson.title }}</h3>
          <p>{{ lesson.description }}</p>
        </div>
        <div class="lesson-status">
          <span v-if="isLessonCompleted(lesson.id)" class="completed-badge">✅</span>
          <span v-else class="start-arrow">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chinese-home {
  padding-bottom: 32px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  position: relative;
}

.back-btn {
  background: var(--bg-card);
  border: 2px solid #EEE;
  border-radius: var(--radius-full);
  padding: 8px 16px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.back-btn:hover {
  background: #FFF0F0;
  border-color: var(--color-chinese);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  color: var(--color-chinese);
}

.header-decoration {
  position: absolute;
  right: 0;
  top: -5px;
  font-size: 40px;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.lessons-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.lesson-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-normal) var(--bounce);
  border: 3px solid transparent;
}

.lesson-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-md);
  border-color: var(--color-chinese);
}

.lesson-card.completed {
  background: linear-gradient(135deg, #FFF5F5, #FFE8E8);
  border-color: #FFD0D0;
}

.lesson-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF0F0, #FFE0E0);
  border-radius: var(--radius-md);
}

.lesson-info {
  flex: 1;
}

.lesson-info h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: 4px;
}

.lesson-info p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.lesson-status {
  font-size: 24px;
}

.start-arrow {
  color: var(--color-chinese);
  font-weight: 700;
  transition: transform var(--transition-normal);
}

.lesson-card:hover .start-arrow {
  transform: translateX(4px);
}

.completed-badge {
  animation: bounce-in 0.5s var(--bounce);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
