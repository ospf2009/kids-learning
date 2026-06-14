import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface GameState {
  currentSubject: string | null
  currentLesson: string | null
  currentItemIndex: number
  score: number
  totalQuestions: number
  correctAnswers: number
  isPlaying: boolean
  showReward: boolean
  combo: number
  maxCombo: number
}

export const useGameStore = defineStore('game', () => {
  const currentSubject = ref<string | null>(null)
  const currentLesson = ref<string | null>(null)
  const currentItemIndex = ref(0)
  const score = ref(0)
  const totalQuestions = ref(0)
  const correctAnswers = ref(0)
  const isPlaying = ref(false)
  const showReward = ref(false)
  const combo = ref(0)
  const maxCombo = ref(0)

  const accuracy = computed(() => {
    if (totalQuestions.value === 0) return 0
    return Math.round((correctAnswers.value / totalQuestions.value) * 100)
  })

  const comboBonus = computed(() => {
    if (combo.value >= 5) return 3
    if (combo.value >= 3) return 2
    return 1
  })

  function startGame(subject: string, lesson: string) {
    currentSubject.value = subject
    currentLesson.value = lesson
    currentItemIndex.value = 0
    score.value = 0
    totalQuestions.value = 0
    correctAnswers.value = 0
    isPlaying.value = true
    showReward.value = false
    combo.value = 0
    maxCombo.value = 0
  }

  function answerQuestion(correct: boolean) {
    totalQuestions.value++
    if (correct) {
      correctAnswers.value++
      combo.value++
      maxCombo.value = Math.max(maxCombo.value, combo.value)
      score.value += 10 * comboBonus.value
    } else {
      combo.value = 0
    }
  }

  function nextQuestion() {
    currentItemIndex.value++
  }

  function endGame() {
    isPlaying.value = false
    showReward.value = true
  }

  function resetGame() {
    currentSubject.value = null
    currentLesson.value = null
    currentItemIndex.value = 0
    score.value = 0
    totalQuestions.value = 0
    correctAnswers.value = 0
    isPlaying.value = false
    showReward.value = false
    combo.value = 0
    maxCombo.value = 0
  }

  return {
    currentSubject, currentLesson, currentItemIndex,
    score, totalQuestions, correctAnswers,
    isPlaying, showReward, combo, maxCombo,
    accuracy, comboBonus,
    startGame, answerQuestion, nextQuestion, endGame, resetGame,
  }
})
