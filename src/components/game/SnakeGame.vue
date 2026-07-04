<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const GRID_SIZE = 17
const CELL_SIZE = 22
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
interface Point { x: number; y: number }

const snake = ref<Point[]>([{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }])
const food = ref<Point>({ x: 8, y: 7 })
const direction = ref<Direction>('RIGHT')
const nextDirection = ref<Direction>('RIGHT')
const score = ref(0)
const highScore = ref(0)
const isGameOver = ref(false)
const isPaused = ref(false)
const isPlaying = ref(false)
const gameSpeed = ref(350)

let gameLoop: ReturnType<typeof setInterval> | null = null
let ctx: CanvasRenderingContext2D | null = null

// 鼠标/触摸拖动控制
let touchStartX = 0
let touchStartY = 0

onMounted(() => {
  const canvas = document.getElementById('snake-canvas') as HTMLCanvasElement | null
  if (canvas) ctx = canvas.getContext('2d')
  draw()
  window.addEventListener('keydown', handleKey)

  try {
    const saved = localStorage.getItem('snake-highscore')
    if (saved) highScore.value = parseInt(saved)
  } catch {}
})

onUnmounted(() => {
  stopLoop()
  window.removeEventListener('keydown', handleKey)
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
    (snake.value.some(s => s.x === newFood.x && s.y === newFood.y) ||
    (newFood.x === head.x && newFood.y === head.y))
  )
  food.value = newFood
}

function start() {
  snake.value = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]  // 初始长度 3 节
  direction.value = 'RIGHT'
  nextDirection.value = 'RIGHT'
  score.value = 0
  gameSpeed.value = 350
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

  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    gameOver()
    return
  }
  if (snake.value.slice(1).some(s => s.x === newHead.x && s.y === newHead.y)) {
    gameOver()
    return
  }

  snake.value.unshift(newHead)

  if (newHead.x === food.value.x && newHead.y === food.value.y) {
    score.value += 10
    if (gameSpeed.value > 120 && score.value % 30 === 0) {
      gameSpeed.value = Math.max(120, gameSpeed.value - 20)
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

function togglePause() { isPaused.value = !isPaused.value }

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && isGameOver.value) { e.preventDefault(); start(); return }
  if ((e.key === ' ' || e.key === 'Escape') && isPlaying.value) {
    e.preventDefault(); togglePause(); return
  }
  if (isPaused.value || !isPlaying.value) return

  const keyMap: Record<string, Direction> = {
    ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
    w: 'UP', W: 'UP', s: 'DOWN', S: 'DOWN', a: 'LEFT', A: 'LEFT', d: 'RIGHT', D: 'RIGHT',
  }
  const dir = keyMap[e.key]
  if (!dir) return
  e.preventDefault()
  const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  if (dir !== opposites[direction.value]) {
    nextDirection.value = dir
  }
}

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
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return
  const dir: Direction = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'RIGHT' : 'LEFT')
    : (dy > 0 ? 'DOWN' : 'UP')
  const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  if (dir !== opposites[direction.value]) {
    nextDirection.value = dir
  }
}

function setDir(dir: Direction) {
  if (!isPlaying.value || isPaused.value) return
  const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  if (dir !== opposites[direction.value]) {
    nextDirection.value = dir
  }
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // 网格
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#F0FFF4' : '#E8F5E9'
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
  }

  // 食物
  const fx = food.value.x * CELL_SIZE
  const fy = food.value.y * CELL_SIZE
  ctx.save()
  ctx.shadowColor = 'rgba(239, 68, 68, 0.4)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 1, 0, Math.PI * 2)
  ctx.fillStyle = '#EF4444'
  ctx.fill()
  ctx.shadowBlur = 0
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
    const r = Math.round(34 + progress * 30)
    const g = Math.round(197 - progress * 60)
    const b = Math.round(94 - progress * 50)
    const color = `rgb(${r}, ${g}, ${b})`

    ctx.save()
    if (isHead) {
      ctx.shadowColor = 'rgba(34, 197, 94, 0.4)'
      ctx.shadowBlur = 8
    }
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

    if (isHead) {
      const dir = direction.value
      const cx = px + size / 2
      const cy = py + size / 2
      let e1x, e1y, e2x, e2y
      if (dir === 'RIGHT') { e1x = cx + 3; e1y = cy - 3; e2x = cx + 3; e2y = cy + 3 }
      else if (dir === 'LEFT') { e1x = cx - 3; e1y = cy - 3; e2x = cx - 3; e2y = cy + 3 }
      else if (dir === 'UP') { e1x = cx - 3; e1y = cy - 3; e2x = cx + 3; e2y = cy - 3 }
      else { e1x = cx - 3; e1y = cy + 3; e2x = cx + 3; e2y = cy + 3 }
      ctx.fillStyle = 'white'
      ctx.beginPath(); ctx.arc(e1x, e1y, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(e2x, e2y, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#1F2937'
      ctx.beginPath(); ctx.arc(e1x, e1y, 1.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(e2x, e2y, 1.5, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (isPaused.value) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('已暂停', CANVAS_SIZE / 2, CANVAS_SIZE / 2)
  }
}
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

    <div class="canvas-wrap"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd">

      <canvas id="snake-canvas"
        :width="CANVAS_SIZE"
        :height="CANVAS_SIZE"
        class="snake-canvas" />

      <!-- 开始界面 -->
      <div v-if="!isPlaying && !isGameOver" class="overlay">
        <div class="overlay-card">
          <div class="overlay-icon">🐍</div>
          <h3>贪吃蛇</h3>
          <p class="hint">键盘方向键 / WASD</p>
          <p class="hint">手指滑动 / 下方按钮</p>
          <p class="hint">空格暂停</p>
          <button class="play-btn" type="button" @click="start">开始游戏</button>
        </div>
      </div>

      <!-- 结束界面 -->
      <div v-if="isGameOver" class="overlay">
        <div class="overlay-card">
          <div class="overlay-icon">😀</div>
          <h3 v-if="score === 0">还没开始就结束了~</h3>
          <h3 v-else-if="score >= highScore && score > 0">新纪录！太厉害了！</h3>
          <h3 v-else-if="score >= 100">很厉害哦！</h3>
          <h3 v-else>游戏结束</h3>
          <p class="final-score">得分：{{ score }}</p>
          <button class="play-btn" type="button" @click="start">再来一次</button>
        </div>
      </div>

      <!-- 暂停提示 -->
      <div v-if="isPlaying && isPaused" class="overlay pause-overlay">
        <p>已暂停</p>
        <p class="hint" style="font-size:12px;">按空格继续</p>
      </div>
    </div>

    <!-- 方向键 -->
    <div v-if="isPlaying" class="dpad">
      <div class="dpad-row">
        <button class="d-btn" type="button" @click="setDir('UP')">▲</button>
      </div>
      <div class="dpad-row">
        <button class="d-btn" type="button" @click="setDir('LEFT')">◀</button>
        <button class="d-btn pause-btn" type="button" @click="togglePause">{{ isPaused ? '▶' : '⚡' }}</button>
        <button class="d-btn" type="button" @click="setDir('RIGHT')">▶</button>
      </div>
      <div class="dpad-row">
        <button class="d-btn" type="button" @click="setDir('DOWN')">▼</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snake-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.snake-header {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 280px;
}
.stat-item {
  flex: 1;
  text-align: center;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 6px 0;
}
.stat-value { display: block; font-size: 20px; font-weight: 800; color: #3B82F6; }
.stat-value.best { color: #F59E0B; }
.stat-label { font-size: 11px; color: #9CA3AF; }

.canvas-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 2px solid #D1D5DB;
}
.snake-canvas {
  display: block;
  width: 100%;
  max-width: min(calc(100vw - 32px), 480px);
  image-rendering: auto;
}

.overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.88);
  z-index: 10;
}
.pause-overlay { background: rgba(255,255,255,0.5); }
.pause-overlay p { font-size: 22px; font-weight: 800; color: #374151; }

.overlay-card { text-align: center; padding: 16px; }
.overlay-icon { font-size: 44px; margin-bottom: 4px; }
.overlay-card h3 { font-size: 17px; font-weight: 700; color: #1F2937; margin-bottom: 6px; }
.hint { font-size: 11px; color: #9CA3AF; margin: 1px 0; }
.final-score { font-size: 15px; color: #1F2937; margin: 8px 0 4px; font-weight: 600; }

.play-btn {
  margin-top: 10px;
  padding: 10px 30px;
  background: #3B82F6;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 3px 10px rgba(59,130,246,0.3);
  transition: all 0.15s;
}
.play-btn:active { transform: scale(0.95); }

.dpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}
.dpad-row { display: flex; gap: 4px; }
.d-btn {
  width: 52px; height: 52px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-family: inherit;
  user-select: none;
  -webkit-user-select: none;
}
.d-btn:active { background: #E5E7EB; transform: scale(0.9); }
.pause-btn { font-size: 16px; font-weight: 800; }
</style>
