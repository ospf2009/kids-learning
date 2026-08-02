<script setup lang="ts">
/**
 * CatchStars.vue —— 接星星（Leafer 版）
 * 用 Leafer 的 Rect/Star/Polygon 替代原 Canvas 2D 手绘，
 * Leafer 自动管理渲染循环，只需更新节点属性即可。
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { Leafer, Rect, Star, Polygon, Group, Text } from 'leafer-ui'
import { playStarSound, playBombSound, playVictorySound } from '@/utils/sound'

const props = defineProps<{
  onComplete: (score: number) => void
}>()

const container = ref<HTMLDivElement | null>(null)
const score = ref(0)
const lives = ref(3)
const isPlaying = ref(false)
const isGameOver = ref(false)

const gameWidth = 360
const gameHeight = 500
const playerWidth = 70
const playerHeight = 22
const itemSize = 22

const playerX = ref(gameWidth / 2 - playerWidth / 2)
const stars: Array<{ node: any; y: number; speed: number }> = []
const bombs: Array<{ node: any; y: number; speed: number }> = []

let leafer: any = null
let bgNode: any = null
let playerNode: any = null
let scoreText: any = null
let starTimer: ReturnType<typeof setInterval> | null = null
let bombTimer: ReturnType<typeof setInterval> | null = null
let loopTimer: ReturnType<typeof setInterval> | null = null
let startTime = 0

function buildStar(x: number, y: number): any {
  // 用固定 width/height 锁定尺寸，x/y 即包围盒左上角，避免半径推导导致星星过大
  const s = new Star({
    x, y,
    width: itemSize,
    height: itemSize,
    innerRadius: itemSize * 0.4,
    outerRadius: itemSize * 0.48,
    points: 5,
    fill: '#FFD93D',
    stroke: '#F4C430',
    strokeWidth: 1,
  } as any)
  return s
}

function buildBomb(x: number, y: number): any {
  const g = new Group({ x, y, width: itemSize, height: itemSize } as any)
  const body = new Polygon({
    width: itemSize, height: itemSize,
    sides: 0, points: '0,6 10,0 20,6 16,22 4,22',
    fill: '#333',
  } as any)
  g.add(body as any)
  return g
}

function buildPlayer(x: number): any {
  return new Rect({
    x,
    y: gameHeight - playerHeight - 10,
    width: playerWidth,
    height: playerHeight,
    cornerRadius: 8,
    fill: { type: 'linear', stops: [{ offset: 0, color: '#FF6B6B' }, { offset: 1, color: '#FFD93D' }] } as any,
    stroke: '#fff',
    strokeWidth: 1,
  } as any)
}

function buildBackground(): any {
  return new Rect({
    width: gameWidth,
    height: gameHeight,
    fill: { type: 'linear', stops: [{ offset: 0, color: '#1a1a2e' }, { offset: 1, color: '#16213e' }] } as any,
  } as any)
}

function buildScoreText(): any {
  return new Rect({
    x: 10, y: 10, width: gameWidth - 20, height: 24,
    fill: 'transparent',
  } as any)
}

function makeLabel(text: string, color = '#fff', size = 16): any {
  return new Text({
    x: 12, y: 12, text, fontSize: size, fill: color, fontFamily: 'Arial',
  } as any)
}

function startGame() {
  if (!leafer) return
  // 清空旧节点：移除除背景外的所有动态节点
  ;[...leafer.children].forEach((c: any) => { if (c !== bgNode) c.remove() })
  stars.length = 0
  bombs.length = 0
  score.value = 0
  lives.value = 3
  playerX.value = gameWidth / 2 - playerWidth / 2
  isPlaying.value = true
  isGameOver.value = false
  startTime = Date.now()

  playerNode = buildPlayer(playerX.value)
  playerNode.tag = 'player'
  leafer.add(playerNode as any)
  scoreText = makeLabel('⭐ 0')
  scoreText.tag = 'score'
  leafer.add(scoreText as any)
  updateScoreLabel()

  starTimer = setInterval(() => {
    if (!isPlaying.value) return
    const elapsed = (Date.now() - startTime) / 1000
    const speedBoost = 1 + Math.floor(elapsed / 15) * 0.5
    const x = Math.random() * (gameWidth - itemSize * 2) + itemSize
    const node = buildStar(x, -itemSize)
    node.tag = 'star'
    leafer.add(node as any)
    stars.push({ node, y: -itemSize, speed: (1.5 + Math.random() * 1.5) * speedBoost })
  }, 1200)

  bombTimer = setInterval(() => {
    if (!isPlaying.value) return
    const elapsed = (Date.now() - startTime) / 1000
    const speedBoost = 1 + Math.floor(elapsed / 15) * 0.5
    const x = Math.random() * (gameWidth - itemSize * 2) + itemSize
    const node = buildBomb(x, -itemSize)
    node.tag = 'bomb'
    leafer.add(node as any)
    bombs.push({ node, y: -itemSize, speed: (2 + Math.random() * 1) * speedBoost })
  }, 2500)

  loopTimer = setInterval(gameLoop, 16)
}

function gameLoop() {
  if (!isPlaying.value || !leafer) return
  const playerTop = gameHeight - playerHeight - 10

  // 移动星星（node.x/node.y 为包围盒左上角，尺寸 itemSize）
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i]
    s.y += s.speed
    s.node.y = s.y
    if (s.y > gameHeight) {
      s.node.remove(); stars.splice(i, 1); continue
    }
    // 接住判定：星星底边进入接盘区，且水平重叠
    if (
      s.y + itemSize >= playerTop &&
      s.y <= gameHeight - 10 &&
      s.node.x + itemSize >= playerX.value &&
      s.node.x <= playerX.value + playerWidth
    ) {
      s.node.remove(); stars.splice(i, 1)
      score.value += 10
      playStarSound()
      updateScoreLabel()
    }
  }

  // 移动炸弹
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]
    b.y += b.speed
    b.node.y = b.y
    if (b.y > gameHeight) {
      b.node.remove(); bombs.splice(i, 1); continue
    }
    if (
      b.y + itemSize >= playerTop &&
      b.y <= gameHeight - 10 &&
      b.node.x + itemSize >= playerX.value &&
      b.node.x <= playerX.value + playerWidth
    ) {
      b.node.remove(); bombs.splice(i, 1)
      lives.value--
      playBombSound()
      if (lives.value <= 0) { endGame(); return }
    }
  }
}

function updateScoreLabel() {
  if (scoreText) scoreText.text = '⭐ ' + score.value
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (starTimer) clearInterval(starTimer)
  if (bombTimer) clearInterval(bombTimer)
  if (loopTimer) clearInterval(loopTimer)
  stars.forEach(s => s.node.remove())
  bombs.forEach(b => b.node.remove())
  playVictorySound()
  props.onComplete(score.value)
}

function updatePlayerX(clientX: number) {
  const rect = container.value?.getBoundingClientRect()
  if (!rect || !leafer) return
  const scale = gameWidth / rect.width
  const x = (clientX - rect.left) * scale
  playerX.value = Math.max(0, Math.min(gameWidth - playerWidth, x - playerWidth / 2))
  if (playerNode) playerNode.x = playerX.value
}

function handleTouch(e: TouchEvent) {
  if (!isPlaying.value) return
  e.preventDefault()
  const t = e.touches[0]
  if (t) updatePlayerX(t.clientX)
}
function handleMouse(e: MouseEvent) {
  if (!isPlaying.value) return
  updatePlayerX(e.clientX)
}

onMounted(() => {
  if (!container.value) return
  leafer = new Leafer({
    view: container.value,
    width: gameWidth,
    height: gameHeight,
    fill: '#16213e',
  } as any)
  const bg = buildBackground()
  bgNode = bg
  leafer.add(bg as any)
})

onUnmounted(() => {
  if (starTimer) clearInterval(starTimer)
  if (bombTimer) clearInterval(bombTimer)
  if (loopTimer) clearInterval(loopTimer)
  leafer?.destroy()
  leafer = null
})
</script>

<template>
  <div class="catch-stars">
    <div class="game-header">
      <div class="title">⭐ 接星星</div>
      <div class="score-display">⭐ {{ score }}</div>
      <div class="lives"><span v-for="i in lives" :key="i">❤️</span></div>
    </div>

    <div
      class="game-area"
      ref="container"
      @touchstart.prevent="handleTouch"
      @touchmove.prevent="handleTouch"
      @mousemove="handleMouse"
    ></div>

    <div class="overlay" v-if="!isPlaying && !isGameOver">
      <div class="overlay-content">
        <div class="big-icon">⭐</div>
        <h2>接星星</h2>
        <p>左右移动接住星星 ⭐<br>避开炸弹 💣</p>
        <button class="btn btn-primary" @click="startGame">开始游戏</button>
      </div>
    </div>

    <div class="overlay" v-if="isGameOver">
      <div class="overlay-content">
        <div class="big-icon">🏆</div>
        <h2>游戏结束</h2>
        <div class="final-score">⭐ {{ score }} 分</div>
        <button class="btn btn-primary" @click="startGame">再玩一次</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catch-stars { position: relative; text-align: center; }
.game-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; margin-bottom: 8px; }
.title { font-size: 18px; font-weight: 700; }
.score-display { font-size: 18px; font-weight: 700; color: var(--color-accent); }
.lives { font-size: 14px; }
.game-area {
  position: relative;
  width: 360px;
  height: 500px;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  touch-action: none;
}
.overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-content { text-align: center; color: white; padding: 8px; }
.big-icon { font-size: 48px; margin-bottom: 8px; }
.overlay-content h2 { font-size: 22px; margin-bottom: 6px; }
.overlay-content p { font-size: 14px; margin-bottom: 14px; opacity: 0.8; line-height: 1.4; }
.final-score { font-size: 28px; font-weight: 700; color: var(--color-accent); margin-bottom: 14px; }
</style>
