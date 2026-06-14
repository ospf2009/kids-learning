<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  items: Array<{ id: string; question: string; answer: number | string; options?: (number | string)[] }>
  onComplete: (score: number, correct: number, total: number) => void
}>()

const currentIndex = ref(0)
const score = ref(0)
const correctCount = ref(0)
const timeLeft = ref(60)
const isFinished = ref(false)
const selectedAnswer = ref<string | number | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)
const combo = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

const currentItem = computed(() => props.items[currentIndex.value])
const progress = computed(() => ((currentIndex.value) / props.items.length) * 100)

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function startTimer() {
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      finishGame()
    }
  }, 1000)
}

function selectAnswer(option: string | number) {
  if (showResult.value || isFinished.value) return
  selectedAnswer.value = option
  isCorrect.value = String(option) === String(currentItem.value.answer)
  showResult.value = true

  if (isCorrect.value) {
    combo.value++
    correctCount.value++
    score.value += 10 * Math.min(combo.value, 3)
  } else {
    combo.value = 0
  }

  setTimeout(() => {
    if (currentIndex.value < props.items.length - 1) {
      currentIndex.value++
      selectedAnswer.value = null
      showResult.value = false
    } else {
      finishGame()
    }
  }, 800)
}

function finishGame() {
  if (timer) clearInterval(timer)
  isFinished.value = true
  props.onComplete(score.value, correctCount.value, props.items.length)
}
</script>

<template>
  <div class="timed-challenge">
    <!-- 计时器和分数 -->
    <div class="game-header">
      <div class="timer" :class="{ urgent: timeLeft <= 10 }">
        ⏰ {{ timeLeft }}s
      </div>
      <div class="score">⭐ {{ score }}</div>
      <div class="combo" v-if="combo >= 2">🔥 {{ combo }}连击</div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-bar">
        <div class="fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- 题目 -->
    <div class="question-card" v-if="!isFinished">
      <h2>{{ currentItem?.question }}</h2>
    </div>

    <!-- 选项 -->
    <div class="options-grid" v-if="!isFinished">
      <button
        v-for="option in currentItem?.options"
        :key="String(option)"
        class="option-btn"
        :class="{
          correct: showResult && String(option) === String(currentItem?.answer),
          wrong: showResult && selectedAnswer === option && String(option) !== String(currentItem?.answer)
        }"
        @click="selectAnswer(option)"
        :disabled="showResult"
      >
        {{ option }}
      </button>
    </div>

    <!-- 结果 -->
    <div class="result-overlay" v-if="isFinished">
      <div class="result-card">
        <div class="trophy">🏆</div>
        <h2>时间到！</h2>
        <div class="stats">
          <div class="stat"><div class="stat-value">{{ correctCount }}</div><div class="stat-label">答对</div></div>
          <div class="stat"><div class="stat-value">{{ score }}</div><div class="stat-label">得分</div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timed-challenge { padding: 16px; }
.game-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.timer { font-size: 24px; font-weight: 700; color: var(--color-math); padding: 8px 16px; background: #E8FFF8; border-radius: 999px; }
.timer.urgent { color: #FF6B6B; background: #FFF0F0; animation: pulse 0.5s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.score { font-size: 20px; font-weight: 700; color: var(--color-accent); }
.combo { font-size: 16px; font-weight: 700; color: var(--color-primary); background: #FFE8E8; padding: 4px 12px; border-radius: 999px; }
.progress-section { margin-bottom: 24px; }
.progress-bar { height: 8px; background: #F0F0F0; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--color-math), #6EDDD6); border-radius: 999px; transition: width 0.3s; }
.question-card { background: white; border-radius: 24px; padding: 32px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.08); margin-bottom: 24px; }
.question-card h2 { font-size: 32px; color: var(--text-primary); }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.option-btn { background: white; border: 3px solid #EEE; border-radius: 16px; padding: 20px; font-family: var(--font-family); font-size: 24px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--color-math); }
.option-btn.correct { border-color: var(--color-secondary); background: #E8FFE8; animation: pop 0.3s; }
.option-btn.wrong { border-color: #FF6B6B; background: #FFF0F0; }
@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
.result-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.result-card { background: white; border-radius: 24px; padding: 48px; text-align: center; max-width: 300px; }
.trophy { font-size: 64px; margin-bottom: 16px; }
.result-card h2 { font-size: 28px; margin-bottom: 24px; }
.stats { display: flex; gap: 24px; }
.stat { flex: 1; background: #E8FFF8; border-radius: 12px; padding: 16px; }
.stat-value { font-size: 32px; font-weight: 700; color: var(--color-math); }
.stat-label { font-size: 14px; color: var(--text-secondary); }
</style>
