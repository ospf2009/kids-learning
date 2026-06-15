<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { playCorrectSound, playWrongSound, playClickSound } from '@/utils/sound'

interface MatchPair {
  id: string
  english: string
  chinese: string
  emoji: string
}

const props = defineProps<{
  pairs: MatchPair[]
  onComplete: (correct: boolean) => void
}>()

const selectedEnglish = ref<string | null>(null)
const selectedChinese = ref<string | null>(null)
const matchedPairs = ref<string[]>([])
const wrongPair = ref(false)

const shuffledEnglish = ref<MatchPair[]>([])
const shuffledChinese = ref<MatchPair[]>([])

// 监听pairs变化，重新初始化
watch(() => props.pairs, () => {
  shuffledEnglish.value = [...props.pairs].sort(() => Math.random() - 0.5)
  shuffledChinese.value = [...props.pairs].sort(() => Math.random() - 0.5)
  selectedEnglish.value = null
  selectedChinese.value = null
  matchedPairs.value = []
  wrongPair.value = false
}, { immediate: true })

const isComplete = computed(() => matchedPairs.value.length === props.pairs.length)

function selectEnglish(id: string) {
  if (matchedPairs.value.includes(id) || wrongPair.value) return
  selectedEnglish.value = id
  playClickSound()
  checkMatch()
}

function selectChinese(id: string) {
  if (matchedPairs.value.includes(id) || wrongPair.value) return
  selectedChinese.value = id
  playClickSound()
  checkMatch()
}

function checkMatch() {
  if (!selectedEnglish.value || !selectedChinese.value) return

  if (selectedEnglish.value === selectedChinese.value) {
    matchedPairs.value.push(selectedEnglish.value)
    selectedEnglish.value = null
    selectedChinese.value = null

    if (isComplete.value) {
      setTimeout(() => {
        playCorrectSound()
        props.onComplete(true)
      }, 500)
    }
  } else {
    wrongPair.value = true
    playWrongSound()
    setTimeout(() => {
      selectedEnglish.value = null
      selectedChinese.value = null
      wrongPair.value = false
    }, 600)
  }
}
</script>

<template>
  <div class="match-game">
    <div class="match-grid">
      <!-- 英文列 -->
      <div class="match-column">
        <div class="column-title">英文</div>
        <div
          v-for="item in shuffledEnglish"
          :key="'en-' + item.id"
          class="match-item english"
          :class="{
            matched: matchedPairs.includes(item.id),
            selected: selectedEnglish === item.id,
            wrong: wrongPair && selectedEnglish === item.id
          }"
          @click="selectEnglish(item.id)"
        >
          {{ item.english }}
        </div>
      </div>

      <!-- 中文列 -->
      <div class="match-column">
        <div class="column-title">中文</div>
        <div
          v-for="item in shuffledChinese"
          :key="'cn-' + item.id"
          class="match-item chinese"
          :class="{
            matched: matchedPairs.includes(item.id),
            selected: selectedChinese === item.id,
            wrong: wrongPair && selectedChinese === item.id
          }"
          @click="selectChinese(item.id)"
        >
          {{ item.emoji }} {{ item.chinese }}
        </div>
      </div>
    </div>

    <!-- 完成提示 -->
    <div class="result" v-if="isComplete">
      <div class="result-icon">🎉</div>
      <div class="result-text">全部配对成功！</div>
    </div>
  </div>
</template>

<style scoped>
.match-game { padding: 16px; }
.match-grid { display: flex; gap: 24px; justify-content: center; }
.match-column { flex: 1; max-width: 200px; }
.column-title { text-align: center; font-size: 16px; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; }
.match-item { padding: 16px; background: white; border: 3px solid #EEE; border-radius: 12px; text-align: center; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s; margin-bottom: 8px; }
.match-item:hover:not(.matched) { border-color: var(--color-english); transform: translateY(-2px); }
.match-item.selected { border-color: var(--color-english); background: #E8F4FF; }
.match-item.matched { border-color: var(--color-secondary); background: #E8FFE8; opacity: 0.7; cursor: default; }
.match-item.wrong { border-color: #FF6B6B; background: #FFF0F0; animation: shake 0.3s; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.result { text-align: center; margin-top: 24px; animation: bounce-in 0.5s; }
.result-icon { font-size: 48px; margin-bottom: 8px; }
.result-text { font-size: 20px; font-weight: 600; color: var(--color-secondary); }
@keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
