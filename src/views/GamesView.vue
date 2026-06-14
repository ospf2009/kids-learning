<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import CatchStars from '@/components/game/CatchStars.vue'

const router = useRouter()
const currentGame = ref<string | null>(null)

function goBack() { router.push('/') }
function playGame(game: string) { currentGame.value = game }
function handleComplete(score: number) {
  // 游戏结束回调
}

const games = [
  { id: 'catch-stars', name: '接星星', icon: '🌟', desc: '接住星星避开炸弹', color: '#FF6B6B' },
  { id: 'coming-soon', name: '贪吃蛇', icon: '🐍', desc: '即将推出', color: '#4ECDC4' },
  { id: 'coming-soon-2', name: '打地鼠', icon: '🔨', desc: '即将推出', color: '#60A5FA' },
]
</script>

<template>
  <div class="games-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>🎮 游戏中心</h1>
    </header>

    <!-- 游戏列表 -->
    <div class="games-grid" v-if="!currentGame">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        :class="{ disabled: game.id === 'coming-soon' || game.id === 'coming-soon-2' }"
        :style="{ '--game-color': game.color }"
        @click="game.id !== 'coming-soon' && game.id !== 'coming-soon-2' ? playGame(game.id) : null"
      >
        <div class="game-icon">{{ game.icon }}</div>
        <div class="game-name">{{ game.name }}</div>
        <div class="game-desc">{{ game.desc }}</div>
      </div>
    </div>

    <!-- 接星星游戏 -->
    <div v-if="currentGame === 'catch-stars'" class="game-play">
      <button class="back-btn" @click="currentGame = null">← 返回游戏列表</button>
      <CatchStars :onComplete="handleComplete" />
    </div>
  </div>
</template>

<style scoped>
.games-view { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-xl); }
.back-btn { background: var(--bg-card); border: 2px solid #EEE; border-radius: var(--radius-full); padding: 8px 16px; font-family: var(--font-family); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-normal); }
.back-btn:hover { background: #FFF0F0; border-color: var(--color-primary); }
.page-header h1 { font-size: var(--font-size-2xl); }
.games-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); }
.game-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-lg); text-align: center; cursor: pointer; transition: all var(--transition-normal) var(--bounce); box-shadow: var(--shadow-sm); border: 3px solid transparent; }
.game-card:hover:not(.disabled) { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--game-color); }
.game-card.disabled { opacity: 0.5; cursor: not-allowed; }
.game-icon { font-size: 40px; margin-bottom: 8px; }
.game-name { font-size: var(--font-size-lg); font-weight: 700; margin-bottom: 4px; }
.game-desc { font-size: var(--font-size-xs); color: var(--text-secondary); }
.game-play { margin-top: var(--space-md); }
</style>
