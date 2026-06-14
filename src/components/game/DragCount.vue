<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface DragItem {
  id: string
  emoji: string
  count: number
}

const props = defineProps<{
  question: string
  correctAnswer: number
  dragItems: DragItem[]
  hint?: string
  onComplete: (correct: boolean) => void
}>()

const droppedItems = ref<string[]>([])
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)

// 监听问题变化，重置状态
watch(() => props.question, () => {
  droppedItems.value = []
  selectedAnswer.value = null
  showResult.value = false
  isCorrect.value = false
}, { immediate: true })

const allItems = computed(() => {
  const items: Array<{ id: string; emoji: string }> = []
  props.dragItems.forEach(item => {
    for (let i = 0; i < item.count; i++) {
      items.push({ id: `${item.id}-${i}`, emoji: item.emoji })
    }
  })
  return items
})

const displayItems = computed(() => {
  return allItems.value.map(item => ({
    ...item,
    dropped: droppedItems.value.includes(item.id)
  }))
})

function toggleItem(id: string) {
  if (showResult.value) return
  const index = droppedItems.value.indexOf(id)
  if (index === -1) {
    droppedItems.value.push(id)
  } else {
    droppedItems.value.splice(index, 1)
  }
}

function checkAnswer() {
  selectedAnswer.value = droppedItems.value.length
  isCorrect.value = droppedItems.value.length === props.correctAnswer
  showResult.value = true
  props.onComplete(isCorrect.value)
}
</script>

<template>
  <div class="drag-count">
    <div class="question">{{ question }}</div>
    <div class="hint" v-if="hint">💡 {{ hint }}</div>

    <!-- 可点击的物品 -->
    <div class="items-area">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="item"
        :class="{ dropped: item.dropped }"
        @click="toggleItem(item.id)"
      >
        {{ item.emoji }}
        <div class="check-mark" v-if="item.dropped">✓</div>
      </div>
    </div>

    <!-- 已选数量 -->
    <div class="count-display">
      <div class="count-label">已选数量</div>
      <div class="count-value">{{ droppedItems.length }}</div>
    </div>

    <!-- 确认按钮 -->
    <button
      class="btn btn-primary confirm-btn"
      @click="checkAnswer"
      :disabled="showResult"
    >
      确认答案 ✓
    </button>

    <!-- 结果 -->
    <div class="result" v-if="showResult">
      <div class="result-icon">{{ isCorrect ? '🎉' : '😊' }}</div>
      <div class="result-text">
        {{ isCorrect ? '太棒了！数对了！' : '正确答案是 ' + correctAnswer + ' 个' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag-count { text-align: center; padding: 16px; }
.question { font-size: 24px; font-weight: 700; margin: 16px 0; }
.hint { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; padding: 8px; background: #FFF9E6; border-radius: 999px; display: inline-block; }
.items-area { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 24px 0; min-height: 120px; }
.item { width: 64px; height: 64px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; cursor: pointer; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative; }
.item:hover { transform: scale(1.1); }
.item.dropped { background: linear-gradient(135deg, #4ECDC4, #6EDDD6); transform: scale(0.9); box-shadow: 0 2px 8px rgba(78, 205, 196, 0.4); }
.check-mark { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: var(--color-secondary); color: white; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.count-display { margin: 16px 0; }
.count-label { font-size: 14px; color: var(--text-secondary); }
.count-value { font-size: 48px; font-weight: 700; color: var(--color-math); }
.confirm-btn { min-width: 200px; margin: 16px 0; }
.result { margin-top: 24px; animation: bounce-in 0.5s; }
.result-icon { font-size: 48px; margin-bottom: 8px; }
.result-text { font-size: 20px; font-weight: 600; }
@keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
