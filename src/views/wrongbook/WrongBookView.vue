<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { wrongDB, type DBWrongQuestion } from '@/db'

const router = useRouter()
const authStore = useAuthStore()
const wrongQuestions = ref<DBWrongQuestion[]>([])

const subjectNames: Record<string, string> = { chinese: '语文', math: '数学', english: '英语' }

onMounted(async () => {
  if (authStore.currentUser) {
    wrongQuestions.value = await wrongDB.getByUser(authStore.currentUser.id)
  }
})

// 待复习（没复习过、或复习了但做错的）
const pendingItems = computed(() =>
  wrongQuestions.value.filter(w => !w.retried || (w.retried && !w.retryCorrect))
)

// 已掌握（复习过且做对的）
const masteredItems = computed(() =>
  wrongQuestions.value.filter(w => w.retried && w.retryCorrect)
)

function goBack() { router.push('/') }

async function removeWrong(id: string) {
  await wrongDB.remove(id)
  wrongQuestions.value = wrongQuestions.value.filter(w => w.id !== id)
}

async function clearAll() {
  if (wrongQuestions.value.length === 0) return
  await wrongDB.clear()
  wrongQuestions.value = []
}

async function clearMastered() {
  if (masteredItems.value.length === 0) return
  for (const w of masteredItems.value) {
    await wrongDB.remove(w.id)
  }
  wrongQuestions.value = wrongQuestions.value.filter(w => !w.retried || !w.retryCorrect)
}

function reviewWrong(q: DBWrongQuestion) {
  // 只跳转到复习页面，只传这一条错题
  const data = encodeURIComponent(JSON.stringify([q]))
  router.push({ name: 'wrong-book-review', params: { wrongData: data } })
}

function reviewAllPending() {
  if (pendingItems.value.length === 0) return
  const data = encodeURIComponent(JSON.stringify(pendingItems.value))
  router.push({ name: 'wrong-book-review', params: { wrongData: data } })
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>错题本</h1>
      <button v-if="wrongQuestions.length > 0" class="clear-btn" @click="clearAll">清空</button>
    </div>

    <!-- 完全无错题 -->
    <div v-if="wrongQuestions.length === 0" class="empty">
      <div class="empty-icon">&#x1F389;</div>
      <p>太棒了，没有错题！</p>
    </div>

    <div v-else>
      <!-- 待复习区域 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">待复习</h2>
          <span class="section-count">{{ pendingItems.length }}</span>
          <button v-if="pendingItems.length > 1" class="review-all-btn" @click="reviewAllPending">全部复习 &rarr;</button>
        </div>

        <div v-if="pendingItems.length === 0" class="empty-subtle">
          <p>当前没有待复习的错题</p>
        </div>

        <div v-else class="card-list">
          <div v-for="q in pendingItems" :key="q.id" class="card">
            <div class="card-top">
              <span class="c-badge" :class="'c-' + q.subject">{{ subjectNames[q.subject] || q.subject }}</span>
              <span class="c-date">{{ formatDate(q.date) }}</span>
              <button class="c-remove" @click="removeWrong(q.id)">&times;</button>
            </div>
            <p class="c-question">{{ q.question }}</p>
            <div class="c-answers">
              <span class="c-yours">你答 <span class="c-wrong">{{ q.userAnswer }}</span></span>
              <span class="c-correct">正解 <span class="c-right">{{ q.correctAnswer }}</span></span>
            </div>
            <button class="c-review-btn" @click="reviewWrong(q)">复习这道题 &rarr;</button>
          </div>
        </div>
      </div>

      <!-- 已掌握区域 -->
      <div class="section" v-if="masteredItems.length > 0">
        <div class="section-header">
          <h2 class="section-title">已掌握</h2>
          <span class="section-count">{{ masteredItems.length }}</span>
          <button class="clear-mastered-btn" @click="clearMastered">清空</button>
        </div>

        <div class="card-list">
          <div v-for="q in masteredItems" :key="q.id" class="card card-mastered">
            <div class="card-top">
              <span class="c-badge" :class="'c-' + q.subject">{{ subjectNames[q.subject] || q.subject }}</span>
              <span class="c-date">{{ formatDate(q.date) }}</span>
              <button class="c-remove" @click="removeWrong(q.id)">&times;</button>
            </div>
            <p class="c-question">{{ q.question }}</p>
            <div class="c-answers">
              <span class="c-correct">正解 <span class="c-right">{{ q.correctAnswer }}</span></span>
            </div>
            <div class="c-mastered-tag">&#x2714; 已掌握</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { font-size: var(--font-size-lg); flex: 1; }
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
.empty-subtle { text-align: center; padding: var(--space-8) 0; }
.empty-subtle p { font-size: var(--font-size-sm); color: var(--text-tertiary); }

/* 分区标题 */
.section { margin-bottom: var(--space-5); }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-3); }
.section-title { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); }
.section-count {
  font-size: var(--font-size-xs);
  background: var(--bg-input);
  color: var(--text-secondary);
  padding: 0 8px;
  border-radius: var(--radius-full);
  line-height: 1.8;
}
.review-all-btn {
  margin-left: auto;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 4px 12px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.review-all-btn:hover { background: var(--color-primary-light); }
.clear-mastered-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  font-family: inherit;
}
.clear-mastered-btn:hover { border-color: #D1D5DB; color: var(--text-primary); }

/* 卡片列表 */
.card-list { display: flex; flex-direction: column; gap: 8px; }
.card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all 0.15s;
}
.card:hover { box-shadow: var(--shadow-sm); }
.card-mastered { opacity: 0.55; }
.card-mastered:hover { opacity: 0.8; }

.card-top { display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-2); }
.c-badge {
  font-size: var(--font-size-xs);
  padding: 0 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  line-height: 1.8;
}
.c-chinese { background: var(--color-chinese-bg); color: var(--color-chinese); }
.c-math { background: var(--color-math-bg); color: var(--color-math); }
.c-english { background: var(--color-english-bg); color: var(--color-english); }
.c-date { font-size: var(--font-size-xs); color: var(--text-tertiary); flex: 1; }
.c-remove { background: none; border: none; font-size: 16px; color: var(--text-tertiary); cursor: pointer; line-height: 1; padding: 0; }
.c-remove:hover { color: var(--color-danger); }

.c-question { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2); }
.c-answers { display: flex; gap: var(--space-4); font-size: var(--font-size-xs); margin-bottom: var(--space-2); }
.c-yours, .c-correct { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); }
.c-wrong { color: var(--color-danger); text-decoration: line-through; font-weight: 600; }
.c-right { color: var(--color-success); font-weight: 700; }

.c-review-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 5px 12px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.c-review-btn:hover { background: var(--color-primary-light); box-shadow: var(--shadow-primary); }

.c-mastered-tag { font-size: var(--font-size-xs); color: var(--color-success); font-weight: 600; }
</style>
