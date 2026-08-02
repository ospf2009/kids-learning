<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useProgressStore, type FrontWrongQuestion } from '@/stores/progress'
import { playCorrectSound, playWrongSound, speakCorrect, speakWrong, playVictorySound } from '@/utils/sound'
import { getChapter, type GradeId, type Subject } from '@/data/chapters'
import ChoiceQuestion from '@/components/ChoiceQuestion.vue'
import TapQuestion from '@/components/TapQuestion.vue'
import DragQuestion from '@/components/DragQuestion.vue'
import ConnectQuestion from '@/components/ConnectQuestion.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const progressStore = useProgressStore()

const subjectNames: Record<string, string> = { chinese: '语文', math: '数学', english: '英语' }

// 从 pinia store 取复习队列（避免 URL query 超长被截断）
const wrongList: FrontWrongQuestion[] = progressStore.reviewQueue.length > 0
  ? [...progressStore.reviewQueue]
  : []

// 离开页面时清空队列，避免下次进入时残留旧数据
onUnmounted(() => {
  progressStore.clearReviewQueue()
})

const currentIndex = ref(0)
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)
const totalReview = ref(wrongList.length)
const reviewedCount = ref(0)
const masteredCount = ref(0)
// 复习时记录每题的 userAnswer（画布组件 emit 出来的真实作答）
const lastUserAnswer = ref('')

const currentWrong = ref<FrontWrongQuestion | undefined>(wrongList[0])

/** 将 FrontWrongQuestion 适配回 Question 形状，复用 ChoiceQuestion 等画布组件 */
function toQuestionLike(q: FrontWrongQuestion) {
  return {
    id: q.questionId,
    type: inferType(q),
    question: q.question,
    options: q.options && q.options.length > 0 ? q.options : ['对', '错'],
    answer: q.correctAnswer,
  } as any
}

/** 推断题型：先按 options 数量与内容简单判断，更精细的判断可由后端字段补充 */
function inferType(q: FrontWrongQuestion): 'choice' | 'judge' | 'fill' | 'tap' | 'drag' | 'connect' {
  // judge 题：选项只有「对」「错」两种
  if (q.options && q.options.length === 2
      && (q.options.includes('对') || q.options.includes('错'))) {
    return 'judge'
  }
  // 其它带 options 的视为 choice
  if (q.options && q.options.length >= 2) return 'choice'
  // 无 options 的纯文本题用 fill
  return 'fill'
}

/** 答错/答对时由父组件统一处理（无论哪种题型） */
async function handleResult(correct: boolean, userAnswer?: string) {
  if (showResult.value || !currentWrong.value) return
  selectedAnswer.value = userAnswer || ''
  isCorrect.value = !!correct
  lastUserAnswer.value = userAnswer || ''
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

  // 同步复习结果到服务端 + 更新 store
  const q = wrongList[currentIndex.value]
  if (q) {
    await progressStore.updateWrongRetry(q.id, true, isCorrect.value)
  }
}

function nextQuestion() {
  if (currentIndex.value < wrongList.length - 1) {
    currentIndex.value++
    currentWrong.value = wrongList[currentIndex.value]
    selectedAnswer.value = ''
    lastUserAnswer.value = ''
    showResult.value = false
    reviewedCount.value++
  } else {
    showCompletion.value = true
    reviewedCount.value++
    playVictorySound()
  }
}

function goBack() {
  progressStore.clearReviewQueue()
  router.push('/wrong-book')
}

function getChapterName(q: FrontWrongQuestion): string {
  const chapter = getChapter(q.gradeId as GradeId, q.subject as Subject, q.chapterId)
  return chapter?.title || q.chapterId
}

/** 错题本展示用户作答：
 *  - 真实作答（如选项 label）→ 原样显示
 *  - 空 / null / undefined → 显示「（空）」
 *  - 历史脏数据（'__wrong__' 等占位符）→ 原样显示 */
function displayUserAnswer(raw: string | undefined | null): string {
  if (raw == null) return '（空）'
  const s = String(raw)
  if (s.trim() === '') return '（空）'
  return s
}

const progress = computed(() => {
  if (totalReview.value === 0) return 0
  return Math.round((currentIndex.value / totalReview.value) * 100)
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>错题复习</h1>
      <span class="review-count" v-if="!showCompletion">{{ currentIndex + 1 }} / {{ totalReview }}</span>
    </div>

    <!-- 复习进度 -->
    <div class="progress-section" v-if="!showCompletion && wrongList.length > 0">
      <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
    </div>

    <!-- 无错题 -->
    <div v-if="wrongList.length === 0 && !showCompletion" class="empty">
      <p>没有需要复习的错题</p>
      <button class="btn-primary" @click="goBack" style="margin-top: 12px;">返回错题本</button>
    </div>

    <!-- 答题区（与 ChapterPractice 完全一致：画布 + 题型分支） -->
    <div v-if="currentWrong && !showCompletion" class="question-area">
      <div class="wrong-info">
        <span class="wi-badge" :class="'wi-' + currentWrong.subject">{{ subjectNames[currentWrong.subject] || currentWrong.subject }}</span>
        <span class="wi-chapter">{{ getChapterName(currentWrong) }}</span>
      </div>

      <div class="question-card">
        <p class="question-type-badge">复习题 · {{ currentWrong.questionId }}</p>
        <h2 class="question-text">{{ currentWrong.question }}</h2>
      </div>

      <!-- 选择 / 判断 / 填空：复用 ChoiceQuestion（Leafer 画布，含自动图示） -->
      <div v-if="['choice', 'judge', 'fill'].includes(inferType(currentWrong))" class="interactive-area">
        <ChoiceQuestion
          :question="toQuestionLike(currentWrong) as any"
          :disabled="showResult"
          @result="(c: boolean, ua?: string) => handleResult(c, ua)"
        />
      </div>

      <!-- 互动题类型在没有 scene 数据时降级为文本提示，避免画布空渲染 -->
      <div v-else class="interactive-area">
        <div class="fallback-text">{{ currentWrong.question }}</div>
      </div>

      <!-- 答题反馈（与 ChapterPractice 一致：🎉 / 💪 + 正确答案 + 下一题） -->
      <div class="result-feedback" v-if="showResult">
        <div class="feedback-icon feedback-correct" v-if="isCorrect">🎉</div>
        <div class="feedback-icon feedback-wrong" v-else>💪</div>
        <div class="feedback-text">
          {{ isCorrect
              ? '太棒了！答对啦！'
              : '加油哦！正确答案是：「' + currentWrong.correctAnswer + '」' }}
        </div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < totalReview - 1 ? '下一题 →' : '完成复习 🏆' }}
        </button>
      </div>
    </div>

    <!-- 完成 -->
    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">🏆</div>
        <h2>复习完成！</h2>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ totalReview }}</div><div class="stat-label">总复习</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ masteredCount }}</div><div class="stat-label">已掌握</div></div>
          <div class="stat-item"><div class="stat-value">{{ totalReview ? Math.round(masteredCount / totalReview * 100) : 0 }}%</div><div class="stat-label">掌握率</div></div>
        </div>
        <div class="completion-actions">
          <button class="btn-secondary" @click="goBack">返回错题本</button>
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
.wi-chapter { font-size: var(--font-size-xs); color: var(--text-tertiary); line-height: 1.8; }
.wi-chinese { background: var(--color-chinese-bg); color: var(--color-chinese); }
.wi-math { background: var(--color-math-bg); color: var(--color-math); }
.wi-english { background: var(--color-english-bg); color: var(--color-english); }

.question-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-4); text-align: center; }
.question-type-badge { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-3); padding: 2px 10px; background: var(--bg-input); border-radius: var(--radius-full); display: inline-block; }
.question-text { font-size: var(--font-size-xl); color: var(--text-primary); line-height: 1.5; font-weight: 500; }

.interactive-area { margin-bottom: var(--space-4); }
.fallback-text { background: white; border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: var(--space-4); color: var(--text-tertiary); text-align: center; font-size: var(--font-size-sm); }

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
