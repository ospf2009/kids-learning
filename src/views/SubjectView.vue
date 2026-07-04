<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useLearningStore } from '@/stores/auth'
import { computed } from 'vue'
import { getChapters, type Subject } from '@/data/chapters'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const learningStore = useLearningStore()

const subject = route.params.subject as Subject
const subjectNames: Record<string, string> = { chinese: '语文', math: '数学', english: '英语' }
const subjectIcons: Record<string, string> = { chinese: '📖', math: '🔢', english: '🔤' }
const subjectColors: Record<string, string> = { chinese: '#FF6B6B', math: '#4ECDC4', english: '#60A5FA' }

const chapters = computed(() => getChapters(authStore.currentGrade as any, subject))

function getProgress(chapterId: string) {
  return learningStore.getChapterProgress(subject, chapterId)
}

function goChapter(chapterId: string) {
  router.push(`/subject/${subject}/${chapterId}`)
}

function goBack() { router.push('/') }
</script>

<template>
  <div class="subject-page">
    <header class="page-header" :style="{ '--s-color': subjectColors[subject] }">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>{{ subjectIcons[subject] }} {{ subjectNames[subject] }}</h1>
    </header>

    <div class="chapters-list">
      <div
        v-for="ch in chapters"
        :key="ch.id"
        class="chapter-card"
        :class="{ completed: getProgress(ch.id)?.completed }"
        @click="goChapter(ch.id)"
      >
        <div class="ch-icon">{{ ch.icon }}</div>
        <div class="ch-info">
          <div class="ch-title">{{ ch.title }}</div>
          <div class="ch-desc">{{ ch.description }}</div>
          <div class="ch-progress" v-if="getProgress(ch.id)">
            <div class="progress-bar">
              <div class="fill" :style="{ width: Math.min(100, (getProgress(ch.id)!.score / getProgress(ch.id)!.total) * 100) + '%' }"></div>
            </div>
            <span class="progress-text">{{ getProgress(ch.id)!.score }}/{{ getProgress(ch.id)!.total }}</span>
          </div>
          <div class="ch-progress" v-else>
            <span class="progress-text new">📭 未开始</span>
          </div>
        </div>
        <div class="ch-arrow">-></div>
      </div>
    </div>

    <div class="empty" v-if="chapters.length === 0">
      <div class="empty-icon">📭</div>
      <p>该年级暂无{{ subjectNames[subject] }}题库</p>
    </div>
  </div>
</template>

<style scoped>
.subject-page { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.back-btn:hover { border-color: var(--s-color); }
h1 { font-size: 20px; color: var(--s-color); }

.chapters-list { display: flex; flex-direction: column; gap: 12px; }
.chapter-card { display: flex; align-items: center; gap: 12px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
.chapter-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-color: var(--s-color); }
.chapter-card.completed { background: #F0FFF0; border-color: #4ECDC4; }
.ch-icon { font-size: 32px; width: 48px; text-align: center; }
.ch-info { flex: 1; }
.ch-title { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 2px; }
.ch-desc { font-size: 13px; color: #888; margin-bottom: 6px; }
.ch-progress { display: flex; align-items: center; gap: 8px; }
.progress-bar { flex: 1; height: 6px; background: #F0F0F0; border-radius: 3px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--s-color), #6EDDD6); border-radius: 3px; transition: width 0.3s; }
.progress-text { font-size: 12px; color: #888; min-width: 40px; }
.progress-text.new { color: #CCC; }
.ch-arrow { font-size: 16px; color: #CCC; }

.empty { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty p { color: #888; }
</style>
