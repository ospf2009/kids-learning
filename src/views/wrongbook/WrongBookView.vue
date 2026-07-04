<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { wrongDB, type DBWrongQuestion } from '@/db'

const router = useRouter()
const authStore = useAuthStore()

const wrongQuestions = ref<DBWrongQuestion[]>([])

onMounted(async () => {
  if (authStore.currentUser) {
    wrongQuestions.value = await wrongDB.getByUser(authStore.currentUser.id)
  }
})

function goBack() { router.push('/') }

async function removeWrong(id: string) {
  await wrongDB.remove(id)
  wrongQuestions.value = wrongQuestions.value.filter(w => w.id !== id)
}

function retryQuestion(q: DBWrongQuestion) {
  router.push(`/practice/${q.subject}/${q.chapterId}`)
}

async function clearAll() {
  if (wrongQuestions.value.length === 0) return
  await wrongDB.clear()
  wrongQuestions.value = []
}

function getSubjectName(subject: string): string {
  const names: Record<string, string> = { chinese: '语文', math: '数学', english: '英语' }
  return names[subject] || subject
}
</script>

<template>
  <div class="wrong-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>📋 错题本</h1>
      <button v-if="wrongQuestions.length > 0" class="clear-btn" @click="clearAll">清空</button>
    </header>

    <div v-if="wrongQuestions.length === 0" class="empty">
      <div class="empty-icon">:)</div>
      <p>🎉 太棒了，没有错题！</p>
    </div>

    <div class="wrong-list">
      <div v-for="q in wrongQuestions" :key="q.id" class="wrong-card">
        <div class="wrong-header">
          <span class="wrong-subject">{{ getSubjectName(q.subject) }}</span>
          <span class="wrong-date">{{ new Date(q.date).toLocaleDateString('zh-CN') }}</span>
          <button class="remove-btn" @click="removeWrong(q.id)">🗑</button>
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
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; }
.back-btn:hover { border-color: var(--color-primary); }
h1 { font-size: 20px; flex: 1; }
.clear-btn { background: #FFF0F0; border: none; color: #FF6B6B; padding: 6px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: inherit; }

.empty { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 64px; margin-bottom: 12px; }
.empty p { font-size: 18px; color: #888; }

.wrong-list { display: flex; flex-direction: column; gap: 12px; }
.wrong-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.wrong-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.wrong-subject { font-size: 12px; background: #FFF0F0; color: #FF6B6B; padding: 2px 8px; border-radius: 8px; }
.wrong-date { font-size: 11px; color: #CCC; flex: 1; margin-left: 8px; }
.remove-btn { background: none; border: none; font-size: 16px; color: #CCC; cursor: pointer; }
.remove-btn:hover { color: #FF6B6B; }
.wrong-question { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px; }
.wrong-answers { display: flex; gap: 16px; margin-bottom: 12px; font-size: 14px; }
.your-answer .wrong { color: #FF6B6B; text-decoration: line-through; }
.correct-answer .correct { color: #4ECDC4; font-weight: 700; }
.retry-btn { background: linear-gradient(135deg, var(--color-primary), #FF8E8E); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
</style>
