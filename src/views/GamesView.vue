<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import CatchStars from '@/components/game/CatchStars.vue'

const router = useRouter()
const currentGame = ref<string | null>(null)

function goBack() { router.push('/') }
function playGame(game: string) { currentGame.value = game }
function handleComplete(score: number) {}

const games = [
  { id: 'catch-stars', name: '接星星', icon: '*', desc: '接住星星避开炸弹', color: '#E86363', bg: '#FFF5F5' },
  { id: 'coming-soon', name: '贪吃蛇', icon: 'S', desc: '即将推出', color: '#3BA99E', bg: '#F0FDF9' },
  { id: 'coming-soon-2', name: '打地鼠', icon: 'H', desc: '即将推出', color: '#3B82F6', bg: '#EFF6FF' },
]
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>游戏中心</h1>
    </div>

    <div v-if="!currentGame" class="game-grid">
      <div v-for="g in games" :key="g.id"
        class="game-card"
        :class="{ disabled: g.id.startsWith('coming-soon') }"
        :style="{ '--gc': g.color, '--gbg': g.bg }"
        @click="!g.id.startsWith('coming-soon') && playGame(g.id)">
        <div class="gc-icon" :style="{ background: g.bg, color: g.color }">{{ g.icon }}</div>
        <div class="gc-name">{{ g.name }}</div>
        <div class="gc-desc">{{ g.desc }}</div>
      </div>
    </div>

    <div v-if="currentGame === 'catch-stars'" class="game-play">
      <button class="back-btn" @click="currentGame = null" style="margin-bottom: 12px;">&larr; 返回</button>
      <CatchStars :onComplete="handleComplete" />
    </div>
  </div>
</template>

<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { font-size: var(--font-size-lg); }

.game-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.game-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-2);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.game-card:hover:not(.disabled) { border-color: var(--gc); box-shadow: 0 0 0 1px var(--gc); transform: translateY(-2px); }
.game-card.disabled { opacity: 0.45; cursor: default; }
.gc-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 6px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}
.gc-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); white-space: nowrap; }
.gc-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; }

.game-play { margin-top: var(--space-3); }
</style>
