<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { getChapters, type GradeId, type Subject } from '@/data/chapters'
import { playVictorySound, playCorrectSound, playWrongSound } from '@/utils/sound'
import { wrongDB } from '@/db'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()
const userGrade = computed(() => (authStore.grade || 'grade1-down') as GradeId)

const questions = ref<any[]>([])
const currentIndex = ref(0)
const selectedAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showCompletion = ref(false)
const correctCount = ref(0)

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getFillOptions(answer: string): string[] {
  // 根据答案类型选择干扰项池
  function guessPool(ans: string): string[] {
    if (/^\d+$/.test(ans)) {
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
              '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
    }
    if (/^[\u4e00-\u9fff]+$/.test(ans)) {
      return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
              '上', '下', '左', '右', '大', '小', '多', '少',
              '天', '地', '人', '口', '手', '足', '日', '月', '水', '火',
              '木', '金', '土', '山', '石', '田', '飞', '虫', '鸟',
              '春', '夏', '秋', '冬', '风', '雪', '花', '草', '果', '叶',
              '米', '厘', '元', '角', '分',
              '对', '错', '出', '入', '来', '去',
              '晴', '清', '请', '睛', '保', '护',
              '我', '你', '他', '她', '它', '们',
              '东', '西', '南', '北', '前', '后']
    }
    if (/^[a-zA-Z]+$/.test(ans)) {
      return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
              'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
              'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
              'Good', 'Hello', 'my', 'Thank']
    }
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
            'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  }

  const pool = guessPool(answer)
  const opts = new Set<string>()
  opts.add(answer)

  const noise = pool.filter(p => p !== answer)
  const shuffled = shuffleArray(noise)
  const needed = Math.min(5, Math.max(3, 6 - opts.size))

  for (let i = 0; i < needed && i < shuffled.length; i++) {
    opts.add(shuffled[i]!)
  }

  return shuffleArray(Array.from(opts))
}

function generateDailyChallenge() {
  correctCount.value = 0
  currentIndex.value = 0
  selectedAnswer.value = ''
  showResult.value = false
  showCompletion.value = false

  const grade = (authStore.grade || 'grade1-down') as GradeId
  const subjects: Subject[] = ['chinese', 'math', 'english']
  const picked: any[] = []

  for (const subject of subjects) {
    const chapters = getChapters(grade, subject)
    for (const ch of chapters) {
      for (const q of ch.questions) {
        picked.push({ ...q, subject, chapterTitle: ch.title })
      }
    }
  }

  // 随机打乱并取10题（涵盖3科）
  const shuffled = shuffleArray(picked)
  questions.value = shuffled.slice(0, 10)
}

// 初始化
generateDailyChallenge()

const currentQuestion = computed(() => questions.value[currentIndex.value])

const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((currentIndex.value / questions.value.length) * 100)
})

function selectAnswer(answer: string) {
  if (showResult.value) return
  selectedAnswer.value = answer
  const q = currentQuestion.value
  isCorrect.value = answer === q?.answer
  showResult.value = true
  if (isCorrect.value) {
    correctCount.value++
    playCorrectSound()
  } else {
    playWrongSound()
  }

  // 记录答题数据（不阻塞流程）
  if (authStore.currentUser && q) {
    progressStore.recordAnswer(
      authStore.currentUser.id,
      q.subject || 'chinese',
      userGrade.value,
      'daily-challenge',
      q.id,
      q.question,
      answer,
      q.answer,
      q.options || [],
      isCorrect.value
    ).then(() => {
      // 答对时自动从错题本移除
      if (isCorrect.value && authStore.currentUser) {
        wrongDB.getByUserChapter(authStore.currentUser.id, 'daily-challenge').then(wrongs => {
          const matched = wrongs.find(w => w.questionId === q.id)
          if (matched) wrongDB.remove(matched.id)
        }).catch(() => {})
      }
    }).catch(e => console.error('[DailyChallenge] recordAnswer:', e))
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    selectedAnswer.value = ''
    showResult.value = false
  } else {
    showCompletion.value = true
    playVictorySound()
  }
}

function goBack() { router.push('/') }
</script>

<template>
  <div class="challenge-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>每日挑战</h1>
      <button class="refresh-btn" @click="generateDailyChallenge" title="换一批题">换题</button>
    </header>

    <div class="challenge-info" v-if="!showCompletion">
      <div class="info-card">
        <div class="info-icon">每日挑战</div>
        <div class="info-text">
          <div class="info-title">{{ questions.length }}道精选混合题</div>
          <div class="info-desc">包含语文、数学、英语三科</div>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>
    </div>

    <div class="question-area" v-if="currentQuestion && !showCompletion">
      <div class="question-card">
        <div class="question-tag">
          {{ currentQuestion.subject === 'chinese' ? '语文' : currentQuestion.subject === 'math' ? '数学' : '英语' }}
          . {{ currentQuestion.chapterTitle }}
        </div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>
      </div>

      <div class="options-grid" v-if="currentQuestion.type === 'choice'">
        <button
          v-for="opt in currentQuestion.options"
          :key="opt"
          class="option-btn"
          :class="{
            selected: selectedAnswer === opt,
            correct: showResult && opt === currentQuestion.answer,
            wrong: showResult && selectedAnswer === opt && opt !== currentQuestion.answer
          }"
          @click="selectAnswer(opt)"
          :disabled="showResult"
        >{{ opt }}</button>
      </div>

      <div class="options-grid options-grid-2" v-if="currentQuestion.type === 'judge'">
        <button
          v-for="opt in ['对', '错']"
          :key="opt"
          class="option-btn"
          :class="{
            selected: selectedAnswer === opt,
            correct: showResult && opt === currentQuestion.answer,
            wrong: showResult && selectedAnswer === opt && opt !== currentQuestion.answer
          }"
          @click="selectAnswer(opt)"
          :disabled="showResult"
        >{{ opt === '对' ? '✓ 对' : '✗ 错' }}</button>
      </div>

      <div v-if="currentQuestion.type === 'fill'" class="fill-area">
        <div class="fill-options">
          <button
            v-for="opt in getFillOptions(currentQuestion.answer)"
            :key="opt"
            class="option-btn"
            :class="{
              selected: selectedAnswer === opt,
              correct: showResult && opt === currentQuestion.answer,
              wrong: showResult && selectedAnswer === opt && opt !== currentQuestion.answer
            }"
            @click="selectAnswer(opt)"
            :disabled="showResult"
          >{{ opt }}</button>
        </div>
      </div>

      <div class="result-feedback" v-if="showResult">
        <div class="feedback-icon" v-if="isCorrect">🎉</div>
        <div class="feedback-icon" v-else>💪</div>
        <div class="feedback-text">
          {{ isCorrect ? '答对啦！' : '正确答案是「' + currentQuestion?.answer + '」' }}
        </div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < questions.length - 1 ? '下一题 →' : '查看成绩 🏆' }}
        </button>
      </div>
    </div>

    <div class="completion" v-if="showCompletion">
      <div class="completion-card">
        <div class="trophy">🏆</div>
        <h2>每日挑战完成！</h2>
        <div class="stats">
          <div class="stat-item"><div class="stat-value">{{ questions.length }}</div><div class="stat-label">总题数</div></div>
          <div class="stat-item"><div class="stat-value correct">{{ correctCount }}</div><div class="stat-label">答对</div></div>
          <div class="stat-item"><div class="stat-value">{{ questions.length ? Math.round(correctCount / questions.length * 100) : 0 }}%</div><div class="stat-label">正确率</div></div>
        </div>
        <div class="completion-actions">
          <button class="btn-action btn-primary" @click="generateDailyChallenge">再来一次</button>
          <button class="btn-action btn-secondary" @click="goBack">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.challenge-page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header { margin-bottom: var(--space-4); }
.page-header h1 { flex: 1; font-size: var(--font-size-lg); }
.refresh-btn {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  cursor: pointer;
  font-family: inherit;
  color: var(--text-tertiary);
  transition: all 0.2s;
}
.refresh-btn:hover { border-color: #F59E0B; color: var(--text-primary); }

.challenge-info { margin-bottom: var(--space-4); }
.info-card { display: flex; align-items: center; gap: var(--space-3); background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-3); }
.info-icon { font-size: 14px; font-weight: 700; color: #D97706; }
.info-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--text-primary); }
.info-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.progress-section { display: flex; align-items: center; gap: var(--space-3); }
.progress-bar { flex: 1; height: 6px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, #F59E0B, var(--color-primary)); border-radius: var(--radius-full); transition: width 0.3s; }
.progress-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 600; min-width: 50px; text-align: right; }

.question-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-4); text-align: center; }
.question-tag { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-3); }
.question-text { font-size: var(--font-size-xl); color: var(--text-primary); line-height: 1.5; font-weight: 500; }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.options-grid-2 { grid-template-columns: 1fr 1fr; max-width: 300px; margin: 0 auto; }
.option-btn {
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px;
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}
.option-btn:hover:not(:disabled) { border-color: #F59E0B; box-shadow: var(--shadow-md); transform: translateY(-1px); }
.option-btn.selected { border-color: #F59E0B; background: #FFFBEB; }
.option-btn.correct { border-color: var(--color-success); background: #F0FDF4; animation: popIn 0.3s; }
.option-btn.wrong { border-color: var(--color-danger); background: #FEF2F2; }

.fill-area { text-align: center; }
.fill-options { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

.result-feedback { text-align: center; margin-top: var(--space-5); animation: popIn 0.3s; }
.feedback-icon { font-size: 48px; margin-bottom: var(--space-2); }
.feedback-text { font-size: var(--font-size-md); color: var(--text-primary); margin-bottom: var(--space-4); }
.next-btn {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  min-width: 160px;
  transition: all 0.2s;
}
.next-btn:hover { background: var(--color-primary-light); box-shadow: var(--shadow-primary); }

.completion-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-8) var(--space-5); text-align: center; box-shadow: var(--shadow-md); animation: popIn 0.4s; }
.trophy { font-size: 56px; margin-bottom: var(--space-3); }
.completion-card h2 { font-size: var(--font-size-xl); margin-bottom: var(--space-4); }
.stats { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); }
.stat-item { flex: 1; background: var(--bg-main); border-radius: var(--radius-md); padding: var(--space-3); }
.stat-value { font-size: var(--font-size-xl); font-weight: 800; color: #F59E0B; }
.stat-value.correct { color: var(--color-success); }
.stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; }
.completion-actions { display: flex; gap: var(--space-3); justify-content: center; }
.btn-action { padding: 10px 20px; border: none; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-light); box-shadow: var(--shadow-primary); }
.btn-secondary { background: var(--bg-input); color: var(--text-primary); }
.btn-secondary:hover { background: #E5E7EB; }
</style>
