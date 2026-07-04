<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getChapter, type GradeId, type Subject } from '@/data/chapters'
import { playCorrectSound, playWrongSound, speakCorrect, speakWrong, playVictorySound } from '@/utils/sound'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const subject = computed<Subject>(() => (route.params.subject as Subject) || 'chinese')
const chapterId = route.params.chapterId as string
const userGrade = computed<GradeId>(() => (authStore.grade || 'grade1-down') as GradeId)
const chapter = computed(() => getChapter(userGrade.value, subject.value, chapterId))

const currentIndex = ref(0)
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)
const correctCount = ref(0)

const currentQuestion = computed(() => chapter.value?.questions[currentIndex.value])

const progress = computed(() => {
  if (!chapter.value) return 0
  return Math.round((currentIndex.value / chapter.value.questions.length) * 100)
})

const subjectColors: Record<string, string> = { chinese: '#FF6B6B', math: '#4ECDC4', english: '#60A5FA' }

function selectAnswer(answer: string) {
  if (showResult.value) return
  selectedAnswer.value = answer
  isCorrect.value = answer === currentQuestion.value?.answer
  showResult.value = true
  if (isCorrect.value) {
    correctCount.value++
    playCorrectSound()
    speakCorrect()
  } else {
    playWrongSound()
    speakWrong()
  }
}

function nextQuestion() {
  if (!chapter.value) return
  if (currentIndex.value < chapter.value.questions.length - 1) {
    currentIndex.value++
    selectedAnswer.value = ''
    showResult.value = false
  } else {
    showCompletion.value = true
    playVictorySound()
  }
}

function retry() {
  currentIndex.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  showCompletion.value = false
  correctCount.value = 0
}

function goBack() {
  router.push(`/practice/${subject.value}`)
}

function getFillOptions(q: any): string[] {
  // 填空题如果没提供选项，提供常用答案选项
  if (q.options && q.options.length > 0) return q.options
  // 提供一些常用字母选项
  return ['a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w', 'y'].slice(0, 6)
}
</script>

<template>
  <div class="chapter-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>{{ chapter?.icon }} {{ chapter?.title }}</h1>
    </header>

    <div class="progress-section" v-if="!showCompletion">
      <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
      <span class="progress-text">{{ currentIndex + 1 }} / {{ chapter?.questions.length }}</span>
    </div>

    <!-- 答题区 -->
    <div class="question-area" v-if="currentQuestion && !showCompletion">
      <div class="question-card">
        <div class="question-hint" v-if="currentQuestion.hint">! {{ currentQuestion.hint }}</div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>
      </div>

      <!-- 选择题 -->
      <div v-if="currentQuestion.type === 'choice'" class="options-grid">
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
      <div v-if="currentQuestion.type === 'judge'" class="options-grid">
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
        >{{ opt === '对' ? 'V 对' : 'X 错' }}</button>
      </div>

      <!-- 填空题（带选项版本） -->
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
        <div class="feedback-icon">{{ isCorrect ? ':)' : ':)' }}</div>
        <div class="feedback-text">
          {{ isCorrect ? '太棒了！答对啦！' : '加油哦！正确答案是「' + currentQuestion?.answer + '」' }}
        </div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < (chapter?.questions.length || 0) - 1 ? '下一题 ->' : '查看成绩 C' }}
        </button>
      </div>
    </div>

    <!-- 完成页面 -->
    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">🏆</div>
        <h2>练习完成！</h2>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ chapter?.questions.length }}</div><div class="stat-label">📝 总题数</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ correctCount }}</div><div class="stat-label">✅ 答对</div></div>
          <div class="stat-item"><div class="stat-value">{{ chapter ? Math.round(correctCount / chapter.questions.length * 100) : 0 }}%</div><div class="stat-label">🎯 正确率</div></div>
        </div>
        <div class="completion-actions">
          <button class="btn-action btn-secondary" @click="retry">再来一次 <></button>
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
.question-hint { font-size: 13px; color: #888; margin-bottom: 12px; padding: 6px 12px; background: #FFF9E6; border-radius: 20px; display: inline-block; }
.question-text { font-size: 22px; color: #333; line-height: 1.4; }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
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
.trophy { font-size: 72px; margin-bottom: 12px; }
.completion-card h2 { font-size: 24px; margin-bottom: 20px; color: #333; }
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

@keyframes bounce-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>
