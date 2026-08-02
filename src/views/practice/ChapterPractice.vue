<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useUserStore } from '@/stores/user'
import { getChapter, type GradeId, type Subject, type Question } from '@/data/chapters'
import { getMixedQuestions, clearChineseCache, clearMathCache, clearEnglishCache } from '@/utils/questionGenerator'
import TapQuestion from '@/components/TapQuestion.vue'
import DragQuestion from '@/components/DragQuestion.vue'
import ConnectQuestion from '@/components/ConnectQuestion.vue'
import ChoiceQuestion from '@/components/ChoiceQuestion.vue'
import { wrongDB } from '@/db'
import { playCorrectSound, playWrongSound, speakCorrect, speakWrong, playVictorySound } from '@/utils/sound'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const progressStore = useProgressStore()

const subject = computed<Subject>(() => (route.params.subject as Subject) || 'chinese')
const chapterId = route.params.chapterId as string
const userGrade = computed<GradeId>(() => (authStore.grade || 'grade1-down') as GradeId)

// 获取并随机打乱题目顺序（支持动态生成）
const chapterData = computed(() => getChapter(userGrade.value, subject.value, chapterId))

// 用 ref 存储题目列表，支持「换一批题」手动重新生成
const shuffledQuestions = ref<Question[]>([])

async function generateQuestions() {
  if (!chapterData.value) {
    shuffledQuestions.value = []
    return
  }
  const all = await getMixedQuestions(
    chapterData.value,
    subject.value,
    userGrade.value,
    authStore.currentUser?.id
  )
  shuffledQuestions.value = all.slice(0, 10)
}

const currentIndex = ref(0)
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)
const correctCount = ref(0)
const totalWrong = ref(0)

const currentQuestion = computed<Question | undefined>(() => shuffledQuestions.value[currentIndex.value])

const progress = computed(() => {
  if (shuffledQuestions.value.length === 0) return 0
  return Math.round((currentIndex.value / shuffledQuestions.value.length) * 100)
})

const subjectColors: Record<string, string> = { chinese: '#FF6B6B', math: '#4ECDC4', english: '#60A5FA' }

/** 互动题（tap/drag/connect）通过事件上报是否正确；
 *  userAnswer 为用户实际作答内容（点中的元素 / 拖到的目标 / 连线等），
 *  错题本里展示用。画布组件答错时一定会把真实错答传上来，所以这里几乎不兜底 */
async function submitInteractive(correct: boolean, userAnswer?: string) {
  if (showResult.value) return
  // 真实错答：用户选了 X / 拖到 Y / 连了 Z，错题本要显示「你答 X」而不是占位
  // 万一画布组件没传 userAnswer（极少见），才用正解或「（空）」兜底，绝不再写 '__wrong__'
  const real = (userAnswer != null && String(userAnswer).length > 0)
    ? userAnswer
    : (correct ? (currentQuestion.value?.answer ?? '') : '（空）')
  applyResult(correct, real)
}

/** 统一判分与记录逻辑（answer 为选中值，互动题直接传对错结果） */
async function applyResult(correct: boolean, answer: string) {
  if (showResult.value) return
  isCorrect.value = correct
  showResult.value = true

  if (isCorrect.value) {
    correctCount.value++
    userStore.completeQuestion(subject.value, true)
    playCorrectSound()
    speakCorrect()
  } else {
    totalWrong.value++
    userStore.completeQuestion(subject.value, false)
    playWrongSound()
    speakWrong()
  }

  // 记录错题到 IndexedDB (出错不阻塞答题流程)
  if (authStore.currentUser && currentQuestion.value) {
    try {
      const q = currentQuestion.value
      await progressStore.recordAnswer(
        authStore.currentUser.id,
        subject.value,
        userGrade.value,
        chapterId,
        q.id,
        q.question,
        answer,
        q.answer,
        q.options || [],
        isCorrect.value
      )
      // 答对时，移除未复习的错题（已标记复习的保留记录）
      if (isCorrect.value) {
        const wrongs = await wrongDB.getByUserChapter(authStore.currentUser.id, chapterId)
        const matched = wrongs.find(w => w.questionId === q.id && !w.retried)
        if (matched) {
          await wrongDB.remove(matched.id)
        }
      }
    } catch (e) {
      console.error('[ChapterPractice] recordAnswer error:', e)
    }
  }
}

function nextQuestion() {
  if (!chapterData.value) return
  if (currentIndex.value < shuffledQuestions.value.length - 1) {
    currentIndex.value++
    selectedAnswer.value = ''
    showResult.value = false
  } else {
    showCompletion.value = true
    userStore.completeLesson(subject.value, chapterId)
    playVictorySound()
  }
}

function retry() {
  generateQuestions()
  currentIndex.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  showCompletion.value = false
  correctCount.value = 0
  totalWrong.value = 0
}

// 换一批题：清空对应科目（后端账号绑定）的缓存后重新随机生成题目，并重置答题状态
async function changeBatch() {
  const uid = authStore.currentUser?.id
  if (uid && chapterData.value) {
    if (subject.value === 'chinese') {
      await clearChineseCache(uid, chapterId, userGrade.value)
    }
    if (subject.value === 'math') {
      await clearMathCache(uid, chapterId, userGrade.value)
    }
    if (subject.value === 'english') {
      await clearEnglishCache(uid, chapterId, userGrade.value)
    }
  }
  await generateQuestions()
  currentIndex.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  showCompletion.value = false
  correctCount.value = 0
  totalWrong.value = 0
}

function goBack() {
  router.push(`/practice/${subject.value}`)
}

// 进入页面时初始化生成题目
onMounted(async () => {
  await generateQuestions()
})

// Fisher-Yates shuffle (local helper)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
</script>

<template>
  <div class="chapter-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>{{ chapterData?.icon }} {{ chapterData?.title }}</h1>
    </header>

    <div class="progress-section" v-if="!showCompletion">
      <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
      <span class="progress-text">{{ currentIndex + 1 }} / {{ shuffledQuestions.length }}</span>
      <button class="change-batch-btn" @click="changeBatch" title="换一批题">🔄 换一批题</button>
    </div>

    <!-- 答题区 -->
    <div class="question-area" v-if="currentQuestion && !showCompletion">
      <div class="question-card">
        <p class="question-type-badge">
          {{ currentQuestion.type === 'choice' ? '选择题' : currentQuestion.type === 'judge' ? '判断题' : currentQuestion.type === 'fill' ? '填空题' : '互动题' }}
        </p>
        <div class="question-hint" v-if="currentQuestion.hint">★ {{ currentQuestion.hint }}</div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>
      </div>

      <!-- 选择/判断/填空 互动题（Leafer 画布，支持图文素材） -->
      <div v-if="['choice', 'judge', 'fill'].includes(currentQuestion.type)" class="interactive-area">
        <ChoiceQuestion
          :question="currentQuestion"
          :disabled="showResult"
          @result="submitInteractive"
        />
      </div>

      <!-- 点击互动题（Leafer 画布） -->
      <div v-if="currentQuestion.type === 'tap'" class="interactive-area">
        <p class="interactive-tip">👆 在画布上点击正确答案</p>
        <TapQuestion
          :question="currentQuestion"
          :disabled="showResult"
          @result="submitInteractive"
        />
      </div>

      <!-- 拖拽互动题（Leafer 画布） -->
      <div v-if="currentQuestion.type === 'drag'" class="interactive-area">
        <p class="interactive-tip">🤚 把上面的物品拖到正确的框里</p>
        <DragQuestion
          :question="currentQuestion"
          :disabled="showResult"
          @result="submitInteractive"
        />
      </div>

      <!-- 连线互动题（Leafer 画布） -->
      <div v-if="currentQuestion.type === 'connect'" class="interactive-area">
        <p class="interactive-tip">✏️ 点左边再点右边，把对应的连起来</p>
        <ConnectQuestion
          :question="currentQuestion"
          :disabled="showResult"
          @result="submitInteractive"
        />
      </div>

      <!-- 结果反馈 -->
      <div class="result-feedback" v-if="showResult">
        <div class="feedback-icon feedback-correct" v-if="isCorrect">🎉</div>
        <div class="feedback-icon feedback-wrong" v-else>💪</div>
        <div class="feedback-text">
          {{ isCorrect ? '太棒了！答对啦！' : '加油哦！正确答案是：「' + currentQuestion?.answer + '」' }}
        </div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < shuffledQuestions.length - 1 ? '下一题 →' : '查看成绩 🏆' }}
        </button>
      </div>
    </div>

    <!-- 完成页面 -->
    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">🏆</div>
        <h2>练习完成！</h2>
        <div class="stars-earned">获得 {{ correctCount * 2 + totalWrong }} 颗星星</div>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ shuffledQuestions.length }}</div><div class="stat-label">总题数</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ correctCount }}</div><div class="stat-label">答对</div></div>
          <div class="stat-item"><div class="stat-value">{{ shuffledQuestions.length ? Math.round(correctCount / shuffledQuestions.length * 100) : 0 }}%</div><div class="stat-label">正确率</div></div>
        </div>
        <div class="completion-actions">
          <button class="btn-action btn-secondary" @click="retry">再来一次</button>
          <button class="btn-action btn-primary" @click="goBack">← 返回列表</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapter-page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header { margin-bottom: var(--space-4); }
.page-header h1 { font-size: var(--font-size-lg); }

.progress-section { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5); }
.progress-bar { flex: 1; height: 6px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg, var(--color-primary), #F59E0B); transition: width 0.3s; }
.progress-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 600; min-width: 50px; text-align: right; }
.change-batch-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 12px;
  background: white;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-full);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}
.change-batch-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: #FFF5F5;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* 题目区域 */
.question-area { margin-bottom: var(--space-4); }
.question-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-4); text-align: center; }
.question-type-badge { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-3); padding: 2px 10px; background: var(--bg-input); border-radius: var(--radius-full); display: inline-block; }
.question-hint { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-3); padding: 4px 14px; background: #FFFBEB; border-radius: var(--radius-full); display: inline-block; }
.question-text { font-size: var(--font-size-xl); color: var(--text-primary); line-height: 1.5; font-weight: 500; }

/* 选项 */
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
.opt-emoji { font-size: 22px; margin-right: 8px; vertical-align: middle; display: inline-block; }
.option-btn.selected { border-color: var(--color-primary); background: #FFF5F5; }
.option-btn.correct { border-color: var(--color-success); background: #F0FDF4; animation: popIn 0.3s; }
.option-btn.wrong { border-color: var(--color-danger); background: #FEF2F2; }

.fill-area { text-align: center; }
.fill-options { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.fill-opt { min-width: 56px; padding: 12px 16px; font-size: var(--font-size-lg); }

/* 互动题 */
.interactive-area { text-align: center; }
.interactive-tip { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-3); padding: 4px 14px; background: #FFF7ED; border-radius: var(--radius-full); display: inline-block; }

/* 结果反馈 */
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

/* 完成页 */
.completion { animation: popIn 0.4s; }
.completion-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-8) var(--space-5); text-align: center; box-shadow: var(--shadow-md); }
.trophy { font-size: 56px; margin-bottom: var(--space-3); }
.completion-card h2 { font-size: var(--font-size-xl); margin-bottom: var(--space-4); color: var(--text-primary); }
.stars-earned { font-size: var(--font-size-sm); color: #F59E0B; font-weight: 700; margin-bottom: var(--space-4); padding: 6px 16px; background: #FFFBEB; border-radius: var(--radius-full); display: inline-block; }
.stats { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); }
.stat-item { flex: 1; background: var(--bg-main); border-radius: var(--radius-md); padding: var(--space-3); }
.stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-primary); }
.stat-value.correct { color: var(--color-success); }
.stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; }
.completion-actions { display: flex; gap: var(--space-3); justify-content: center; }
.btn-action { padding: 10px 20px; border: none; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-light); box-shadow: var(--shadow-primary); }
.btn-secondary { background: var(--bg-input); color: var(--text-primary); }
.btn-secondary:hover { background: #E5E7EB; }
</style>
