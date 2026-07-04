<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useUserStore } from '@/stores/user'
import { getChapter, type GradeId, type Subject, type Question } from '@/data/chapters'
import { getMixedQuestions } from '@/utils/questionGenerator'
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
const shuffledQuestions = computed(() => {
  if (!chapterData.value) return []
  return getMixedQuestions(chapterData.value, subject.value, userGrade.value)
})

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

async function selectAnswer(answer: string) {
  if (showResult.value) return
  selectedAnswer.value = answer
  isCorrect.value = answer === currentQuestion.value?.answer
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

  // 记录错题到 IndexedDB
  if (authStore.currentUser && currentQuestion.value) {
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

// Fisher-Yates shuffle (local helper)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getFillOptions(q: Question): string[] {
  // 如果题目提供了选项，优先使用
  if (q.options && q.options.length > 0) return q.options

  // 确保正确答案在选项中
  const answer = q.answer
  // 通用字母/数字选项池
  const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                '对', '错', '上', '下', '左', '右', '大', '小', '多', '少',
                '天', '地', '人', '口', '手', '足', '日', '月', '水', '火',
                '木', '金', '土', '山', '石', '田', '飞', '虫', '鸟',
                '春', '夏', '秋', '冬', '风', '雪', '花', '草', '果', '叶',
                '米', '厘', '元', '角', '分']

  // 构建包含正确答案 + 干扰项的选项
  const opts = new Set<string>()
  opts.add(answer)

  // 添加干扰项
  const noisePool = pool.filter(p => p !== answer)
  const shuffledNoise = shuffleArray(noisePool)
  const needed = Math.min(5, Math.max(3, 6 - opts.size))

  for (let i = 0; i < needed && i < shuffledNoise.length; i++) {
    opts.add(shuffledNoise[i]!)
  }

  return shuffleArray(Array.from(opts))
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
    </div>

    <!-- 答题区 -->
    <div class="question-area" v-if="currentQuestion && !showCompletion">
      <div class="question-card">
        <p class="question-type-badge">
          {{ currentQuestion.type === 'choice' ? '选择题' : currentQuestion.type === 'judge' ? '判断题' : '填空题' }}
        </p>
        <div class="question-hint" v-if="currentQuestion.hint">★ {{ currentQuestion.hint }}</div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>
      </div>

      <!-- 选择题 -->
      <div v-if="currentQuestion.type === 'choice'" class="options-grid"
        :class="{ 'options-grid-3': (currentQuestion.options?.length || 0) > 4 }">
        <button
          v-for="opt in currentQuestion.options"
          :key="opt"
          class="option-btn"
          :class="{
            selected: selectedAnswer === opt,
            correct: showResult && opt === currentQuestion.answer,
            wrong: showResult && selectedAnswer === opt && opt !== currentQuestion.answer
          }"
          @click="selectAnswer(opt!)"
          :disabled="showResult"
        >{{ opt }}</button>
      </div>

      <!-- 判断题 -->
      <div v-if="currentQuestion.type === 'judge'" class="options-grid options-grid-2">
        <button
          v-for="opt in ['对', '错']"
          :key="opt"
          class="option-btn"
          :class="{
            selected: selectedAnswer === opt,
            correct: showResult && opt === currentQuestion.answer,
            wrong: showResult && selectedAnswer === opt && opt !== currentQuestion.answer
          }"
          @click="selectAnswer(opt)"
          :disabled="showResult"
        >{{ opt === '对' ? '✓ 对' : '✗ 错' }}</button>
      </div>

      <!-- 填空题 -->
      <div v-if="currentQuestion.type === 'fill'" class="fill-area">
        <div class="fill-options">
          <button
            v-for="opt in getFillOptions(currentQuestion)"
            :key="opt"
            class="option-btn fill-opt"
            :class="{
              selected: selectedAnswer === opt,
              correct: showResult && opt === currentQuestion.answer,
              wrong: showResult && selectedAnswer === opt && opt !== currentQuestion.answer
            }"
            @click="selectAnswer(opt)"
            :disabled="showResult"
          >{{ opt }}</button>
        </div>
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
.chapter-page { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; }
.back-btn:hover { border-color: var(--color-primary); }
h1 { font-size: 20px; }

.progress-section { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.progress-bar { flex: 1; height: 10px; background: #F0F0F0; border-radius: 5px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), #6EDDD6); border-radius: 5px; transition: width 0.3s; }
.progress-text { font-size: 14px; color: #888; font-weight: 600; min-width: 60px; text-align: right; }

.question-area { margin-bottom: 16px; }
.question-card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 16px; text-align: center; }
.question-type-badge { font-size: 12px; color: #888; margin-bottom: 8px; padding: 3px 10px; background: #F0F0F0; border-radius: 10px; display: inline-block; }
.question-hint { font-size: 13px; color: #888; margin-bottom: 12px; padding: 6px 12px; background: #FFF9E6; border-radius: 20px; display: inline-block; }
.question-text { font-size: 22px; color: #333; line-height: 1.4; }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.options-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.options-grid-2 { grid-template-columns: 1fr 1fr; max-width: 320px; margin: 0 auto; }
.option-btn { background: white; border: 3px solid #EEE; border-radius: 14px; padding: 16px; font-family: inherit; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: var(--color-primary); }
.option-btn:disabled { cursor: default; }
.option-btn.selected { border-color: var(--color-primary); background: #FFF5F5; }
.option-btn.correct { border-color: #4ECDC4; background: #E8FFE8; animation: pop 0.3s; }
.option-btn.wrong { border-color: #FF6B6B; background: #FFF0F0; animation: shake 0.3s; }

.fill-area { text-align: center; }
.fill-options { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.fill-opt { min-width: 60px; padding: 12px; font-size: 20px; }

@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

.result-feedback { text-align: center; margin-top: 20px; animation: bounce-in 0.3s; }
.feedback-icon { font-size: 56px; margin-bottom: 8px; }
.feedback-text { font-size: 18px; color: #333; margin-bottom: 16px; }
.next-btn { padding: 12px 24px; background: linear-gradient(135deg, var(--color-primary), #FF8E8E); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; min-width: 180px; }

.completion { animation: bounce-in 0.4s; }
.completion-card { background: white; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.trophy { font-size: 72px; margin-bottom: 12px; animation: float 2s ease-in-out infinite; }
.completion-card h2 { font-size: 24px; margin-bottom: 20px; color: #333; }
.stars-earned { font-size: 16px; color: #FFB800; font-weight: 700; margin-bottom: 16px; padding: 8px 16px; background: #FFF9E6; border-radius: 20px; display: inline-block; }
.stats { display: flex; gap: 16px; margin-bottom: 24px; }
.stat-item { flex: 1; background: #F5F5F5; border-radius: 12px; padding: 12px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.stat-value.correct { color: #4ECDC4; }
.stat-label { font-size: 13px; color: #888; }
.completion-actions { display: flex; gap: 12px; justify-content: center; }
.btn-action { padding: 12px 24px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.btn-primary { background: linear-gradient(135deg, var(--color-primary), #FF8E8E); color: white; }
.btn-primary:hover { transform: scale(1.02); }
.btn-secondary { background: #F5F5F5; color: #333; }
.btn-secondary:hover { background: #E8E8E8; }

@keyframes bounce-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
</style>
