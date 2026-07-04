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
function retryQuestion(q: DBWrongQuestion) { router.push(`/practice/${q.subject}/${q.chapterId}`) }
async function clearAll() {
  if (wrongQuestions.value.length === 0) return
  await wrongDB.clear()
  wrongQuestions.value = []
}
const subjectNames: Record<string, string> = { chinese: '语文', math: '数学', english: '英语' }
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>错题本</h1>
      <button v-if="wrongQuestions.length > 0" class="clear-btn" @click="clearAll">清空</button>
    </div>

    <div v-if="wrongQuestions.length === 0" class="empty">
      <div class="empty-icon">&#x1F389;</div>
      <p>太棒了，没有错题！</p>
    </div>

    <div class="wrong-list">
      <div v-for="q in wrongQuestions" :key="q.id" class="wrong-card">
        <div class="wrong-top">
          <span class="ws-badge" :class="'ws-' + q.subject">{{ subjectNames[q.subject] || q.subject }}</span>
          <span class="ws-date">{{ new Date(q.date).toLocaleDateString('zh-CN') }}</span>
          <button class="ws-remove" @click="removeWrong(q.id)">&times;</button>
        </div>
        <p class="ws-question">{{ q.question }}</p>
        <div class="ws-answers">
          <span class="ws-yours">你的答案 <span class="ws-wrong">{{ q.userAnswer }}</span></span>
          <span class="ws-correct">正确答案 <span class="ws-right">{{ q.correctAnswer }}</span></span>
        </div>
        <button class="ws-retry" @click="retryQuestion(q)">去复习 &rarr;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { font-size: var(--font-size-lg); }
.clear-btn {
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.clear-btn:hover { background: #FEF2F2; }

.empty { text-align: center; padding: var(--space-12) 0; }
.empty-icon { font-size: 56px; margin-bottom: var(--space-3); }
.empty p { font-size: var(--font-size-md); color: var(--text-secondary); }

.wrong-list { display: flex; flex-direction: column; gap: 10px; }
.wrong-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.wrong-top { display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-3); }
.ws-badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
}
.ws-chinese { background: var(--color-chinese-bg); color: var(--color-chinese); }
.ws-math { background: var(--color-math-bg); color: var(--color-math); }
.ws-english { background: var(--color-english-bg); color: var(--color-english); }
.ws-date { font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; }
.ws-remove { background: none; border: none; font-size: 18px; color: var(--text-tertiary); cursor: pointer; line-height: 1; padding: 0; }
.ws-remove:hover { color: var(--color-danger); }

.ws-question { font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-3); }
.ws-answers { display: flex; gap: var(--space-4); font-size: var(--font-size-sm); margin-bottom: var(--space-3); }
.ws-yours, .ws-correct { display: flex; align-items: center; gap: 4px; }
.ws-wrong { color: var(--color-danger); text-decoration: line-through; font-weight: 600; }
.ws-right { color: var(--color-success); font-weight: 700; }

.ws-retry {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.ws-retry:hover { background: var(--color-primary-light); box-shadow: var(--shadow-primary); }
</style>
