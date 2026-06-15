<script setup lang="ts">
import { ref, watch } from 'vue'
import { playCorrectSound, playWrongSound, speakCorrect, speakWrong } from '@/utils/sound'

const props = defineProps<{
  title: string
  lines: string[]
  author: string
  options: string[]
  correctAnswer: string
  hint?: string
  onComplete: (correct: boolean) => void
}>()

const selectedAnswer = ref<string | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)
const currentLine = ref(0)

// 监听标题变化，重置状态
watch(() => props.title, () => {
  selectedAnswer.value = null
  showResult.value = false
  isCorrect.value = false
  currentLine.value = 0
}, { immediate: true })

function selectAnswer(option: string) {
  if (showResult.value) return
  selectedAnswer.value = option
  isCorrect.value = option === props.correctAnswer
  showResult.value = true
  props.onComplete(isCorrect.value)
  if (isCorrect.value) {
    playCorrectSound()
    speakCorrect()
  } else {
    playWrongSound()
    speakWrong()
  }
}

function nextLine() {
  if (currentLine.value < props.lines.length - 1) {
    currentLine.value++
  }
}
</script>

<template>
  <div class="poem-display">
    <div class="poem-card">
      <div class="poem-title">📜 {{ title }}</div>
      
      <!-- 逐行显示诗句 -->
      <div class="poem-lines">
        <div
          v-for="(line, index) in lines"
          :key="index"
          class="poem-line"
          :class="{ visible: index <= currentLine, current: index === currentLine }"
        >
          {{ line }}
        </div>
      </div>

      <!-- 下一句按钮 -->
      <button
        v-if="currentLine < lines.length - 1"
        class="btn btn-accent next-line-btn"
        @click="nextLine"
      >
        下一句 →
      </button>
    </div>

    <!-- 作者问答 -->
    <div class="author-question">
      <div class="question-text">这首诗是谁写的？</div>
      <div class="hint" v-if="hint">💡 {{ hint }}</div>
      
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
    </div>

    <div class="result" v-if="showResult">
      <div class="result-icon">{{ isCorrect ? '🎉' : '😊' }}</div>
      <div class="result-text">
        {{ isCorrect ? '太棒了！' : '正确答案是：' + correctAnswer }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.poem-display { text-align: center; padding: 16px; }
.poem-card { background: linear-gradient(135deg, #FFF9F0, #FFF5E6); border-radius: 24px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.poem-title { font-size: 24px; font-weight: 700; color: var(--color-chinese); margin-bottom: 24px; }
.poem-lines { margin-bottom: 16px; min-height: 120px; }
.poem-line { font-size: 20px; color: var(--text-primary); padding: 8px; opacity: 0; transform: translateY(10px); transition: all 0.5s ease; }
.poem-line.visible { opacity: 1; transform: translateY(0); }
.poem-line.current { color: var(--color-chinese); font-weight: 700; }
.next-line-btn { margin-top: 16px; }
.author-question { margin: 24px 0; }
.question-text { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
.hint { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; padding: 8px; background: #FFF9E6; border-radius: 999px; display: inline-block; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.option-btn { background: white; border: 3px solid #EEE; border-radius: 16px; padding: 16px; font-family: var(--font-family); font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--color-chinese); }
.option-btn.selected { border-color: var(--color-chinese); background: #FFF0F0; }
.option-btn.correct { border-color: var(--color-secondary); background: #E8FFE8; animation: pop 0.3s; }
.option-btn.wrong { border-color: #FF6B6B; background: #FFF0F0; }
@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
.result { margin-top: 24px; animation: bounce-in 0.5s; }
.result-icon { font-size: 48px; margin-bottom: 8px; }
.result-text { font-size: 20px; font-weight: 600; }
@keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
