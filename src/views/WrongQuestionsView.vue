<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/auth'
import { playCorrectSound, playWrongSound } from '@/utils/sound'

const router = useRouter()
const learningStore = useLearningStore()

function goBack() { router.push('/') }

function removeWrong(id: number) {
  learningStore.removeWrong(id)
}

function retryQuestion(q: any) {
  // 简单实现：跳转到对应章节
  router.push(`/subject/${q.subject}/${q.chapterId}`)
}
</script>

<template>
  <div class="wrong-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>📋 错题本</h1>
    </header>

    <div v-if="learningStore.wrongQuestions.length === 0" class="empty">
      <div class="empty-icon">:)</div>
      <p>🎉 太棒了，没有错题！</p>
    </div>

    <div class="wrong-list">
      <div v-for="q in learningStore.wrongQuestions" :key="q.id" class="wrong-card">
        <div class="wrong-header">
          <span class="wrong-subject">{{ q.subject === 'chinese' ? '语文' : q.subject === 'math' ? '数学' : '英语' }}</span>
          <button class="remove-btn" @click="removeWrong(q.id!)">🗑</button>
        </div>
        <div class="wrong-question">{{ q.question }}</div>
        <div class="wrong-answers">
          <div class="your-answer">你的答案：<span class="wrong">{{ q.userAnswer }}</span></div>
          <div class="correct-answer">正确答案：<span class="correct">{{ q.correctAnswer }}</span></div>
        </div>
        <button class="retry-btn" @click="retryQuestion(q)">去复习 -></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrong-page { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.back-btn:hover { border-color: var(--color-primary); }
h1 { font-size: 20px; }

.empty { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 64px; margin-bottom: 12px; }
.empty p { font-size: 18px; color: #888; }

.wrong-list { display: flex; flex-direction: column; gap: 12px; }
.wrong-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.wrong-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.wrong-subject { font-size: 12px; background: #FFF0F0; color: #FF6B6B; padding: 2px 8px; border-radius: 8px; }
.remove-btn { background: none; border: none; font-size: 16px; color: #CCC; cursor: pointer; }
.remove-btn:hover { color: #FF6B6B; }
.wrong-question { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px; }
.wrong-answers { display: flex; gap: 16px; margin-bottom: 12px; font-size: 14px; }
.your-answer .wrong { color: #FF6B6B; text-decoration: line-through; }
.correct-answer .correct { color: #4ECDC4; font-weight: 700; }
.retry-btn { background: linear-gradient(135deg, var(--color-primary), #FF8E8E); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
