<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  character: string
  strokes: string[]
  hint?: string
  onComplete: (correct: boolean) => void
}>()

const currentStroke = ref(0)
const isAnimating = ref(false)
const showResult = ref(false)
const isCorrect = ref(false)

const strokePaths: Record<string, string> = {
  '横': 'M 30 100 L 170 100',
  '竖': 'M 100 30 L 100 170',
  '撇': 'M 140 30 L 60 170',
  '捺': 'M 60 30 L 140 170',
  '横折': 'M 30 50 L 150 50 L 150 150',
  '横撇': 'M 30 50 L 120 50 L 60 130',
  '竖钩': 'M 100 30 L 100 150 L 80 130',
  '弯钩': 'M 100 30 Q 120 100 100 150 Q 80 130 90 110',
}

const currentPath = computed(() => strokePaths[props.strokes[currentStroke.value]] || '')

// 监听字符变化，重置状态
watch(() => props.character, () => {
  currentStroke.value = 0
  showResult.value = false
  isCorrect.value = false
  isAnimating.value = true
  setTimeout(() => { isAnimating.value = false }, 1000)
}, { immediate: true })

function nextStroke() {
  if (currentStroke.value < props.strokes.length - 1) {
    isAnimating.value = true
    setTimeout(() => {
      currentStroke.value++
      isAnimating.value = false
    }, 500)
  } else {
    showResult.value = true
    isCorrect.value = true
    props.onComplete(true)
  }
}
</script>

<template>
  <div class="stroke-order">
    <div class="character-display">
      <svg viewBox="0 0 200 200" class="character-svg">
        <!-- 网格线 -->
        <line x1="100" y1="0" x2="100" y2="200" stroke="#EEE" stroke-width="1" stroke-dasharray="5,5"/>
        <line x1="0" y1="100" x2="200" y2="100" stroke="#EEE" stroke-width="1" stroke-dasharray="5,5"/>
        
        <!-- 已完成的笔画 -->
        <path
          v-for="(stroke, index) in strokes.slice(0, currentStroke)"
          :key="'done-' + index"
          :d="strokePaths[stroke]"
          stroke="var(--color-chinese)"
          stroke-width="8"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        <!-- 当前笔画（动画） -->
        <path
          v-if="currentPath"
          :d="currentPath"
          stroke="var(--color-primary)"
          stroke-width="8"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ animating: isAnimating }"
        />
      </svg>
    </div>

    <div class="stroke-info">
      <div class="stroke-label">第 {{ currentStroke + 1 }} 笔</div>
      <div class="stroke-name">{{ strokes[currentStroke] }}</div>
    </div>

    <div class="hint" v-if="hint">💡 {{ hint }}</div>

    <button class="btn btn-primary next-btn" @click="nextStroke">
      {{ currentStroke < strokes.length - 1 ? '下一笔 →' : '完成 ✨' }}
    </button>

    <div class="result" v-if="showResult">
      <div class="result-icon">🎉</div>
      <div class="result-text">太棒了！学会了 {{ character }} 的笔顺</div>
    </div>
  </div>
</template>

<style scoped>
.stroke-order { text-align: center; padding: 16px; }
.character-display { margin: 24px 0; }
.character-svg { width: 160px; height: 160px; background: #FFF9F0; border-radius: 16px; border: 2px solid #EEE; }
.animating { animation: draw 1s ease-in-out forwards; stroke-dasharray: 200; stroke-dashoffset: 200; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.stroke-info { margin: 16px 0; }
.stroke-label { font-size: 14px; color: var(--text-secondary); }
.stroke-name { font-size: 24px; font-weight: 700; color: var(--color-chinese); }
.hint { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; padding: 8px; background: #FFF9E6; border-radius: 999px; display: inline-block; }
.next-btn { min-width: 200px; margin: 16px 0; }
.result { margin-top: 24px; animation: bounce-in 0.5s; }
.result-icon { font-size: 48px; margin-bottom: 8px; }
.result-text { font-size: 20px; font-weight: 600; }
@keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
