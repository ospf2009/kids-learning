<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { wrongDB, type DBWrongQuestion } from '@/db'
import { playCorrectSound, playWrongSound, speakCorrect, speakWrong, playVictorySound } from '@/utils/sound'
import { useUserStore } from '@/stores/user'
import { getChapter, type GradeId, type Subject } from '@/data/chapters'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()

const subjectNames: Record<string, string> = { chinese: '语文', math: '数学', english: '英语' }

// 从路由 query 获取错题数据
const initialData = route.query.data as string | undefined
let wrongList: DBWrongQuestion[] = []

try {
  if (initialData && typeof initialData === 'string') {
    wrongList = JSON.parse(decodeURIComponent(initialData))
  }
} catch {
  wrongList = []
}

const currentIndex = ref(0)
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)
const totalReview = ref(wrongList.length)
const reviewedCount = ref(0)
const masteredCount = ref(0)

const currentWrong = ref<DBWrongQuestion | undefined>(wrongList[0])

function getOptions(): string[] {
  const q = currentWrong.value
  if (!q) return []
  if (q.options && q.options.length > 0) return q.options
  return ['对', '错']
}

async function selectAnswer(answer: string) {
  if (showResult.value || !currentWrong.value) return
  selectedAnswer.value = answer
  isCorrect.value = answer === currentWrong.value.correctAnswer
  showResult.value = true

  if (isCorrect.value) {
    userStore.completeQuestion(currentWrong.value.subject as 'chinese' | 'math' | 'english', true)
    masteredCount.value++
    playCorrectSound()
    speakCorrect()
  } else {
    userStore.completeQuestion(currentWrong.value.subject as 'chinese' | 'math' | 'english', false)
    playWrongSound()
    speakWrong()
  }

  // 更新错题记录
  try {
    const q = wrongList[currentIndex.value]
    if (q && authStore.currentUser) {
      q.retried = true
      q.retryCorrect = isCorrect.value
      await wrongDB.put(q)
    }
  } catch (e) {
    console.error('[Review] update wrong record:', e)
  }
}

function nextQuestion() {
  if (currentIndex.value < wrongList.length - 1) {
    currentIndex.value++
    currentWrong.value = wrongList[currentIndex.value]
    selectedAnswer.value = ''
    showResult.value = false
    reviewedCount.value++
  } else {
    showCompletion.value = true
    reviewedCount.value++
    playVictorySound()
  }
}

function goBack() { router.push('/wrong-book') }
function goWrongBook() { router.push('/wrong-book') }

function getChapterName(q: DBWrongQuestion): string {
  const chapter = getChapter(q.gradeId as GradeId, q.subject as Subject, q.chapterId)
  return chapter?.title || q.chapterId
}

const progress = () => {
  if (totalReview.value === 0) return 0
  return Math.round((currentIndex.value / totalReview.value) * 100)
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>错题复习</h1>
      <span class="review-count" v-if="!showCompletion">{{ currentIndex + 1 }} / {{ totalReview }}</span>
    </div>

    <!-- 复习进度 -->
    <div class="progress-section" v-if="!showCompletion">
      <div class="progress-bar"><div class="fill" :style="{ width: progress() + '%' }"></div></div>
    </div>

    <!-- 无错题 -->
    <div v-if="wrongList.length === 0 && !showCompletion" class="empty">
      <p>没有需要复习的错题</p>
      <button class="btn-primary" @click="goWrongBook" style="margin-top: 12px;">返回错题本</button>
    </div>

    <!-- 答题区 -->
    <div v-if="currentWrong && !showCompletion" class="question-area">
      <div class="wrong-info">
        <span class="wi-badge" :class="'wi-' + currentWrong.subject">{{ subjectNames[currentWrong.subject] || currentWrong.subject }}</span>
        <span class="wi-chapter">{{ getChapterName(currentWrong) }}</span>
      </div>

      <div class="question-card">
        <p class="question-type-badge">复习题</p>
        <h2 class="question-text">{{ currentWrong.question }}</h2>
      </div>

      <!-- 你的旧答案（只提示，不显示正确性） -->
      <div class="old-answer">
        之前答：<span class="old-answer-text">{{ currentWrong.userAnswer }}</span>
      </div>

      <!-- 选项 -->
      <div class="options-grid"
        :class="getOptions().length > 4 ? 'options-grid-3' : 'options-grid-2'">
        <button
          v-for="opt in getOptions()"
          :key="opt"
          class="option-btn"
          :class="{
            selected: selectedAnswer === opt,
            correct: showResult && opt === currentWrong.correctAnswer,
            wrong: showResult && selectedAnswer === opt && opt !== currentWrong.correctAnswer
          }"
          @click="selectAnswer(opt!)"
          :disabled="showResult"
        >{{ opt }}</button>
      </div>

      <!-- 结果 -->
      <div class="result-feedback" v-if="showResult">
        <div class="feedback-icon">{{ isCorrect ? '&#x1F389;' : '&#x1F4AA;' }}</div>
        <div class="feedback-text">
          {{ isCorrect ? '答对了！掌握了这道题！' : '正确答案是：「' + currentWrong.correctAnswer + '」' }}
        </div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < totalReview - 1 ? '下一题 &rarr;' : '完成复习 &rarr;' }}
        </button>
      </div>
    </div>

    <!-- 完成 -->
    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">&#x1F3C6;</div>
        <h2>复习完成！</h2>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ totalReview }}</div><div class="stat-label">总复习</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ masteredCount }}</div><div class="stat-label">已掌握</div></div>
          <div class="stat-item"><div class="stat-value">{{ totalReview ? Math.round(masteredCount / totalReview * 100) : 0 }}%</div><div class="stat-label">掌握率</div></div>
        </div>
        <div class="completion-actions">
          <button class="btn-secondary" @click="goWrongBook">返回错题本</button>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { flex: 1; font-size: var(--font-size-lg); }
.review-count { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 600; }

.progress-section { margin-bottom: var(--space-4); }
.progress-bar { height: 6px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg, var(--color-primary), #F59E0B); transition: width 0.3s; }

.empty { text-align: center; padding: var(--space-12) 0; }
.empty p { color: var(--text-secondary); }

.wrong-info { display: flex; gap: 8px; margin-bottom: var(--space-3); }
.wi-badge { font-size: var(--font-size-xs); padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 600; }
.wi-chinese { background: var(--color-chinese-bg); color: var(--color-chinese); }
.wi-math { background: var(--color-math-bg); color: var(--color-math); }
.wi-english { background: var(--color-english-bg); color: var(--color-english); }
.wi-chapter { font-size: var(--font-size-xs); color: var(--text-tertiary); line-height: 1.8; }

.question-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-3); text-align: center; }
.question-type-badge { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-3); }
.question-text { font-size: var(--font-size-lg); color: var(--text-primary); line-height: 1.5; font-weight: 500; }

.old-answer { text-align: center; font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--space-4); }
.old-answer-text { color: var(--color-danger); text-decoration: line-through; font-weight: 600; }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.options-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.options-grid-2 { grid-template-columns: 1fr 1fr; max-width: 300px; margin: 0 auto; }

.option-btn {
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px;
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}
.option-btn:hover:not(:disabled) { border-color: var(--color-primary); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.option-btn:disabled { cursor: default; }
.option-btn.selected { border-color: var(--color-primary); background: #FFF5F5; }
.option-btn.correct { border-color: var(--color-success); background: #F0FDF4; animation: popIn 0.3s; }
.option-btn.wrong { border-color: var(--color-danger); background: #FEF2F2; }

.result-feedback { text-align: center; margin-top: var(--space-5); animation: popIn 0.3s; }
.feedback-icon { font-size: 48px; margin-bottom: var(--space-2); }
.feedback-text { font-size: var(--font-size-md); color: var(--text-primary); margin-bottom: var(--space-4); }
.next-btn {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  min-width: 160px;
  transition: all 0.2s;
}
.next-btn:hover { background: var(--color-primary-light); box-shadow: var(--shadow-primary); }

.completion { animation: popIn 0.4s; }
.completion-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-8) var(--space-5); text-align: center; box-shadow: var(--shadow-md); }
.trophy { font-size: 56px; margin-bottom: var(--space-3); }
.completion-card h2 { font-size: var(--font-size-xl); margin-bottom: var(--space-4); }
.stats { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); }
.stat-item { flex: 1; background: var(--bg-main); border-radius: var(--radius-md); padding: var(--space-3); }
.stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-primary); }
.stat-value.correct { color: var(--color-success); }
.stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; }
.completion-actions { display: flex; gap: var(--space-3); justify-content: center; }
.btn-secondary { padding: 10px 20px; background: var(--bg-input); color: var(--text-primary); border: none; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.btn-secondary:hover { background: #E5E7EB; }
</style>
