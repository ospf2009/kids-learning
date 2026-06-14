<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mathLessons, type MathItem } from '@/data/math'
import { useUserStore } from '@/stores/user'
import { useGameStore } from '@/stores/game'
import TimedChallenge from '@/components/game/TimedChallenge.vue'
import DragCount from '@/components/game/DragCount.vue'
import ShapeGame from '@/components/game/ShapeGame.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const lessonId = route.params.lessonId as string
const lesson = computed(() => mathLessons.find(l => l.id === lessonId))

const currentIndex = ref(0)
const selectedItem = ref<string | number | null>(null)
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)

const currentItem = computed<MathItem | null>(() => {
  if (!lesson.value) return null
  return lesson.value.items[currentIndex.value] || null
})

const progress = computed(() => {
  if (!lesson.value) return 0
  return Math.round((currentIndex.value / lesson.value.items.length) * 100)
})

onMounted(() => {
  if (!lesson.value) { router.push('/math'); return }
  gameStore.startGame('math', lessonId)
})

function selectAnswer(option: string | number) {
  if (showResult.value) return
  selectedItem.value = option
  isCorrect.value = String(option) === String(currentItem.value?.answer)
  showResult.value = true
  gameStore.answerQuestion(isCorrect.value)
  userStore.completeQuestion('math', isCorrect.value)
}

function nextQuestion() {
  if (!lesson.value) return
  if (currentIndex.value < lesson.value.items.length - 1) {
    currentIndex.value++
    selectedItem.value = null
    showResult.value = false
    gameStore.nextQuestion()
  } else {
    userStore.completeLesson('math', lessonId)
    showCompletion.value = true
    gameStore.endGame()
  }
}

function handleTimedComplete(score: number, correct: number, total: number) {
  gameStore.correctAnswers = correct
  gameStore.totalQuestions = total
  gameStore.score = score
  userStore.completeLesson('math', lessonId)
  showCompletion.value = true
  gameStore.endGame()
}

function handleDragComplete(correct: boolean) {
  isCorrect.value = correct
  showResult.value = true
  gameStore.answerQuestion(correct)
  userStore.completeQuestion('math', correct)
}

function handleShapeComplete(correct: boolean) {
  isCorrect.value = correct
  showResult.value = true
  gameStore.answerQuestion(correct)
  userStore.completeQuestion('math', correct)
}

function goBack() { router.push('/math') }
function retryLesson() {
  currentIndex.value = 0
  selectedItem.value = null
  showResult.value = false
  showCompletion.value = false
  gameStore.startGame('math', lessonId)
}
</script>

<template>
  <div class="math-lesson">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>{{ lesson?.icon }} {{ lesson?.title }}</h1>
    </header>

    <!-- 限时挑战模式没有进度条 -->
    <div class="progress-section" v-if="lesson?.gameMode !== 'timed'">
      <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
      <span class="progress-text">{{ currentIndex + 1 }}/{{ lesson?.items.length }}</span>
    </div>

    <div class="combo" v-if="gameStore.combo >= 2 && lesson?.gameMode !== 'timed'">🔥 {{ gameStore.combo }} 连击！</div>

    <!-- 选择题模式 -->
    <div class="question-area" v-if="lesson?.gameMode === 'choice' && currentItem && !showCompletion">
      <div class="question-card">
        <div class="question-hint" v-if="currentItem.hint">💡 {{ currentItem.hint }}</div>
        <h2 class="question-text">{{ currentItem.question }}</h2>
      </div>
      <div class="options-grid">
        <button
          v-for="option in currentItem.options"
          :key="String(option)"
          class="option-btn"
          :class="{
            selected: selectedItem === option,
            correct: showResult && String(option) === String(currentItem.answer),
            wrong: showResult && selectedItem === option && String(option) !== String(currentItem.answer)
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

    <!-- 限时挑战模式 -->
    <TimedChallenge
      v-if="lesson?.gameMode === 'timed' && !showCompletion"
      :items="lesson.items"
      :onComplete="handleTimedComplete"
    />

    <!-- 拖拽数数模式 -->
    <div v-if="lesson?.gameMode === 'drag' && currentItem && !showCompletion">
      <DragCount
        :question="currentItem.question"
        :correctAnswer="Number(currentItem.answer)"
        :dragItems="currentItem.dragItems || []"
        :hint="currentItem.hint"
        :onComplete="handleDragComplete"
      />
      <div class="next-section" v-if="showResult">
        <button class="btn btn-primary" @click="nextQuestion">
          {{ currentIndex < (lesson?.items.length || 0) - 1 ? '下一题 →' : '查看成绩 🏆' }}
        </button>
      </div>
    </div>

    <!-- 图形认知模式 -->
    <div v-if="lesson?.gameMode === 'shape' && currentItem && !showCompletion">
      <ShapeGame
        :question="currentItem.question"
        :correctAnswer="String(currentItem.answer)"
        :options="currentItem.options?.map(String) || []"
        :shapeType="currentItem.shapeType || ''"
        :hint="currentItem.hint"
        :onComplete="handleShapeComplete"
      />
      <div class="next-section" v-if="showResult">
        <button class="btn btn-primary" @click="nextQuestion">
          {{ currentIndex < (lesson?.items.length || 0) - 1 ? '下一题 →' : '查看成绩 🏆' }}
        </button>
      </div>
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
          <button class="btn btn-primary" @click="goBack">返回列表 🔢</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.math-lesson { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); }
.back-btn { background: var(--bg-card); border: 2px solid #EEE; border-radius: var(--radius-full); padding: 8px 16px; font-family: var(--font-family); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-normal); }
.back-btn:hover { background: #E8FFF8; border-color: var(--color-math); }
.page-header h1 { font-size: var(--font-size-xl); color: var(--color-math); }
.progress-section { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); }
.progress-bar { flex: 1; height: 12px; background: #F0F0F0; border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--color-math), #6EDDD6); border-radius: var(--radius-full); transition: width 0.5s var(--bounce); }
.progress-text { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600; }
.combo { text-align: center; padding: 8px; background: linear-gradient(135deg, var(--color-math), #6EDDD6); color: white; border-radius: var(--radius-full); font-weight: 700; margin-bottom: var(--space-md); animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.question-area { margin-bottom: var(--space-lg); }
.question-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--space-xl); box-shadow: var(--shadow-md); margin-bottom: var(--space-lg); text-align: center; }
.question-hint { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-md); padding: 8px 16px; background: #FFF9E6; border-radius: var(--radius-full); display: inline-block; }
.question-text { font-size: var(--font-size-2xl); color: var(--text-primary); line-height: 1.4; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.option-btn { background: var(--bg-card); border: 3px solid #EEE; border-radius: var(--radius-lg); padding: var(--space-lg); font-family: var(--font-family); font-size: var(--font-size-xl); font-weight: 600; cursor: pointer; transition: all var(--transition-normal) var(--bounce); box-shadow: var(--shadow-sm); }
.option-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--color-math); }
.option-btn.selected { border-color: var(--color-math); background: #E8FFF8; }
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
.stat-item { flex: 1; background: #E8FFF8; border-radius: var(--radius-md); padding: var(--space-md); }
.stat-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-math); }
.stat-value.correct { color: var(--color-secondary); }
.stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); }
.stars-earned { font-size: var(--font-size-lg); color: var(--color-accent); font-weight: 700; margin-bottom: var(--space-xl); padding: var(--space-md); background: linear-gradient(135deg, #FFF9E6, #FFF3CC); border-radius: var(--radius-full); }
.completion-actions { display: flex; gap: var(--space-md); justify-content: center; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>
