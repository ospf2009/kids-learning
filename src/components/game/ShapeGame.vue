<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  question: string
  correctAnswer: string
  options: string[]
  shapeType: string
  hint?: string
  onComplete: (correct: boolean) => void
}>()

const selectedAnswer = ref<string | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)

// 监听问题变化，重置状态
watch(() => props.question, () => {
  selectedAnswer.value = null
  showResult.value = false
  isCorrect.value = false
}, { immediate: true })

const shapePath = computed(() => {
  switch (props.shapeType) {
    case 'circle': return 'M 100 50 A 50 50 0 1 1 100 150 A 50 50 0 1 1 100 50'
    case 'triangle': return 'M 100 30 L 170 150 L 30 150 Z'
    case 'square': return 'M 40 40 L 160 40 L 160 160 L 40 160 Z'
    case 'rectangle': return 'M 20 50 L 180 50 L 180 130 L 20 130 Z'
    default: return ''
  }
})

const shapeName = computed(() => {
  switch (props.shapeType) {
    case 'circle': return '圆形'
    case 'triangle': return '三角形'
    case 'square': return '正方形'
    case 'rectangle': return '长方形'
    default: return ''
  }
})

function selectAnswer(option: string) {
  if (showResult.value) return
  selectedAnswer.value = option
  isCorrect.value = option === props.correctAnswer
  showResult.value = true
  props.onComplete(isCorrect.value)
}
</script>

<template>
  <div class="shape-game">
    <div class="question">{{ question }}</div>
    <div class="hint" v-if="hint">💡 {{ hint }}</div>

    <!-- 图形展示 -->
    <div class="shape-display">
      <svg viewBox="0 0 200 200" class="shape-svg">
        <path :d="shapePath" fill="var(--color-math)" stroke="var(--color-secondary)" stroke-width="3"/>
      </svg>
      <div class="shape-name">{{ shapeName }}</div>
    </div>

    <!-- 选项 -->
    <div class="options-grid">
      <button
        v-for="option in options"
        :key="option"
        class="option-btn"
        :class="{
          selected: selectedAnswer === option,
          correct: showResult && option === correctAnswer,
          wrong: showResult && selectedAnswer === option && option !== correctAnswer
        }"
        @click="selectAnswer(option)"
        :disabled="showResult"
      >
        {{ option }}
      </button>
    </div>

    <!-- 结果 -->
    <div class="result" v-if="showResult">
      <div class="result-icon">{{ isCorrect ? '🎉' : '😊' }}</div>
      <div class="result-text">
        {{ isCorrect ? '太棒了！' : '正确答案是：' + correctAnswer }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.shape-game { text-align: center; padding: 16px; }
.question { font-size: 24px; font-weight: 700; margin: 16px 0; }
.hint { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; padding: 8px; background: #FFF9E6; border-radius: 999px; display: inline-block; }
.shape-display { margin: 24px 0; }
.shape-svg { width: 120px; height: 120px; }
.shape-name { font-size: 18px; font-weight: 600; color: var(--text-secondary); margin-top: 8px; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
.option-btn { background: white; border: 3px solid #EEE; border-radius: 16px; padding: 20px; font-family: var(--font-family); font-size: 24px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--color-math); }
.option-btn.selected { border-color: var(--color-math); background: #E8FFF8; }
.option-btn.correct { border-color: var(--color-secondary); background: #E8FFE8; animation: pop 0.3s; }
.option-btn.wrong { border-color: #FF6B6B; background: #FFF0F0; }
@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
.result { margin-top: 24px; animation: bounce-in 0.5s; }
.result-icon { font-size: 48px; margin-bottom: 8px; }
.result-text { font-size: 20px; font-weight: 600; }
@keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
