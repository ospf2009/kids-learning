<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getChapters, type GradeId } from '@/data/chapters'
import { playVictorySound, playCorrectSound, playWrongSound } from '@/utils/sound'

const router = useRouter()
const authStore = useAuthStore()

const questions = ref<any[]>([])
const currentIndex = ref(0)
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)
const correctCount = ref(0)
const startTime = ref(Date.now())

function generateDailyChallenge() {
  correctCount.value = 0
  currentIndex.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  showCompletion.value = false
  startTime.value = Date.now()

  const grade = (authStore.grade || 'grade1-down') as GradeId
  const subjects = ['chinese', 'math', 'english'] as const
  const picked: any[] = []

  for (const subject of subjects) {
    const chapters = getChapters(grade, subject)
    for (const ch of chapters) {
      for (const q of ch.questions) {
        if (picked.length < 10) {
          picked.push({ ...q, subject, chapterTitle: ch.title })
        }
      }
    }
  }

  // 随机打乱
  picked.sort(() => Math.random() - 0.5)
  questions.value = picked.slice(0, 10)
}

// 初始化
generateDailyChallenge()

const currentQuestion = computed(() => questions.value[currentIndex.value])

import { computed } from 'vue'

const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((currentIndex.value / questions.value.length) * 100)
})

function selectAnswer(answer: string) {
  if (showResult.value) return
  selectedAnswer.value = answer
  isCorrect.value = answer === currentQuestion.value?.answer
  showResult.value = true
  if (isCorrect.value) {
    correctCount.value++
    playCorrectSound()
  } else {
    playWrongSound()
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    selectedAnswer.value = ''
    showResult.value = false
  } else {
    showCompletion.value = true
    playVictorySound()
  }
}

function goBack() { router.push('/') }
</script>

<template>
  <div class="challenge-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>⭐ 每日挑战</h1>
      <button class="refresh-btn" @click="generateDailyChallenge"><></button>
    </header>

    <div class="challenge-info" v-if="!showCompletion">
      <div class="info-card">
        <div class="info-icon">💡</div>
        <div class="info-text">
          <div class="info-title">{{ questions.length }}道精选题目</div>
          <div class="info-desc">📖 🔢 🔤 包含语文、数学、英语</div>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>
    </div>

    <div class="question-area" v-if="currentQuestion && !showCompletion">
      <div class="question-card">
        <div class="question-tag">{{ currentQuestion.subject === 'chinese' ? '📖' : currentQuestion.subject === 'math' ? '🔢' : '🔤' }} {{ currentQuestion.chapterTitle }}</div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>
      </div>

      <div class="options-grid" v-if="currentQuestion.type === 'choice' || currentQuestion.type === 'judge'">
        <button
          v-for="opt in (currentQuestion.type === 'judge' ? ['对', '错'] : currentQuestion.options)"
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

      <div v-if="currentQuestion.type === 'fill'" class="fill-area">
        <div class="fill-options">
          <button
            v-for="opt in (currentQuestion.options || ['a','e','i','o','u','b'].slice(0,6))"
            :key="opt"
            class="option-btn"
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

      <div class="result-feedback" v-if="showResult">
        <div class="feedback-icon">{{ isCorrect ? ':)' : ':)' }}</div>
        <div class="feedback-text">
          {{ isCorrect ? '答对啦！' : '正确答案是「' + currentQuestion?.answer + '」' }}
        </div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < questions.length - 1 ? '下一题 ->' : '查看成绩 C' }}
        </button>
      </div>
    </div>

    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">🏆</div>
        <h2>每日挑战完成！</h2>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ questions.length }}</div><div class="stat-label">📝 总题数</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ correctCount }}</div><div class="stat-label">✅ 答对</div></div>
          <div class="stat-item"><div class="stat-value">{{ Math.round(correctCount / questions.length * 100) }}%</div><div class="stat-label">🎯 正确率</div></div>
        </div>
        <div class="completion-actions">
          <button class="btn-action btn-primary" @click="generateDailyChallenge">再来一次 <></button>
          <button class="btn-action btn-secondary" @click="goBack">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.challenge-page { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.back-btn { background: white; border: 2px solid #EEE; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; font-family: inherit; }
.back-btn:hover { border-color: var(--color-primary); }
h1 { font-size: 20px; flex: 1; }
.refresh-btn { background: white; border: 2px solid #EEE; border-radius: 50%; width: 40px; height: 40px; font-size: 18px; cursor: pointer; }

.challenge-info { margin-bottom: 16px; }
.info-card { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #FFF9E6, #FFF3CC); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
.info-icon { font-size: 36px; }
.info-title { font-size: 16px; font-weight: 700; color: #333; }
.info-desc { font-size: 13px; color: #888; }
.progress-section { display: flex; align-items: center; gap: 12px; }
.progress-bar { flex: 1; height: 8px; background: #F0F0F0; border-radius: 5px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, #FFD700, #FF8E8E); border-radius: 5px; transition: width 0.3s; }
.progress-text { font-size: 13px; color: #888; font-weight: 600; min-width: 50px; text-align: right; }

.question-card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 16px; text-align: center; }
.question-tag { font-size: 12px; color: #888; margin-bottom: 8px; }
.question-text { font-size: 22px; color: #333; line-height: 1.4; }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.option-btn { background: white; border: 3px solid #EEE; border-radius: 14px; padding: 16px; font-family: inherit; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: #FFD700; }
.option-btn.selected { border-color: #FFD700; background: #FFFDE6; }
.option-btn.correct { border-color: #4ECDC4; background: #E8FFE8; }
.option-btn.wrong { border-color: #FF6B6B; background: #FFF0F0; }

.fill-area { text-align: center; }
.fill-options { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

.result-feedback { text-align: center; margin-top: 20px; }
.feedback-icon { font-size: 56px; margin-bottom: 8px; }
.feedback-text { font-size: 18px; color: #333; margin-bottom: 16px; }
.next-btn { padding: 12px 24px; background: linear-gradient(135deg, #FFD700, #FF8E8E); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; min-width: 180px; }

.completion-card { background: white; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.trophy { font-size: 72px; margin-bottom: 12px; }
.completion-card h2 { font-size: 24px; margin-bottom: 20px; }
.stats { display: flex; gap: 16px; margin-bottom: 24px; }
.stat-item { flex: 1; background: #F5F5F5; border-radius: 12px; padding: 12px; }
.stat-value { font-size: 28px; font-weight: 700; color: #FFD700; }
.stat-value.correct { color: #4ECDC4; }
.stat-label { font-size: 13px; color: #888; }
.completion-actions { display: flex; gap: 12px; justify-content: center; }
.btn-action { padding: 12px 24px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; }
.btn-primary { background: linear-gradient(135deg, #FFD700, #FF8E8E); color: white; }
.btn-secondary { background: #F5F5F5; color: #333; }
</style>
