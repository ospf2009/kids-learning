<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { playCorrectSound, playWrongSound, playClickSound, speakCorrect, speakWrong } from '@/utils/sound'

const props = defineProps<{
  question: string
  correctAnswer: string
  options: string[]
  hint?: string
  onComplete: (correct: boolean) => void
}>()

const bubbles = ref<Array<{ id: number; text: string; x: number; y: number; popped: boolean; isCorrect: boolean }>>([])
const isFinished = ref(false)
const isCorrect = ref(false)
const showHint = ref(false)
const selectedWrong = ref(false)

// 监听问题变化，重新初始化
watch(() => props.question, () => {
  initBubbles()
}, { immediate: true })

function initBubbles() {
  const shuffled = [...props.options].sort(() => Math.random() - 0.5)
  bubbles.value = shuffled.map((text, i) => ({
    id: i,
    text,
    x: 10 + (i % 3) * 30 + Math.random() * 10,
    y: 15 + Math.floor(i / 3) * 35 + Math.random() * 10,
    popped: false,
    isCorrect: text === props.correctAnswer
  }))
  isFinished.value = false
  isCorrect.value = false
  showHint.value = false
  selectedWrong.value = false
}

function popBubble(bubble: typeof bubbles.value[0]) {
  if (bubble.popped || isFinished.value) return
  
  bubble.popped = true
  playClickSound()

  if (bubble.isCorrect) {
    isCorrect.value = true
    isFinished.value = true
    playCorrectSound()
    speakCorrect()
    setTimeout(() => props.onComplete(true), 600)
  } else {
    selectedWrong.value = true
    playWrongSound()
    // 错误的泡泡，显示X后继续
    setTimeout(() => {
      selectedWrong.value = false
    }, 500)
  }
}
</script>

<template>
  <div class="bubble-game">
    <div class="question">{{ question }}</div>
    <div class="hint-btn" @click="showHint = !showHint" v-if="hint">💡 提示</div>
    <div class="hint-text" v-if="showHint">{{ hint }}</div>
    
    <div class="bubble-area">
      <div
        v-for="bubble in bubbles"
        :key="bubble.id"
        class="bubble"
        :class="{ 
          popped: bubble.popped && !bubble.isCorrect,
          correct: bubble.popped && bubble.isCorrect,
          wrong: bubble.popped && !bubble.isCorrect
        }"
        :style="{ left: bubble.x + '%', top: bubble.y + '%' }"
        @click="popBubble(bubble)"
      >
        <span v-if="!bubble.popped">{{ bubble.text }}</span>
        <span v-else-if="bubble.isCorrect">✅</span>
        <span v-else>❌</span>
      </div>
    </div>

    <div class="result" v-if="isFinished">
      <div class="result-icon">{{ isCorrect ? '🎉' : '😊' }}</div>
      <div class="result-text">{{ isCorrect ? '太棒了！' : '正确答案是：' + correctAnswer }}</div>
    </div>
  </div>
</template>

<style scoped>
.bubble-game { position: relative; min-height: 380px; padding: 16px; }
.question { text-align: center; font-size: 24px; font-weight: 700; margin: 16px 0; }
.hint-btn { text-align: center; color: var(--text-secondary); font-size: 14px; cursor: pointer; margin-bottom: 8px; }
.hint-text { text-align: center; color: var(--color-accent); font-size: 14px; padding: 8px; background: #FFF9E6; border-radius: 999px; margin-bottom: 16px; }
.bubble-area { position: relative; height: 280px; background: linear-gradient(180deg, #E8F4FF, #FFF9F0); border-radius: 24px; overflow: hidden; }
.bubble { 
  position: absolute; 
  width: 80px; 
  height: 80px; 
  border-radius: 50%; 
  background: linear-gradient(135deg, #60A5FA, #93C5FD); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 18px; 
  font-weight: 700; 
  color: white; 
  cursor: pointer; 
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); 
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.4); 
  animation: float 3s ease-in-out infinite; 
}
.bubble:nth-child(2n) { 
  animation-delay: 1s; 
  background: linear-gradient(135deg, #F472B6, #F9A8D4); 
  box-shadow: 0 4px 15px rgba(244, 114, 182, 0.4); 
}
.bubble:nth-child(3n) { 
  animation-delay: 2s; 
  background: linear-gradient(135deg, #4ECDC4, #6EDDD6); 
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4); 
}
.bubble:hover:not(.popped):not(.correct):not(.wrong) { transform: scale(1.15); }
.bubble.popped { transform: scale(0); opacity: 0; pointer-events: none; transition: all 0.3s; }
.bubble.correct { 
  background: linear-gradient(135deg, #4ECDC4, #6EDDD6); 
  transform: scale(1.2); 
  opacity: 1; 
  pointer-events: none;
}
.bubble.wrong { 
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E); 
  transform: scale(0.8); 
  opacity: 0.5; 
  pointer-events: none;
}
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.result { text-align: center; margin-top: 24px; animation: bounce-in 0.5s; }
.result-icon { font-size: 48px; margin-bottom: 8px; }
.result-text { font-size: 20px; font-weight: 600; }
@keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
