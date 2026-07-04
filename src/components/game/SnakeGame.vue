<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const GRID_SIZE = 13
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

// 方向
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
interface Point { x: number; y: number }

const snake = ref<Point[]>([{ x: 6, y: 7 }])
const food = ref<Point>({ x: 8, y: 7 })
const direction = ref<Direction>('RIGHT')
const nextDirection = ref<Direction>('RIGHT')
const score = ref(0)
const highScore = ref(0)
const isGameOver = ref(false)
const isPaused = ref(false)
const isPlaying = ref(false)
const gameSpeed = ref(180)

let gameLoop: ReturnType<typeof setInterval> | null = null
let canvasEl: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

// 加载最高分
onMounted(() => {
  try {
    const saved = localStorage.getItem('snake-highscore')
    if (saved) highScore.value = parseInt(saved)
  } catch {}
})

function spawnFood() {
  const head = snake.value[0]
  let attempts = 0
  let newFood: Point
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    attempts++
  } while (
    attempts < 100 &&
    snake.value.some(s => s.x === newFood.x && s.y === newFood.y) ||
    (newFood.x === head.x && newFood.y === head.y)
  )
  food.value = newFood
}

function start() {
  snake.value = [{ x: 6, y: 7 }, { x: 5, y: 7 }]
  direction.value = 'RIGHT'
  nextDirection.value = 'RIGHT'
  score.value = 0
  isGameOver.value = false
  isPaused.value = false
  isPlaying.value = true
  spawnFood()
  startLoop()
}

function startLoop() {
  stopLoop()
  gameLoop = setInterval(tick, gameSpeed.value)
}

function stopLoop() {
  if (gameLoop) {
    clearInterval(gameLoop)
    gameLoop = null
  }
}

function tick() {
  if (isPaused.value || isGameOver.value) return

  direction.value = nextDirection.value

  const head = snake.value[0]
  let newHead: Point

  switch (direction.value) {
    case 'UP': newHead = { x: head.x, y: head.y - 1 }; break
    case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break
    case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break
    case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break
  }

  // 撞墙
  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    gameOver()
    return
  }

  // 撞自己（从第五节开始判断，防止误判尾部未移动的情况）
  if (snake.value.slice(1).some(s => s.x === newHead.x && s.y === newHead.y)) {
    gameOver()
    return
  }

  snake.value.unshift(newHead)

  // 吃食物
  if (newHead.x === food.value.x && newHead.y === food.value.y) {
    score.value += 10
    // 每吃 5 个食物加速一次（最快 80ms）
    if (gameSpeed.value > 80 && score.value % 50 === 0) {
      gameSpeed.value = Math.max(80, gameSpeed.value - 15)
      restartLoop()
    }
    spawnFood()
  } else {
    snake.value.pop()
  }

  draw()
}

function gameOver() {
  isGameOver.value = true
  isPlaying.value = false
  stopLoop()

  if (score.value > highScore.value) {
    highScore.value = score.value
    try { localStorage.setItem('snake-highscore', String(highScore.value)) } catch {}
  }

  draw()
}

function restartLoop() {
  stopLoop()
  startLoop()
}

function togglePause() {
  isPaused.value = !isPaused.value
}

// 键盘控制
function handleKey(e: KeyboardEvent) {
  if (!isPlaying.value && !isGameOver.value) return
  if (e.key === 'Enter' && isGameOver.value) { e.preventDefault(); start(); return }
  if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); if (isPlaying.value) togglePause(); return }

  if (isPaused.value) return

  const keyMap: Record<string, Direction> = {
    ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
    w: 'UP', W: 'UP', s: 'DOWN', S: 'DOWN', a: 'LEFT', A: 'LEFT', d: 'RIGHT', D: 'RIGHT',
  }
  const dir = keyMap[e.key]
  if (!dir) return
  e.preventDefault()

  // 不能反向
  const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  if (dir !== opposites[direction.value]) {
    nextDirection.value = dir
  }
}

// 触屏滑动手势
let touchStartX = 0
let touchStartY = 0
function handleTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
}
function handleTouchEnd(e: TouchEvent) {
  if (!isPlaying.value || isPaused.value) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  if (Math.max(absDx, absDy) < 15) return

  const dir = absDx > absDy
    ? (dx > 0 ? 'RIGHT' as Direction : 'LEFT' as Direction)
    : (dy > 0 ? 'DOWN' as Direction : 'UP' as Direction)

  const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  if (dir !== opposites[direction.value]) {
    nextDirection.value = dir
  }
}

// 绘制
function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // 背景网格（浅色格子交替）
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#F0FFF4' : '#E8F5E9'
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
  }

  // 食物（小红苹果，带高光和跳动动画）
  const fx = food.value.x * CELL_SIZE
  const fy = food.value.y * CELL_SIZE
  ctx.save()
  // 外发光
  ctx.shadowColor = 'rgba(239, 68, 68, 0.4)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 1, 0, Math.PI * 2)
  ctx.fillStyle = '#EF4444'
  ctx.fill()
  ctx.shadowBlur = 0
  // 高光
  ctx.beginPath()
  ctx.arc(fx + 8, fy + 7, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fill()
  ctx.restore()

  // 蛇
  const segments = snake.value
  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i]
    const isHead = i === 0
    const progress = i / Math.max(segments.length - 1, 1)

    // 颜色渐变：头部亮绿色 → 尾部深绿色
    const r = Math.round(34 + progress * 30)
    const g = Math.round(197 - progress * 60)
    const b = Math.round(94 - progress * 50)
    const color = `rgb(${r}, ${g}, ${b})`

    ctx.save()
    if (isHead) {
      ctx.shadowColor = 'rgba(34, 197, 94, 0.4)'
      ctx.shadowBlur = 8
    }
    // 圆角正方形
    const radius = 4
    const px = s.x * CELL_SIZE + 1
    const py = s.y * CELL_SIZE + 1
    const size = CELL_SIZE - 2
    ctx.beginPath()
    ctx.moveTo(px + radius, py)
    ctx.lineTo(px + size - radius, py)
    ctx.quadraticCurveTo(px + size, py, px + size, py + radius)
    ctx.lineTo(px + size, py + size - radius)
    ctx.quadraticCurveTo(px + size, py + size, px + size - radius, py + size)
    ctx.lineTo(px + radius, py + size)
    ctx.quadraticCurveTo(px, py + size, px, py + size - radius)
    ctx.lineTo(px, py + radius)
    ctx.quadraticCurveTo(px, py, px + radius, py)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.shadowBlur = 0

    // 头部眼睛
    if (isHead) {
      const dir = direction.value
      let e1x: number, e1y: number, e2x: number, e2y: number
      const cx = px + size / 2
      const cy = py + size / 2
      if (dir === 'RIGHT') {
        e1x = cx + 3; e1y = cy - 3; e2x = cx + 3; e2y = cy + 3
      } else if (dir === 'LEFT') {
        e1x = cx - 3; e1y = cy - 3; e2x = cx - 3; e2y = cy + 3
      } else if (dir === 'UP') {
        e1x = cx - 3; e1y = cy - 3; e2x = cx + 3; e2y = cy - 3
      } else {
        e1x = cx - 3; e1y = cy + 3; e2x = cx + 3; e2y = cy + 3
      }
      ctx.fillStyle = 'white'
      ctx.beginPath(); ctx.arc(e1x, e1y, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(e2x, e2y, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#1F2937'
      ctx.beginPath(); ctx.arc(e1x, e1y, 1.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(e2x, e2y, 1.5, 0, Math.PI * 2); ctx.fill()
    }

    ctx.restore()
  }

  // 暂停时覆盖
  if (isPaused.value) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('已暂停', CANVAS_SIZE / 2, CANVAS_SIZE / 2)
  }
}

onMounted(() => {
  canvasEl = document.querySelector('canvas')
  if (canvasEl) ctx = canvasEl.getContext('2d')
  draw()
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  stopLoop()
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <div class="snake-wrapper">
    <div class="snake-header">
      <div class="stat-item">
        <span class="stat-value">{{ score }}</span>
        <span class="stat-label">分数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ snake.length - 2 >= 0 ? snake.length - 2 : 0 }}</span>
        <span class="stat-label">长度</span>
      </div>
      <div class="stat-item">
        <span class="stat-value best">{{ highScore }}</span>
        <span class="stat-label">最高</span>
      </div>
    </div>

    <div class="canvas-area"
      @touchstart.prevent="handleTouchStart"
      @touchend.prevent="handleTouchEnd">
      <canvas ref="canvasEl"
        :width="CANVAS_SIZE"
        :height="CANVAS_SIZE"
        class="snake-canvas" />

      <!-- 覆盖提示 -->
      <div v-if="!isPlaying && !isGameOver" class="overlay">
        <div class="overlay-card">
          <div class="overlay-icon">&#x1F40D;</div>
          <h3>贪吃蛇</h3>
          <p class="overlay-hint">键盘方向键 / WASD / 滑动手势</p>
          <p class="overlay-hint">空格键暂停</p>
          <button class="start-btn" @click="start">开始游戏</button>
        </div>
      </div>

      <div v-if="isGameOver" class="overlay">
        <div class="overlay-card">
          <div class="overlay-icon">&#x1F600;</div>
          <h3 v-if="score === 0">还没开始就结束了~</h3>
          <h3 v-else-if="score >= highScore && score > 0">新纪录！太厉害了！</h3>
          <h3 v-else-if="score >= 100">很厉害哦！</h3>
          <h3 v-else>游戏结束</h3>
          <p class="overlay-score">得分：{{ score }}</p>
          <button class="start-btn" @click="start">再来一次</button>
        </div>
      </div>

      <div v-if="isPlaying && isPaused" class="overlay overlay-pause">
        <p>已暂停</p>
        <p class="overlay-hint" style="font-size: 12px;">按空格继续</p>
      </div>
    </div>

    <!-- 方向键（移动端） -->
    <div v-if="isPlaying" class="dpad">
      <div class="dpad-row">
        <button class="dpad-btn" @click="nextDirection = 'UP'" @touchenter.prevent="nextDirection = 'UP'">&#x25B2;</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" @click="nextDirection = 'LEFT'" @touchenter.prevent="nextDirection = 'LEFT'">&#x25C0;</button>
        <button class="dpad-btn dpad-pause" @click="togglePause">{{ isPaused ? '▶' : '||' }}</button>
        <button class="dpad-btn" @click="nextDirection = 'RIGHT'" @touchenter.prevent="nextDirection = 'RIGHT'">&#x25B6;</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" @click="nextDirection = 'DOWN'" @touchenter.prevent="nextDirection = 'DOWN'">&#x25BC;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snake-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.snake-header {
  display: flex;
  gap: var(--space-4);
  width: 100%;
  max-width: 300px;
}
.stat-item {
  flex: 1;
  text-align: center;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}
.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-primary);
}
.stat-value.best { color: #F59E0B; }
.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.canvas-area {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 2px solid #D1D5DB;
}
.snake-canvas {
  display: block;
  width: 260px;
  height: 260px;
  touch-action: none;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.85);
  border-radius: 12px;
}
.overlay-pause { background: rgba(255,255,255,0.6); }
.overlay-pause p { font-size: 24px; font-weight: 800; color: #374151; }
.overlay-card { text-align: center; padding: var(--space-4); }
.overlay-icon { font-size: 48px; }
.overlay-card h3 { font-size: var(--font-size-lg); color: var(--text-primary); margin-bottom: var(--space-2); }
.overlay-hint { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0; }
.overlay-score { font-size: var(--font-size-md); color: var(--text-primary); margin-bottom: var(--space-3); font-weight: 600; }

.start-btn {
  margin-top: var(--space-3);
  padding: 10px 28px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-md);
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: var(--shadow-primary);
  transition: all 0.2s;
}
.start-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.4); }

/* 方向键 */
.dpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: var(--space-2);
}
.dpad-row { display: flex; gap: 4px; }
.dpad-btn {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  line-height: 1;
  font-family: inherit;
}
.dpad-btn:active { background: #E5E7EB; transform: scale(0.92); }
.dpad-pause { font-size: 14px; font-weight: 800; }
</style>
