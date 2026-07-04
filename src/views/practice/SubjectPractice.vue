<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { getChapters, type GradeId, type Subject } from '@/data/chapters'
import { getGradeName } from '@/data/grades'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const subject = computed<Subject>(() => {
  const s = route.params.subject as string
  if (['chinese', 'math', 'english'].includes(s)) return s as Subject
  return 'chinese'
})

const subjectMeta: Record<Subject, { name: string; icon: string; color: string; bg: string; desc: string }> = {
  chinese: { name: '语文', icon: '书', color: 'var(--color-chinese)', bg: 'var(--color-chinese-bg)', desc: '字词句段，循序渐进' },
  math: { name: '数学', icon: '数', color: 'var(--color-math)', bg: 'var(--color-math-bg)', desc: '数与运算，寓教于乐' },
  english: { name: '英语', icon: '英', color: 'var(--color-english)', bg: 'var(--color-english-bg)', desc: '字母单词，轻松入门' },
}

const meta = computed(() => subjectMeta[subject.value])
const userGrade = computed<GradeId>(() => (authStore.grade || 'grade1-down') as GradeId)
const chapters = computed(() => getChapters(userGrade.value, subject.value))

function goChapter(chapterId: string) { router.push(`/practice/${subject.value}/${chapterId}`) }
function goBack() { router.push('/') }
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>{{ meta.icon }} {{ meta.name }}</h1>
      <span class="grade-badge">{{ getGradeName(userGrade) }}</span>
    </div>

    <!-- 科目简介 -->
    <div class="subject-hero" :style="{ background: meta.bg }">
      <div class="hero-icon" :style="{ color: meta.color }">{{ meta.icon }}</div>
      <div>
        <div class="hero-title">{{ meta.name }}练习</div>
        <div class="hero-desc">{{ meta.desc }}</div>
      </div>
    </div>

    <!-- 章节列表 -->
    <div class="chapter-list" v-if="chapters.length > 0">
      <div v-for="ch in chapters" :key="ch.id" class="chapter-card" @click="goChapter(ch.id)">
        <div class="cc-icon" :style="{ background: meta.bg, color: meta.color }">{{ ch.icon }}</div>
        <div class="cc-body">
          <div class="cc-title">{{ ch.title }}</div>
          <div class="cc-desc">{{ ch.description }}</div>
          <div class="cc-count">{{ ch.questions.length }} 题</div>
        </div>
        <div class="cc-arrow">&rarr;</div>
      </div>
    </div>

    <div v-else class="empty">
      <div class="empty-icon">&#x1F4ED;</div>
      <p>该年级暂无{{ meta.name }}题库</p>
      <p class="empty-hint">可切换到其他年级</p>
    </div>
  </div>
</template>

<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { font-size: var(--font-size-lg); display: flex; align-items: center; gap: 6px; }
.grade-badge {
  font-size: var(--font-size-xs);
  background: var(--bg-input);
  color: var(--text-secondary);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 科目简介 */
.subject-hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  border: 1px solid var(--border-color);
}
.hero-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}
.hero-title { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.hero-desc { font-size: var(--font-size-sm); color: var(--text-secondary); }

/* 章节列表 */
.chapter-list { display: flex; flex-direction: column; gap: 10px; }
.chapter-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.2s ease;
}
.chapter-card:hover {
  border-color: #D1D5DB;
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}
.cc-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.cc-body { flex: 1; min-width: 0; }
.cc-title { font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.cc-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: 4px; }
.cc-count { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.cc-arrow { font-size: 16px; color: var(--text-tertiary); transition: transform 0.2s; }
.chapter-card:hover .cc-arrow { transform: translateX(4px); color: var(--text-primary); }

.empty { text-align: center; padding: var(--space-12) 0; }
.empty-icon { font-size: 48px; margin-bottom: var(--space-3); }
.empty p { color: var(--text-secondary); }
.empty-hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: var(--space-2); }
</style>
