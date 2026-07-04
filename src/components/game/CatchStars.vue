<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { playStarSound, playBombSound, playVictorySound } from '@/utils/sound'

const props = defineProps<{
  onComplete: (score: number) => void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const gameWidth = 360
const gameHeight = 500
const playerWidth = 70
const playerHeight = 22
const starSize = 20  // 星星绘制半径

const playerX = ref(gameWidth / 2 - playerWidth / 2)
const score = ref(0)
const lives = ref(3)
const isPlaying = ref(false)
const isGameOver = ref(false)

// 改用纯绘制数据，不用 emoji
const stars = ref<Array<{ x: number; y: number; speed: number }>>([])
const bombs = ref<Array<{ x: number; y: number; speed: number }>>([])

let animationId: number | null = null
let starTimer: ReturnType<typeof setInterval> | null = null
let bombTimer: ReturnType<typeof setInterval> | null = null

// 触摸状态（手机滑动需要能跟踪）
let isTouching = false
let touchId: number | null = null

function startGame() {
  score.value = 0
  lives.value = 3
  playerX.value = gameWidth / 2 - playerWidth / 2
  stars.value = []
  bombs.value = []
  isPlaying.value = true
  isGameOver.value = false

  // 每1.2秒生成一个星星
  starTimer = setInterval(() => {
    if (!isPlaying.value) return
    stars.value.push({
      x: Math.random() * (gameWidth - starSize * 2) + starSize,
      y: -starSize,
      speed: 1.5 + Math.random() * 1.5
    })
  }, 1200)

  // 每2.5秒生成一个炸弹
  bombTimer = setInterval(() => {
    if (!isPlaying.value) return
    bombs.value.push({
      x: Math.random() * (gameWidth - starSize * 2) + starSize,
      y: -starSize,
      speed: 2 + Math.random() * 1
    })
  }, 2500)

  gameLoop()
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  // 绘制五角星
  const spikes = 5
  const outerR = r
  const innerR = r * 0.4
  let rot = Math.PI / 2 * 3
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerR)

  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
    rot += step
  }

  ctx.lineTo(cx, cy - outerR)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  // 发光效果
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawBomb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // 绘制炸弹（圆形+引线）
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2)
  ctx.fillStyle = '#333'
  ctx.fill()
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 2
  ctx.stroke()

  // 引线
  ctx.beginPath()
  ctx.moveTo(cx, cy - r * 0.5)
  ctx.lineTo(cx + 3, cy - r * 0.8)
  ctx.strokeStyle = '#8B4513'
  ctx.lineWidth = 2
  ctx.stroke()

  // 火花
  ctx.beginPath()
  ctx.arc(cx + 2, cy - r * 0.9, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#FF6B6B'
  ctx.fill()
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, w: number, h: number) {
  const y = gameHeight - h - 10
  const r = 8

  // 圆角矩形
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()

  const grad = ctx.createLinearGradient(x, y, x + w, y)
  grad.addColorStop(0, '#FF6B6B')
  grad.addColorStop(1, '#FFD93D')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#16213e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, gameWidth, gameHeight)

  // 星空背景
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  for (let i = 0; i < 30; i++) {
    const sx = (i * 37 + 13) % gameWidth
    const sy = (i * 53 + 7) % gameHeight
    const sr = (i % 3) + 1
    ctx.beginPath()
    ctx.arc(sx, sy, sr, 0, Math.PI * 2)
    ctx.fill()
  }
}

function gameLoop() {
  if (!isPlaying.value) return

  // 移动星星
  stars.value.forEach(star => {
    star.y += star.speed
  })
  stars.value = stars.value.filter(star => star.y < gameHeight + starSize)

  // 移动炸弹
  bombs.value.forEach(bomb => {
    bomb.y += bomb.speed
  })
  bombs.value = bombs.value.filter(bomb => bomb.y < gameHeight + starSize)

  // 检测星星碰撞
  stars.value = stars.value.filter(star => {
    if (
      star.y + starSize > gameHeight - playerHeight - 10 &&
      star.y - starSize < gameHeight - 10 &&
      star.x + starSize > playerX.value &&
      star.x - starSize < playerX.value + playerWidth
    ) {
      score.value += 10
      playStarSound()
      return false
    }
    return true
  })

  // 检测炸弹碰撞
  bombs.value = bombs.value.filter(bomb => {
    if (
      bomb.y + starSize > gameHeight - playerHeight - 10 &&
      bomb.y - starSize < gameHeight - 10 &&
      bomb.x + starSize > playerX.value &&
      bomb.x - starSize < playerX.value + playerWidth
    ) {
      lives.value--
      playBombSound()
      if (lives.value <= 0) {
        endGame()
      }
      return false
    }
    return true
  })

  draw()
  animationId = requestAnimationFrame(gameLoop)
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  drawBackground(ctx)

  // 画星星
  stars.value.forEach(star => {
    drawStar(ctx, star.x, star.y, starSize * 0.5, '#FFD93D')
  })

  // 画炸弹
  bombs.value.forEach(bomb => {
    drawBomb(ctx, bomb.x, bomb.y, starSize)
  })

  // 画接盘
  drawPlayer(ctx, playerX.value, playerWidth, playerHeight)

  // 分数
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px Arial'
  ctx.fillText('⭐ ' + score.value, 12, 24)

  // 生命（心形）
  for (let i = 0; i < lives.value; i++) {
    drawHeart(ctx, gameWidth - 22 - i * 28, 16, 10)
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + size * 0.3)
  ctx.bezierCurveTo(cx, cy, cx - size * 0.5, cy, cx - size * 0.5, cy + size * 0.3)
  ctx.bezierCurveTo(cx - size * 0.5, cy + size * 0.7, cx, cy + size * 0.9, cx, cy + size)
  ctx.bezierCurveTo(cx, cy + size * 0.9, cx + size * 0.5, cy + size * 0.7, cx + size * 0.5, cy + size * 0.3)
  ctx.bezierCurveTo(cx + size * 0.5, cy, cx, cy, cx, cy + size * 0.3)
  ctx.closePath()
  ctx.fillStyle = '#FF6B6B'
  ctx.fill()
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (starTimer) clearInterval(starTimer)
  if (bombTimer) clearInterval(bombTimer)
  if (animationId) cancelAnimationFrame(animationId)
  playVictorySound()
  props.onComplete(score.value)
}

function handleTouchStart(e: TouchEvent) {
  if (!isPlaying.value) return
  isTouching = true
  const touch = e.touches[0]
  if (!touch) return
  touchId = touch.identifier
  updatePlayerX(touch.clientX)
}

function handleTouchMove(e: TouchEvent) {
  if (!isPlaying.value || !isTouching) return
  e.preventDefault()
  // 用上次记录的 touchId 找对应 touch
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches[i]
    if (touchId === null || t.identifier === touchId) {
      updatePlayerX(t.clientX)
      break
    }
  }
  // 如果找不到，用第一个
  if (e.touches.length > 0) {
    updatePlayerX(e.touches[0].clientX)
  }
}

function handleTouchEnd() {
  isTouching = false
  touchId = null
}

function updatePlayerX(clientX: number) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = clientX - rect.left
  playerX.value = Math.max(0, Math.min(gameWidth - playerWidth, x - playerWidth / 2))
}

function handleMouseMove(e: MouseEvent) {
  if (!isPlaying.value) return
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left
  playerX.value = Math.max(0, Math.min(gameWidth - playerWidth, x - playerWidth / 2))
}

onUnmounted(() => {
  if (starTimer) clearInterval(starTimer)
  if (bombTimer) clearInterval(bombTimer)
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<template>
  <div class="catch-stars">
    <div class="game-header">
      <div class="title">⭐ 接星星</div>
      <div class="score-display">⭐ {{ score }}</div>
      <div class="lives">
        <span v-for="i in lives" :key="i">❤️</span>
      </div>
    </div>

    <div class="game-area">
      <canvas
        ref="canvas"
        :width="gameWidth"
        :height="gameHeight"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        @mousemove="handleMouseMove"
      ></canvas>

      <!-- 开始界面 -->
      <div class="overlay" v-if="!isPlaying && !isGameOver">
        <div class="overlay-content">
          <div class="big-icon">⭐</div>
          <h2>接星星</h2>
          <p>左右移动接住星星 ⭐<br>避开炸弹 💣</p>
          <button class="btn btn-primary" @click="startGame">开始游戏</button>
        </div>
      </div>

      <!-- 游戏结束 -->
      <div class="overlay" v-if="isGameOver">
        <div class="overlay-content">
          <div class="big-icon">🏆</div>
          <h2>游戏结束</h2>
          <div class="final-score">⭐ {{ score }} 分</div>
          <button class="btn btn-primary" @click="startGame">再玩一次</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catch-stars {
  text-align: center;
}
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  margin-bottom: 8px;
}
.title {
  font-size: 18px;
  font-weight: 700;
}
.score-display {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-accent);
}
.lives {
  font-size: 14px;
}
.game-area {
  position: relative;
  display: inline-block;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  touch-action: none; /* 防止触摸滚动 */
}
canvas {
  display: block;
  cursor: none;
  width: 100%;
  height: auto;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-content {
  text-align: center;
  color: white;
}
.big-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.overlay-content h2 {
  font-size: 28px;
  margin-bottom: 12px;
}
.overlay-content p {
  font-size: 16px;
  margin-bottom: 24px;
  opacity: 0.8;
}
.final-score {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 24px;
}
</style>
