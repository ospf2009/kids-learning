<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { getChapters, type GradeId, type Subject } from '@/data/chapters'
import { getGradeName } from '@/data/grades'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 从路由参数获取科目
const subject = computed<Subject>(() => {
  const s = route.params.subject as string
  if (['chinese', 'math', 'english'].includes(s)) return s as Subject
  return 'chinese'
})

const subjectNames: Record<Subject, string> = { chinese: '语文', math: '数学', english: '英语' }
const subjectIcons: Record<Subject, string> = { chinese: '📖', math: '🔢', english: '🔤' }
const subjectColors: Record<Subject, string> = { chinese: '#FF6B6B', math: '#4ECDC4', english: '#60A5FA' }
const subjectEmojis: Record<Subject, string> = { chinese: '📖', math: '🔢', english: '🔤' }

const userGrade = computed<GradeId>(() => (authStore.grade || 'grade1-down') as GradeId)
const chapters = computed(() => getChapters(userGrade.value, subject.value))

function goChapter(chapterId: string) {
  router.push(`/practice/${subject.value}/${chapterId}`)
}

function goBack() { router.push('/') }
</script>

<template>
  <div class="subject-page">
    <header class="page-header" :style="{ '--s-color': subjectColors[subject] }">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div>
        <h1>{{ subjectIcons[subject] }} {{ subjectNames[subject] }}</h1>
        <p class="grade-label">{{ getGradeName(userGrade) }}</p>
      </div>
    </header>

    <div class="subject-hero" :style="{ background: `linear-gradient(135deg, ${subjectColors[subject]}22, ${subjectColors[subject]}11)` }">
      <div class="hero-emoji">{{ subjectEmojis[subject] }}</div>
      <div class="hero-text">
        <div class="hero-title">{{ subjectNames[subject] }}练习</div>
        <div class="hero-desc">{{ subjectNames[subject] === '语文' ? '字词句段，循序渐进' : subjectNames[subject] === '数学' ? '数与运算，寓教于乐' : '字母单词，轻松入门' }}</div>
      </div>
    </div>

    <div class="chapters-list">
      <div
        v-for="ch in chapters"
        :key="ch.id"
        class="chapter-card"
        :style="{ '--s-color': subjectColors[subject] }"
        @click="goChapter(ch.id)"
      >
        <div class="ch-icon">{{ ch.icon }}</div>
        <div class="ch-info">
          <div class="ch-title">{{ ch.title }}</div>
          <div class="ch-desc">{{ ch.description }}</div>
          <div class="ch-meta">
            <span class="ch-count">{{ ch.questions.length }}道题</span>
          </div>
        </div>
        <div class="ch-arrow">-></div>
      </div>
    </div>

    <div class="empty" v-if="chapters.length === 0">
      <div class="empty-icon">📭</div>
      <p>该年级暂无{{ subjectNames[subject] }}题库</p>
      <p class="empty-hint">切换到其他年级看看</p>
    </div>
  </div>
</template>

<style scoped>
.subject-page { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; }
.back-btn:hover { border-color: var(--s-color); }
h1 { font-size: 22px; color: var(--s-color); margin: 0; }
.grade-label { font-size: 12px; color: #888; margin-top: 2px; }

.subject-hero { display: flex; align-items: center; gap: 16px; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
.hero-emoji { font-size: 48px; }
.hero-title { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 4px; }
.hero-desc { font-size: 14px; color: #666; }

.chapters-list { display: flex; flex-direction: column; gap: 12px; }
.chapter-card { display: flex; align-items: center; gap: 12px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
.chapter-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-color: var(--s-color); }
.ch-icon { font-size: 32px; width: 48px; text-align: center; }
.ch-info { flex: 1; }
.ch-title { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 2px; }
.ch-desc { font-size: 13px; color: #888; margin-bottom: 6px; }
.ch-meta { display: flex; align-items: center; gap: 8px; }
.ch-count { font-size: 12px; color: #AAA; background: #F5F5F5; padding: 2px 8px; border-radius: 8px; }
.ch-arrow { font-size: 16px; color: #CCC; transition: transform 0.2s; }
.chapter-card:hover .ch-arrow { transform: translateX(4px); color: var(--s-color); }

.empty { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty p { color: #888; }
.empty-hint { font-size: 13px; color: #AAA; margin-top: 8px; }
</style>
