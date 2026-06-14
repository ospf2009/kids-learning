<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{
  onComplete: (score: number) => void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const gameWidth = 360
const gameHeight = 500
const playerWidth = 60
const playerHeight = 20
const starSize = 30

const playerX = ref(gameWidth / 2 - playerWidth / 2)
const score = ref(0)
const lives = ref(3)
const isPlaying = ref(false)
const isGameOver = ref(false)
const stars = ref<Array<{ x: number; y: number; speed: number; emoji: string }>>([])
const bombs = ref<Array<{ x: number; y: number; speed: number }>>([])

let animationId: number | null = null
let starTimer: ReturnType<typeof setInterval> | null = null
let bombTimer: ReturnType<typeof setInterval> | null = null

const starEmojis = ['⭐', '🌟', '✨', '💫']

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
      x: Math.random() * (gameWidth - starSize),
      y: -starSize,
      speed: 1.5 + Math.random() * 1.5,
      emoji: starEmojis[Math.floor(Math.random() * starEmojis.length)]
    })
  }, 1200)

  // 每2.5秒生成一个炸弹
  bombTimer = setInterval(() => {
    if (!isPlaying.value) return
    bombs.value.push({
      x: Math.random() * (gameWidth - starSize),
      y: -starSize,
      speed: 2 + Math.random() * 1
    })
  }, 2500)

  gameLoop()
}

function gameLoop() {
  if (!isPlaying.value) return

  // 移动星星
  stars.value.forEach(star => {
    star.y += star.speed
  })

  // 移动炸弹
  bombs.value.forEach(bomb => {
    bomb.y += bomb.speed
  })

  // 检测星星碰撞
  stars.value = stars.value.filter(star => {
    if (star.y > gameHeight) return false // 超出屏幕
    if (
      star.y + starSize > gameHeight - playerHeight - 10 &&
      star.x + starSize > playerX.value &&
      star.x < playerX.value + playerWidth
    ) {
      score.value += 10
      return false
    }
    return true
  })

  // 检测炸弹碰撞
  bombs.value = bombs.value.filter(bomb => {
    if (bomb.y > gameHeight) return false
    if (
      bomb.y + starSize > gameHeight - playerHeight - 10 &&
      bomb.x + starSize > playerX.value &&
      bomb.x < playerX.value + playerWidth
    ) {
      lives.value--
      if (lives.value <= 0) {
        endGame()
      }
      return false
    }
    return true
  })

  // 画布绘制
  draw()

  if (isPlaying.value) {
    animationId = requestAnimationFrame(gameLoop)
  }
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, gameWidth, gameHeight)

  // 背景
  const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#16213e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, gameWidth, gameHeight)

  // 画星星
  ctx.font = '24px Arial'
  stars.value.forEach(star => {
    ctx.fillText(star.emoji, star.x, star.y + 24)
  })

  // 画炸弹
  ctx.font = '24px Arial'
  bombs.value.forEach(bomb => {
    ctx.fillText('💣', bomb.x, bomb.y + 24)
  })

  // 画接盘
  const paddleGradient = ctx.createLinearGradient(playerX.value, 0, playerX.value + playerWidth, 0)
  paddleGradient.addColorStop(0, '#FF6B6B')
  paddleGradient.addColorStop(1, '#FF8E8E')
  ctx.fillStyle = paddleGradient
  ctx.beginPath()
  ctx.roundRect(playerX.value, gameHeight - playerHeight - 10, playerWidth, playerHeight, 10)
  ctx.fill()

  // 画分数和生命
  ctx.fillStyle = 'white'
  ctx.font = 'bold 16px Arial'
  ctx.fillText(`⭐ ${score.value}`, 10, 25)

  // 画生命心形
  for (let i = 0; i < lives.value; i++) {
    ctx.fillText('❤️', gameWidth - 30 - i * 25, 25)
  }
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (starTimer) clearInterval(starTimer)
  if (bombTimer) clearInterval(bombTimer)
  if (animationId) cancelAnimationFrame(animationId)
  props.onComplete(score.value)
}

function handleTouch(e: TouchEvent) {
  if (!isPlaying.value) return
  e.preventDefault()
  const touch = e.touches[0]
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = touch.clientX - rect.left
  playerX.value = Math.max(0, Math.min(gameWidth - playerWidth, x - playerWidth / 2))
}

function handleMouse(e: MouseEvent) {
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
      <div class="title">🌟 接星星</div>
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
        @touchmove="handleTouch"
        @mousemove="handleMouse"
      ></canvas>

      <!-- 开始界面 -->
      <div class="overlay" v-if="!isPlaying && !isGameOver">
        <div class="overlay-content">
          <div class="big-icon">🌟</div>
          <h2>接星星</h2>
          <p>左右滑动接住星星<br>避开炸弹 💣</p>
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
}
canvas {
  display: block;
  cursor: none;
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
