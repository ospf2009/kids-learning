<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chineseLessons, type ChineseItem } from '@/data/chinese'
import { useUserStore } from '@/stores/user'
import { useGameStore } from '@/stores/game'
import BubbleGame from '@/components/game/BubbleGame.vue'
import StrokeOrder from '@/components/game/StrokeOrder.vue'
import PoemDisplay from '@/components/game/PoemDisplay.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const lessonId = route.params.lessonId as string
const lesson = computed(() => chineseLessons.find(l => l.id === lessonId))

const currentIndex = ref(0)
const selectedItem = ref<string | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)

const currentItem = computed<ChineseItem | null>(() => {
  if (!lesson.value) return null
  return lesson.value.items[currentIndex.value] || null
})

const progress = computed(() => {
  if (!lesson.value) return 0
  return Math.round((currentIndex.value / lesson.value.items.length) * 100)
})

onMounted(() => {
  if (!lesson.value) { router.push('/chinese'); return }
  gameStore.startGame('chinese', lessonId)
})

function selectAnswer(option: string) {
  if (showResult.value) return
  selectedItem.value = option
  isCorrect.value = option === currentItem.value?.answer
  showResult.value = true
  gameStore.answerQuestion(isCorrect.value)
  userStore.completeQuestion('chinese', isCorrect.value)
}

function nextQuestion() {
  if (!lesson.value) return
  if (currentIndex.value < lesson.value.items.length - 1) {
    currentIndex.value++
    selectedItem.value = null
    showResult.value = false
    gameStore.nextQuestion()
  } else {
    userStore.completeLesson('chinese', lessonId)
    showCompletion.value = true
    gameStore.endGame()
  }
}

function handleBubbleComplete(correct: boolean) {
  isCorrect.value = correct
  showResult.value = true
  gameStore.answerQuestion(correct)
  userStore.completeQuestion('chinese', correct)
}

function handleStrokeComplete(correct: boolean) {
  isCorrect.value = correct
  showResult.value = true
  gameStore.answerQuestion(correct)
  userStore.completeQuestion('chinese', correct)
}

function handlePoemComplete(correct: boolean) {
  isCorrect.value = correct
  showResult.value = true
  gameStore.answerQuestion(correct)
  userStore.completeQuestion('chinese', correct)
}

function goBack() { router.push('/chinese') }
function retryLesson() {
  currentIndex.value = 0
  selectedItem.value = null
  showResult.value = false
  showCompletion.value = false
  gameStore.startGame('chinese', lessonId)
}
</script>

<template>
  <div class="chinese-lesson">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>{{ lesson?.icon }} {{ lesson?.title }}</h1>
    </header>

    <div class="progress-section">
      <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
      <span class="progress-text">{{ currentIndex + 1 }}/{{ lesson?.items.length }}</span>
    </div>

    <div class="combo" v-if="gameStore.combo >= 2">🔥 {{ gameStore.combo }} 连击！</div>

    <!-- 选择题模式 -->
    <div class="question-area" v-if="lesson?.gameMode === 'choice' && currentItem && !showCompletion">
      <div class="question-card">
        <div class="question-hint" v-if="currentItem.hint">💡 {{ currentItem.hint }}</div>
        <h2 class="question-text">{{ currentItem.content }}</h2>
      </div>
      <div class="options-grid">
        <button
          v-for="option in currentItem.options"
          :key="option"
          class="option-btn"
          :class="{
            selected: selectedItem === option,
            correct: showResult && option === currentItem.answer,
            wrong: showResult && selectedItem === option && option !== currentItem.answer
          }"
          @click="selectAnswer(option)"
          :disabled="showResult"
        >
          {{ option }}
        </button>
      </div>
      <div class="result-feedback" v-if="showResult">
        <div class="feedback-icon">{{ isCorrect ? '🎉' : '😊' }}</div>
        <div class="feedback-text">
          {{ isCorrect ? '太棒了！答对啦！' : '加油哦！正确答案是 ' + currentItem?.answer }}
        </div>
        <button class="btn btn-primary next-btn" @click="nextQuestion">
          {{ currentIndex < (lesson?.items.length || 0) - 1 ? '下一题 →' : '查看成绩 🏆' }}
        </button>
      </div>
    </div>

    <!-- 泡泡龙模式 -->
    <BubbleGame
      v-if="lesson?.gameMode === 'bubble' && currentItem && !showCompletion"
      :question="currentItem.content"
      :correctAnswer="currentItem.answer"
      :options="currentItem.options || []"
      :hint="currentItem.hint"
      :onComplete="handleBubbleComplete"
    />
    <div class="next-section" v-if="lesson?.gameMode === 'bubble' && showResult">
      <button class="btn btn-primary" @click="nextQuestion">
        {{ currentIndex < (lesson?.items.length || 0) - 1 ? '下一题 →' : '查看成绩 🏆' }}
      </button>
    </div>

    <!-- 笔顺模式 -->
    <StrokeOrder
      v-if="lesson?.gameMode === 'stroke' && currentItem && !showCompletion"
      :character="currentItem.content"
      :strokes="currentItem.strokes || []"
      :hint="currentItem.hint"
      :onComplete="handleStrokeComplete"
    />
    <div class="next-section" v-if="lesson?.gameMode === 'stroke' && showResult">
      <button class="btn btn-primary" @click="nextQuestion">
        {{ currentIndex < (lesson?.items.length || 0) - 1 ? '下一题 →' : '查看成绩 🏆' }}
      </button>
    </div>

    <!-- 古诗模式 -->
    <PoemDisplay
      v-if="lesson?.gameMode === 'poem' && currentItem && !showCompletion"
      :title="currentItem.content"
      :lines="currentItem.poemLines || []"
      :author="currentItem.answer"
      :options="currentItem.options || []"
      :correctAnswer="currentItem.answer"
      :hint="currentItem.hint"
      :onComplete="handlePoemComplete"
    />
    <div class="next-section" v-if="lesson?.gameMode === 'poem' && showResult">
      <button class="btn btn-primary" @click="nextQuestion">
        {{ currentIndex < (lesson?.items.length || 0) - 1 ? '下一题 →' : '查看成绩 🏆' }}
      </button>
    </div>

    <!-- 完成页面 -->
    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">🏆</div>
        <h2>练习完成！</h2>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ gameStore.totalQuestions }}</div><div class="stat-label">总题数</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ gameStore.correctAnswers }}</div><div class="stat-label">答对</div></div>
          <div class="stat-item"><div class="stat-value">{{ gameStore.accuracy }}%</div><div class="stat-label">正确率</div></div>
        </div>
        <div class="stars-earned">获得 ⭐ {{ gameStore.correctAnswers * 2 + (gameStore.totalQuestions - gameStore.correctAnswers) }} 颗星星</div>
        <div class="completion-actions">
          <button class="btn btn-secondary" @click="retryLesson">再来一次 🔄</button>
          <button class="btn btn-primary" @click="goBack">返回列表 📖</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chinese-lesson { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); }
.back-btn { background: var(--bg-card); border: 2px solid #EEE; border-radius: var(--radius-full); padding: 8px 16px; font-family: var(--font-family); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-normal); }
.back-btn:hover { background: #FFF0F0; border-color: var(--color-chinese); }
.page-header h1 { font-size: var(--font-size-xl); color: var(--color-chinese); }
.progress-section { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); }
.progress-bar { flex: 1; height: 12px; background: #F0F0F0; border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--color-chinese), #FF8E8E); border-radius: var(--radius-full); transition: width 0.5s var(--bounce); }
.progress-text { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600; }
.combo { text-align: center; padding: 8px; background: linear-gradient(135deg, #FF6B6B, #FF8E8E); color: white; border-radius: var(--radius-full); font-weight: 700; margin-bottom: var(--space-md); animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.question-area { margin-bottom: var(--space-lg); }
.question-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--space-xl); box-shadow: var(--shadow-md); margin-bottom: var(--space-lg); text-align: center; }
.question-hint { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-md); padding: 8px 16px; background: #FFF9E6; border-radius: var(--radius-full); display: inline-block; }
.question-text { font-size: var(--font-size-2xl); color: var(--text-primary); line-height: 1.4; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.option-btn { background: var(--bg-card); border: 3px solid #EEE; border-radius: var(--radius-lg); padding: var(--space-lg); font-family: var(--font-family); font-size: var(--font-size-xl); font-weight: 600; cursor: pointer; transition: all var(--transition-normal) var(--bounce); box-shadow: var(--shadow-sm); }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--color-chinese); }
.option-btn.selected { border-color: var(--color-chinese); background: #FFF5F5; }
.option-btn.correct { border-color: var(--color-secondary); background: linear-gradient(135deg, #E8FFE8, #F0FFF0); animation: pop 0.5s var(--bounce); }
.option-btn.wrong { border-color: #FF6B6B; background: #FFF0F0; animation: shake 0.5s; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
.result-feedback { text-align: center; margin-top: var(--space-xl); animation: bounce-in 0.5s var(--bounce); }
.feedback-icon { font-size: 64px; margin-bottom: var(--space-md); }
.feedback-text { font-size: var(--font-size-lg); color: var(--text-primary); margin-bottom: var(--space-lg); }
.next-btn { min-width: 200px; }
.next-section { text-align: center; margin-top: 24px; }
.completion { animation: bounce-in 0.6s var(--bounce); }
.completion-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--space-2xl); text-align: center; box-shadow: var(--shadow-lg); }
.trophy { font-size: 80px; margin-bottom: var(--space-md); animation: float 2s ease-in-out infinite; }
.completion-card h2 { font-size: var(--font-size-2xl); color: var(--text-primary); margin-bottom: var(--space-xl); }
.stats { display: flex; gap: var(--space-lg); margin-bottom: var(--space-xl); }
.stat-item { flex: 1; background: #FFF5F5; border-radius: var(--radius-md); padding: var(--space-md); }
.stat-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-chinese); }
.stat-value.correct { color: var(--color-secondary); }
.stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); }
.stars-earned { font-size: var(--font-size-lg); color: var(--color-accent); font-weight: 700; margin-bottom: var(--space-xl); padding: var(--space-md); background: linear-gradient(135deg, #FFF9E6, #FFF3CC); border-radius: var(--radius-full); }
.completion-actions { display: flex; gap: var(--space-md); justify-content: center; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>
