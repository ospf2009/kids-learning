<script setup lang="ts">
/**
 * ChoiceQuestion.vue —— 选择 / 判断 / 填空 互动题（Leafer 渲染）
 * 把原来的纯 DOM 选项升级为 Leafer 画布，并【用代码生成配套图示】，
 * 让小朋友通过图形理解题意，而不只是读文字：
 *   - 题干：大字号文字 + 自动生成的辅助图示（数量点阵 / 算式小球 / 形状 / 比大小 等）
 *   - 选项：圆角卡片，可显示 emoji / 内置图形(shape) / 纯文字
 *   - 点击选项即选，正确绿色、错误红色，最终 emit('result', correct)
 *
 * 数据兼容：
 *   - 老题库（无 scene）：用 question.options 文字渲染，但仍会按内容自动补图示
 *   - 新题库（带 scene.items）：用 items 渲染，支持 image/shape 素材
 *
 * 判定：选项值与 question.answer 比对（与老逻辑一致）。
 */
import { ref, watch } from 'vue'
import type { Question, SceneItem } from '@/data/chapters'
import { Group, Rect, Text, Ellipse, Image as LeaferImage, Star, Polygon } from 'leafer-ui'
import LeaferStage from './LeaferStage.vue'

/** Fisher-Yates 乱序 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 填空题：无预设选项时，根据答案类型自动生成干扰项。
 */
function guessFillOptions(answer: string): string[] {
  function pool(): string[] {
    if (/^\d+$/.test(answer)) {
      return ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20']
    }
    if (/^[\u4e00-\u9fff]+$/.test(answer)) {
      return ['一','二','三','四','五','六','七','八','九','十','上','下','左','右','大','小','多','少',
              '天','地','人','口','手','足','日','月','水','火','木','金','土','山','石','田','飞','虫','鸟',
              '春','夏','秋','冬','风','雪','花','草','果','叶','对','错','出','入','来','去']
    }
    if (/^[a-zA-Z]+$/.test(answer)) {
      return ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
              'A','B','C','D','E','F','G','H','I','Good','Hello','my','Thank']
    }
    return ['a','b','c','d','e','f','g','h','i','j','k','l','m']
  }
  const set = new Set<string>([answer])
  const noise = shuffle(pool().filter(p => p !== answer))
  const need = Math.min(5, Math.max(3, 6 - set.size))
  for (let i = 0; i < need && i < noise.length; i++) set.add(noise[i]!)
  return shuffle(Array.from(set))
}

const props = defineProps<{
  question: Question
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'result', correct: boolean, userAnswer?: string): void
}>()

const stage = ref<InstanceType<typeof LeaferStage> | null>(null)
const locked = ref(false)
/** 题面实际内容高度（随题目动态变化），用于让 LeaferStage 容器自适应，避免下方空白过多 */
const contentHeight = ref(360)
const MIN_HEIGHT = 280

interface OptRender {
  id: string
  label: string
  value: string
  emoji?: string
  image?: string
  shape?: SceneItem['shape']
  color?: string
}

/** 把题目（choice/judge/fill）转成统一的选项渲染列表 */
function buildOptions(): OptRender[] {
  const q = props.question
  if (q.scene?.items && q.scene.items.length > 0) {
    return q.scene.items.map(it => ({
      id: it.id, label: it.label, value: it.label,
      emoji: it.emoji, image: it.image, shape: it.shape, color: it.color,
    }))
  }
  if (q.type === 'judge') {
    return [
      { id: 'dui', label: '对', value: '对' },
      { id: 'cuo', label: '错', value: '错' },
    ]
  }
  if (q.options && q.options.length > 0) {
    return q.options.map((o, i) => ({ id: 'opt' + i, label: o, value: o }))
  }
  if (q.type === 'fill' && q.answer) {
    return guessFillOptions(q.answer).map((o, i) => ({ id: 'opt' + i, label: o, value: o }))
  }
  return []
}

// ============ 题干图示生成（用代码画，理解题意） ============

type DiagramFn = (add: any, W: number) => number // 返回图示占用的高度

/** 解析 "a + b" / "a - b" 算式 */
function parseExpr(q: string): { a: number; b: number; op: '+' | '-' } | null {
  const m = q.match(/(\d+)\s*([+\-])\s*(\d+)/)
  if (m) return { a: +m[1]!, b: +m[3]!, op: m[2] as '+' | '-' }
  return null
}

/** 数一数：题干含"（数字）个xx"或"几个" -> 画对应数量的小圆 */
function parseCount(q: string): { n: number; noun: string } | null {
  const m = q.match(/(\d+)\s*个([一-龥]+)/)
  if (m) return { n: +m[1]!, noun: m[2]! }
  const m2 = q.match(/([一-龥]+?)[，。]?.*?(\d+)\s*个/)
  if (m2) return { n: +m2[2]!, noun: m2[1]! }
  return null
}

/** 解析比大小 "a > b" / "a < b" / "a = b" */
function parseCompare(q: string): { a: number; b: number; op: '>' | '<' | '=' } | null {
  const m = q.match(/(\d+)\s*([><=])\s*(\d+)/)
  if (m) return { a: +m[1]!, b: +m[3]!, op: m[2] as '>' | '<' | '=' }
  return null
}

/** 画一组点阵（最多10个一行，最多20个），返回占用高度 */
function drawDotGroup(add: any, cx: number, count: number, y: number, color: string): number {
  const r = 9
  const gap = 22
  const maxPerRow = 5
  const total = Math.min(count, 20)
  const rows = Math.ceil(total / maxPerRow)
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / maxPerRow)
    const col = i % maxPerRow
    const inRow = Math.min(maxPerRow, total - row * maxPerRow)
    const startX = cx - ((inRow - 1) * gap) / 2
    const x = startX + col * gap
    const yy = y + row * gap
    add(new Ellipse({ x: x - r, y: yy - r, width: r * 2, height: r * 2, fill: color } as any))
  }
  return rows * gap
}

/** 画比大小图示：左红点 vs 右蓝点，中间画符号，多用亮色高亮 */
function drawCompare(add: any, W: number, a: number, b: number, op: '>' | '<' | '=', y: number): number {
  const halfW = W / 2
  const leftX = halfW / 2
  const rightX = halfW + halfW / 2
  const leftH = drawDotGroup(add, leftX, a, y, '#F87171')
  const rightH = drawDotGroup(add, rightX, b, y, '#60A5FA')
  const baseH = Math.max(leftH, rightH)

  // 数字标注
  add(new Text({ text: `${a}`, x: 0, y: y - 22, width: halfW, textAlign: 'center', fontSize: 18, fontWeight: '700', fill: '#374151' } as any))
  add(new Text({ text: `${b}`, x: halfW, y: y - 22, width: halfW, textAlign: 'center', fontSize: 18, fontWeight: '700', fill: '#374151' } as any))

  // 中间符号（> 用右指三角，< 用左指三角，= 用双横）
  const mx = W / 2
  const my = y + baseH / 2
  if (op === '>') {
    add(new Polygon({ x: mx - 14, y: my - 14, width: 28, height: 28, sides: 3, rotation: 90, fill: '#F59E0B' } as any))
  } else if (op === '<') {
    add(new Polygon({ x: mx - 14, y: my - 14, width: 28, height: 28, sides: 3, rotation: -90, fill: '#F59E0B' } as any))
  } else {
    add(new Rect({ x: mx - 14, y: my - 6, width: 28, height: 5, fill: '#F59E0B' } as any))
    add(new Rect({ x: mx - 14, y: my + 4, width: 28, height: 5, fill: '#F59E0B' } as any))
  }
  // 提示
  const hint = op === '>' ? '左边多，用大于号' : op === '<' ? '右边多，用小于号' : '两边一样多'
  add(new Text({ text: hint, x: 0, y: y + baseH + 2, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return baseH + 24
}

// ============ 英语：数字 → 点阵 ============
const EN_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}
/** 解析英文数字题："one 是几？" / '"five" 是几？' */
function parseEnglishNumber(q: string): number | null {
  const m = q.match(/"?([a-z]+)"?\s*是几/)
  if (m && EN_NUM[m[1]!]) return EN_NUM[m[1]!]
  return null
}
function drawNumberDots(add: any, W: number, n: number, y: number): number {
  return drawDots(add, W, n, y, '#A78BFA', `数一数：${n} 个 (${Object.keys(EN_NUM).find(k => EN_NUM[k] === n)})`)
}

// ============ 英语/语文：颜色 → 色块 ============
const COLOR_MAP: Record<string, { hex: string; cn: string }> = {
  red: { hex: '#EF4444', cn: '红色' }, blue: { hex: '#3B82F6', cn: '蓝色' },
  green: { hex: '#22C55E', cn: '绿色' }, yellow: { hex: '#FACC15', cn: '黄色' },
  orange: { hex: '#FB923C', cn: '橙色' }, purple: { hex: '#A855F7', cn: '紫色' },
  pink: { hex: '#EC4899', cn: '粉色' }, black: { hex: '#1F2937', cn: '黑色' },
  white: { hex: '#F3F4F6', cn: '白色' }, brown: { hex: '#92400E', cn: '棕色' },
  '红色': { hex: '#EF4444', cn: '红色' }, '蓝色': { hex: '#3B82F6', cn: '蓝色' },
  '绿色': { hex: '#22C55E', cn: '绿色' }, '黄色': { hex: '#FACC15', cn: '黄色' },
}
/** 解析颜色题："red 是什么颜色？" / '"blue" 是什么颜色？' / 天空是什么颜色？ */
function parseColor(q: string): { hex: string; cn: string } | null {
  // 英文颜色词（带引号或无引号）
  const m = q.match(/"?([a-z]+)"?/)
  if (m && COLOR_MAP[m[1]!]) return COLOR_MAP[m[1]!]
  // 中文颜色词
  const cnMatch = q.match(/(红色|蓝色|绿色|黄色|橙色|紫色|粉色|黑色|白色|棕色)/)
  if (cnMatch) return COLOR_MAP[cnMatch[1]!]
  return null
}
function drawColorSwatch(add: any, W: number, hex: string, label: string, y: number): number {
  const size = 70
  const x = (W - size) / 2
  add(new Rect({ x, y, width: size, height: size, fill: hex, stroke: '#D1D5DB', strokeWidth: 2, cornerRadius: 12 } as any))
  // 白底需要边框提示
  if (hex === '#F3F4F6') {
    add(new Text({ text: '白', x, y: y + size / 2 - 12, width: size, textAlign: 'center', fontSize: 22, fill: '#9CA3AF' } as any))
  }
  add(new Text({ text: label, x: 0, y: y + size + 4, width: W, textAlign: 'center', fontSize: 13, fill: '#6B7280' } as any))
  return size + 22
}

// ============ 数学：人民币（元角分） ============
/** 解析人民币题：含"元""角""分"且是 choice 类型 */
function parseMoney(q: string): { text: string } | null {
  if (/[元角分]/.test(q) && /(\d+\s*[元角分])/.test(q)) return { text: q }
  return null
}
/** 画人民币：把题干里出现的金额画成硬币/纸币示意（1元=大圆，1角=小圆，1分=更小圆） */
function drawMoney(add: any, W: number, q: string, y: number): number {
  const units = q.match(/(\d+)\s*([元角分])/g) || []
  const palette: Record<string, string> = { 元: '#F59E0B', 角: '#A3E635', 分: '#67E8F9' }
  let cx = 40
  let drew = 0
  units.forEach(u => {
    const m = u.match(/(\d+)\s*([元角分])/)
    if (!m) return
    const n = Math.min(+m[1]!, 5)
    const unit = m[2]!
    const r = unit === '元' ? 15 : unit === '角' ? 11 : 8
    for (let i = 0; i < n; i++) {
      add(new Ellipse({ x: cx - r, y: y + 20 - r, width: r * 2, height: r * 2, fill: palette[unit]!, stroke: '#fff', strokeWidth: 2 } as any))
      add(new Text({ text: unit, x: cx - r, y: y + 20 - 6, width: r * 2, textAlign: 'center', fontSize: 9, fill: '#fff' } as any))
      cx += r * 2 + 10
      if (cx > W - 20) { cx = 40; y += 44 }
      drew++
    }
  })
  add(new Text({ text: '💡 认一认：元最大，分最小', x: 0, y: y + 44, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return 44 + (drew > 0 ? 28 : 0)
}

// ============ 语文：反义词对照（上下/左右/大小/多少） ============
const ANTONYM: Record<string, { word: string; dir: 'v' | 'h' | 'size'; a: string; b: string }> = {
  '上': { word: '下', dir: 'v', a: '上', b: '下' },
  '下': { word: '上', dir: 'v', a: '下', b: '上' },
  '左': { word: '右', dir: 'h', a: '左', b: '右' },
  '右': { word: '左', dir: 'h', a: '右', b: '左' },
  '大': { word: '小', dir: 'size', a: '大', b: '小' },
  '小': { word: '大', dir: 'size', a: '小', b: '大' },
  '多': { word: '少', dir: 'size', a: '多', b: '少' },
  '少': { word: '多', dir: 'size', a: '少', b: '多' },
}
/** 解析反义词题：'上对___' / '前对后' / '左对右' 等（含"对"字） */
function parseAntonym(q: string): { a: string; b: string; dir: 'v' | 'h' | 'size' } | null {
  const m = q.match(/(.)\s*对\s*(.)/)
  if (m && ANTONYM[m[1]!]) return ANTONYM[m[1]!]
  return null
}
function drawAntonym(add: any, W: number, a: string, b: string, dir: 'v' | 'h' | 'size', y: number): number {
  const cx1 = W / 4, cx2 = (W / 4) * 3
  if (dir === 'v') {
    // 上/下：竖排箭头
    add(new Text({ text: a, x: 0, y: y, width: W, textAlign: 'center', fontSize: 30, fontWeight: '700', fill: '#F87171' } as any))
    add(new Text({ text: '↓', x: 0, y: y + 34, width: W, textAlign: 'center', fontSize: 22, fill: '#9CA3AF' } as any))
    add(new Text({ text: b, x: 0, y: y + 60, width: W, textAlign: 'center', fontSize: 30, fontWeight: '700', fill: '#60A5FA' } as any))
    return 96
  }
  if (dir === 'h') {
    // 左/右：横排箭头
    add(new Text({ text: a, x: 0, y: y + 6, width: cx1, textAlign: 'center', fontSize: 30, fontWeight: '700', fill: '#F87171' } as any))
    add(new Text({ text: '→', x: cx1, y: y + 6, width: cx1, textAlign: 'center', fontSize: 22, fill: '#9CA3AF' } as any))
    add(new Text({ text: b, x: cx2, y: y + 6, width: cx1, textAlign: 'center', fontSize: 30, fontWeight: '700', fill: '#60A5FA' } as any))
    return 50
  }
  // size：大圆 vs 小圆
  add(new Ellipse({ x: cx1 - 30, y: y, width: 60, height: 60, fill: '#F87171' } as any))
  add(new Text({ text: a, x: cx1 - 30, y: y + 20, width: 60, textAlign: 'center', fontSize: 16, fill: '#fff' } as any))
  add(new Ellipse({ x: cx2 - 16, y: y + 14, width: 32, height: 32, fill: '#60A5FA' } as any))
  add(new Text({ text: b, x: cx2 - 16, y: y + 23, width: 32, textAlign: 'center', fontSize: 12, fill: '#fff' } as any))
  return 64
}

// ============ 语文：笔画数（题干配 strokes 字段，画对应数量小横杠） ============
function drawStrokes(add: any, W: number, n: number, y: number): number {
  const perRow = 8
  const barW = 22
  const gap = 8
  const rows = Math.ceil(n / perRow)
  const total = Math.min(n, 20)
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / perRow)
    const c = i % perRow
    const inRow = Math.min(perRow, total - r * perRow)
    const startX = (W - (inRow * barW + (inRow - 1) * gap)) / 2
    const x = startX + c * (barW + gap)
    const yy = y + r * 20
    add(new Rect({ x, y: yy, width: barW, height: 6, fill: '#FB7185', cornerRadius: 3 } as any))
  }
  add(new Text({ text: `共 ${n} 画（每横代表一画）`, x: 0, y: y + rows * 20 + 2, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return rows * 20 + 22
}

// ============ 数学：分数（圆均分 + 涂色 numerator/denominator 份） ============
function drawFraction(add: any, W: number, num: number, den: number, y: number): number {
  const cx = W / 2
  const cy = y + 50
  const R = 46
  // 底盘
  add(new Ellipse({ x: cx - R, y: cy - R, width: R * 2, height: R * 2, fill: '#FFFFFF', stroke: '#374151', strokeWidth: 2 } as any))
  const seg = (Math.PI * 2) / den
  // 涂色份数（从顶部顺时针）
  for (let i = 0; i < den; i++) {
    const a0 = -Math.PI / 2 + i * seg
    const a1 = a0 + seg
    const mid = (a0 + a1) / 2
    const x0 = cx + Math.cos(a0) * R
    const y0 = cy + Math.sin(a0) * R
    const x1 = cx + Math.cos(a1) * R
    const y1 = cy + Math.sin(a1) * R
    const fill = i < num ? '#F59E0B' : '#FFFFFF'
    // 用三角形扇区（圆心 + 两点）近似
    add(new Polygon({
      x: cx, y: cy, width: 0, height: 0,
      points: [0, 0, x0 - cx, y0 - cy, x1 - cx, y1 - cy],
      fill, stroke: '#E5E7EB', strokeWidth: 1,
    } as any))
    // 分隔线
    add(new Rect({
      x: cx - 1, y: cy - R, width: 2, height: R, fill: '#9CA3AF',
      origin: 'bottom', rotation: (mid + Math.PI / 2) * 180 / Math.PI,
    } as any))
  }
  add(new Text({ text: `${num}/${den}`, x: 0, y: cy + R + 4, width: W, textAlign: 'center', fontSize: 16, fontWeight: '700', fill: '#374151' } as any))
  add(new Text({ text: `一个圆平均分成 ${den} 份，涂了 ${num} 份`, x: 0, y: cy + R + 24, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return R * 2 + 44
}

// ============ 语文：拼音单韵母（a o e i u ü） ============
const PINYIN_LETTERS = ['a', 'o', 'e', 'i', 'u', 'ü', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l']
/** 解析拼音题：题干含 "a" "o" "e" 等且出现"拼音/韵母/声母"字样 */
function parsePinyin(q: string): string | null {
  if (!/(拼音|韵母|声母|学拼音)/.test(q)) return null
  const m = q.match(/"?([a-zü]+)"?/)
  if (m && PINYIN_LETTERS.includes(m[1]!)) return m[1]!
  return null
}
function drawPinyin(add: any, W: number, letter: string, y: number): number {
  add(new Ellipse({ x: W / 2 - 36, y, width: 72, height: 72, fill: '#FFF7ED', stroke: '#FB923C', strokeWidth: 3, cornerRadius: 16 } as any))
  add(new Text({ text: letter, x: 0, y: y + 8, width: W, textAlign: 'center', fontSize: 48, fontWeight: '700', fill: '#FB923C' } as any))
  add(new Text({ text: '读一读这个拼音', x: 0, y: y + 80, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return 96
}

// ============ 数学：除法（等分圆 / 分组实物） ============
/** 解析除法 "a ÷ b" / "a / b" */
function parseDivide(q: string): { a: number; b: number } | null {
  const m = q.match(/(\d+)\s*[÷/]\s*(\d+)/)
  if (m) return { a: +m[1]!, b: +m[2]! }
  return null
}
/** 画除法：把 a 个小球平均分成 b 组，每组 n 个 */
function drawDivide(add: any, W: number, a: number, b: number, y: number): number {
  const per = Math.floor(a / b) || 1
  const r = 9
  const gap = 22
  const groupGap = 30
  const totalGroups = Math.min(b, 5)
  const startX = (W - ((totalGroups - 1) * (per * gap + groupGap) + (per - 1) * gap)) / 2
  const palette = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6']
  for (let g = 0; g < totalGroups; g++) {
    const gx = startX + g * (per * gap + groupGap)
    for (let i = 0; i < per; i++) {
      const x = gx + i * gap
      add(new Ellipse({ x: x - r, y: y - r, width: r * 2, height: r * 2, fill: palette[g % palette.length]! } as any))
    }
    // 组括号
    const lineX = gx - 6
    add(new Rect({ x: lineX, y: y - r - 4, width: 2, height: r * 2 + 8, fill: '#9CA3AF' } as any))
  }
  const hint = b > totalGroups
    ? `把 ${a} 平均分成 ${b} 组，每组 ${per} 个`
    : `把 ${a} 平均分成 ${b} 组，每组 ${per} 个`
  add(new Text({ text: hint, x: 0, y: y + r + 6, width: W, textAlign: 'center', fontSize: 13, fill: '#9CA3AF' } as any))
  return r * 2 + 28
}

// ============ 数学：长度单位（米/厘米，尺子对比） ============
/** 解析长度题：含"米""厘米""cm""m" */
function parseLength(q: string): { num: number; unit: '米' | '厘米' } | null {
  const m = q.match(/(\d+)\s*(米|厘米|cm|m)/i)
  if (!m) return null
  const unit = (m[2] === '米' || m[2]!.toLowerCase() === 'm') ? '米' : '厘米'
  return { num: +m[1]!, unit }
}
/** 画长度：尺子示意 + 实物对比（1米≈手臂长，1厘米≈指甲宽） */
function drawLength(add: any, W: number, num: number, unit: '米' | '厘米', y: number): number {
  if (unit === '米') {
    // 画一根长尺（横向），标刻度
    const x0 = 30, x1 = W - 30, yy = y + 20
    add(new Rect({ x: x0, y: yy - 6, width: x1 - x0, height: 12, fill: '#FDE68A', stroke: '#D97706', strokeWidth: 2, cornerRadius: 6 } as any))
    const ticks = 10
    for (let i = 0; i <= ticks; i++) {
      const tx = x0 + (x1 - x0) * (i / ticks)
      const big = i % 5 === 0
      add(new Rect({ x: tx - 1, y: yy - (big ? 12 : 7), width: 2, height: big ? 12 : 7, fill: '#D97706' } as any))
    }
    add(new Text({ text: `${num} 米（大约 ${num} 个小朋友伸开手臂那么长）`, x: 0, y: yy + 12, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
    return 56
  }
  // 厘米：画一个回形针 / 指甲示意（短尺）
  const cx = W / 2
  const yy = y + 24
  add(new Rect({ x: cx - 50, y: yy - 5, width: 100, height: 10, fill: '#BFDBFE', stroke: '#2563EB', strokeWidth: 2, cornerRadius: 5 } as any))
  add(new Rect({ x: cx - 50, y: yy - 1, width: 1, height: 2, fill: '#2563EB' } as any))
  add(new Rect({ x: cx + 50, y: yy - 1, width: 1, height: 2, fill: '#2563EB' } as any))
  add(new Text({ text: `${num} 厘米（大约 ${num} 个指甲盖那么宽）`, x: 0, y: yy + 12, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return 50
}

// ============ 数学：图形 / 几何体 / 角 / 观察物体 ============
/** 解析图形题：题干含"圆形/正方形/长方形/三角形/圆柱/球/长方体/正方体"或"角" */
function parseShape3d(q: string): { kind: string; label: string } | null {
  const table: [RegExp, string, string][] = [
    [/圆柱/, 'cylinder', '圆柱'], [/球体?/, 'sphere', '球'],
    [/正方体/, 'cube', '正方体'], [/长方体/, 'cuboid', '长方体'],
    [/正方[形形]/, 'square', '正方形'], [/长方[形形]/, 'rect', '长方形'],
    [/三角[形形]/, 'triangle', '三角形'], [/圆形|圆[形形]/, 'circle', '圆形'],
    [/直角/, 'rightangle', '直角'], [/钝角/, 'obtuse', '钝角'], [/锐角/, 'acute', '锐角'], [/角/, 'angle', '角'],
  ]
  for (const [re, kind, label] of table) {
    if (re.test(q)) return { kind, label }
  }
  return null
}
/** 画 3D/2D 几何体示意（用 2D 投影表达） */
function drawShape3d(add: any, W: number, kind: string, label: string, y: number): number {
  const cx = W / 2
  const cy = y + 30
  if (kind === 'circle') {
    add(new Ellipse({ x: cx - 30, y: cy - 30, width: 60, height: 60, fill: '#FDE68A', stroke: '#D97706', strokeWidth: 3 } as any))
  } else if (kind === 'square') {
    add(new Rect({ x: cx - 30, y: cy - 30, width: 60, height: 60, fill: '#FDE68A', stroke: '#D97706', strokeWidth: 3, cornerRadius: 4 } as any))
  } else if (kind === 'rect') {
    add(new Rect({ x: cx - 40, y: cy - 22, width: 80, height: 44, fill: '#FDE68A', stroke: '#D97706', strokeWidth: 3, cornerRadius: 4 } as any))
  } else if (kind === 'triangle') {
    add(new Polygon({ x: cx - 35, y: cy - 28, width: 70, height: 56, sides: 3, fill: '#FDE68A', stroke: '#D97706', strokeWidth: 3 } as any))
  } else if (kind === 'cube' || kind === 'cuboid') {
    // 等距立方示意
    const w = kind === 'cube' ? 46 : 60
    const h = 46
    add(new Rect({ x: cx - w / 2, y: cy - h / 2, width: w, height: h, fill: '#BFDBFE', stroke: '#2563EB', strokeWidth: 2 } as any))
    add(new Polygon({ x: cx - w / 2, y: cy - h / 2, width: w, height: h, points: [0, 0, 22, -16, 22 + w, -16, w, 0], fill: '#93C5FD', stroke: '#2563EB', strokeWidth: 2 } as any))
    add(new Polygon({ x: cx + w / 2, y: cy - h / 2, width: w, height: h, points: [0, 0, 0, h, 22, h - 16 + h - h, 22, h - 16], fill: '#60A5FA', stroke: '#2563EB', strokeWidth: 2 } as any))
  } else if (kind === 'cylinder') {
    add(new Rect({ x: cx - 26, y: cy - 20, width: 52, height: 40, fill: '#BFDBFE', stroke: '#2563EB', strokeWidth: 2 } as any))
    add(new Ellipse({ x: cx - 26, y: cy - 28, width: 52, height: 16, fill: '#93C5FD', stroke: '#2563EB', strokeWidth: 2 } as any))
    add(new Ellipse({ x: cx - 26, y: cy + 12, width: 52, height: 16, fill: '#BFDBFE', stroke: '#2563EB', strokeWidth: 2 } as any))
  } else if (kind === 'sphere') {
    add(new Ellipse({ x: cx - 30, y: cy - 30, width: 60, height: 60, fill: '#BFDBFE', stroke: '#2563EB', strokeWidth: 2 } as any))
    add(new Ellipse({ x: cx - 18, y: cy - 18, width: 20, height: 12, fill: '#DBEAFE' } as any))
  } else if (kind === 'rightangle' || kind === 'obtuse' || kind === 'acute' || kind === 'angle') {
    // 画角（顶点 + 两条边）
    const vx = cx - 10, vy = cy + 18
    add(new Rect({ x: vx - 2, y: vy - 2, width: 4, height: 4, fill: '#374151' } as any))
    add(new Rect({ x: vx, y: vy - 34, width: 3, height: 34, fill: '#FB923C', origin: 'bottom', rotation: 0 } as any))
    if (kind === 'rightangle') {
      add(new Rect({ x: vx, y: vy - 26, width: 22, height: 3, fill: '#FB923C' } as any))
      add(new Rect({ x: vx, y: vy - 26, width: 3, height: 22, fill: '#FB923C' } as any))
    } else if (kind === 'obtuse') {
      add(new Rect({ x: vx, y: vy - 30, width: 3, height: 30, fill: '#FB923C', origin: 'bottom', rotation: 35 } as any))
    } else if (kind === 'acute') {
      add(new Rect({ x: vx, y: vy - 30, width: 3, height: 30, fill: '#FB923C', origin: 'bottom', rotation: -35 } as any))
    } else {
      add(new Rect({ x: vx, y: vy - 30, width: 3, height: 30, fill: '#FB923C', origin: 'bottom', rotation: 45 } as any))
    }
  }
  // 文字"示例：xxx"——给充足垂直空间：fontSize 13 + 留白
  const labelY = cy + 42
  add(new Text({ text: `示例：${label}`, x: 0, y: labelY, width: W, textAlign: 'center', fontSize: 13, fill: '#9CA3AF' } as any))
  // 返回值 = 从 y 起点到 (labelY + 文字高 + 底部安全边距) 的距离
  // 13px 文字实际渲染高度约 16~18，加 8px 底边距，再加 4px 兜底防文字下沉
  return (labelY - y) + 18 + 8
}

// ============ 数学：位置（前后/里外/左右） ============
/** 解析位置题：必须含明确的"第N个/最X/中间/排第/从X数"等排序语境，
 *  避免被"下面哪个是XX"这种提问句式误吞。 */
function parsePosition(q: string): { word: string } | null {
  const POS_HINT = /(第[一二三四五六七八九十\d]+个?|[一二三四五六七八九十]个|最[前后左右上下里外]|中间|中[间心]|排[在第][一二三四五六七八九十\d]*|从[左右前后上下里外].{0,3}[数第])/
  if (!POS_HINT.test(q)) return null
  const m = q.match(/(前面|后面|左边|右边|上面|下面|里面|外面|中间|左|右|前|后)/)
  if (m) return { word: m[1]! }
  return null
}
/** 画位置：一排小人，高亮目标位置 */
function drawPosition(add: any, W: number, word: string, y: number): number {
  const n = 5
  const gap = 44
  const startX = (W - (n - 1) * gap) / 2
  const yy = y + 24
  for (let i = 0; i < n; i++) {
    const x = startX + i * gap
    const head = new Ellipse({ x: x - 8, y: yy - 24, width: 16, height: 16, fill: '#CBD5E1' } as any)
    const body = new Rect({ x: x - 9, y: yy - 8, width: 18, height: 24, fill: '#CBD5E1', cornerRadius: 6 } as any)
    add(head as any)
    add(body as any)
  }
  // 找到高亮索引
  let idx = 2
  if (/前/.test(word)) idx = 0
  else if (/后/.test(word)) idx = n - 1
  else if (/左/.test(word)) idx = 0
  else if (/右/.test(word)) idx = n - 1
  else if (/中/.test(word)) idx = Math.floor(n / 2)
  else if (/上|里/.test(word)) idx = 2
  else if (/下|外/.test(word)) idx = 2
  const hx = startX + idx * gap
  // 高亮框
  add(new Rect({ x: hx - 14, y: yy - 30, width: 28, height: 58, fill: 'transparent', stroke: '#FB923C', strokeWidth: 3, cornerRadius: 8, dashPattern: [5, 4] } as any))
  // 箭头
  add(new Text({ text: '↓', x: hx - 9, y: yy - 50, width: 18, textAlign: 'center', fontSize: 18, fill: '#FB923C' } as any))
  add(new Text({ text: `“${word}”在这里`, x: 0, y: yy + 36, width: W, textAlign: 'center', fontSize: 13, fill: '#9CA3AF' } as any))
  return 84
}

// ============ 英语：字母识别（书写形状卡） ============
const LETTER_SHAPES: Record<string, 'line' | 'round' | 'mix'> = {}
/** 解析字母识别题：含大写字母 A-Z 或 "字母" 字样 */
function parseLetter(q: string): string | null {
  const m = q.match(/(?:字母)?\s*([A-Za-z])/)
  if (m) return m[1]!.toUpperCase()
  return null
}
/** 画字母卡（大号字母 + 书写提示线） */
function drawLetter(add: any, W: number, letter: string, y: number): number {
  const cx = W / 2
  // 四线三格
  const top = y + 6, bottom = y + 70
  for (let i = 0; i < 4; i++) {
    const yy = top + (bottom - top) * (i / 3)
    add(new Rect({ x: cx - 50, y: yy - 0.5, width: 100, height: 1, fill: i === 1 || i === 2 ? '#E5E7EB' : '#9CA3AF' } as any))
  }
  add(new Text({ text: letter, x: 0, y: top - 4, width: W, textAlign: 'center', fontSize: 56, fontWeight: '700', fill: '#6366F1' } as any))
  add(new Text({ text: `大写字母 ${letter}`, x: 0, y: bottom + 4, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return 84
}

// ============ 身体部位 / 食物 / 动物 单词（emoji 配对图） ============
/** 解析英语单词题：题干含英文单词 + 中文提示，返回 emoji 配对 */
function parseWordEmoji(q: string): { word: string; emoji: string } | null {
  const MAP: Record<string, string> = {
    head: '🙂', hand: '✋', foot: '🦶', eye: '👁️', nose: '👃', ear: '👂',
    arm: '💪', leg: '🦵', finger: '👆', face: '😊', mouth: '👄', hair: '💇',
    apple: '🍎', banana: '🍌', milk: '🥛', bread: '🍞', rice: '🍚', cake: '🍰',
    water: '💧', egg: '🥚', noodle: '🍜', juice: '🧃', meat: '🍖', fish: '🐟',
    cat: '🐱', dog: '🐶', pig: '🐷', duck: '🦆', elephant: '🐘', bird: '🐦',
    tiger: '🐯', panda: '🐼', monkey: '🐵', rabbit: '🐰', bear: '🐻', lion: '🦁',
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', black: '⚫', white: '⚪',
    orange: '🟠', pink: '🌸', purple: '🟣', brown: '🤎',
  }
  const m = q.match(/"?([a-zA-Z]+)"?/)
  if (m && MAP[m[1]!.toLowerCase()]) return { word: m[1]!, emoji: MAP[m[1]!.toLowerCase()]! }
  return null
}
/** 画单词 + emoji 配对图 */
function drawWordEmoji(add: any, W: number, word: string, emoji: string, y: number): number {
  const cx = W / 2
  add(new Ellipse({ x: cx - 36, y, width: 72, height: 72, fill: '#F0F9FF', stroke: '#38BDF8', strokeWidth: 3, cornerRadius: 16 } as any))
  add(new Text({ text: emoji, x: 0, y: y + 6, width: W, textAlign: 'center', fontSize: 40 } as any))
  add(new Text({ text: word, x: 0, y: y + 80, width: W, textAlign: 'center', fontSize: 22, fontWeight: '700', fill: '#0EA5E9' } as any))
  return 104
}

// ============ 语文：偏旁部首拆解（字 + 高亮部首） ============
/** 部首名 → 可显示字形（用于图示高亮） */
const RADICAL_FORM: Record<string, string> = {
  '虫字旁': '虫', '鱼字旁': '鱼', '三点水': '氵', '草字头': '艹', '言字旁': '讠',
  '日字旁': '日', '木字旁': '木', '单人旁': '亻', '双人旁': '彳', '提手旁': '扌',
  '左耳旁': '阝', '右耳旁': '阝', '走之底': '辶', '金字旁': '钅', '绞丝旁': '纟',
  '竖心旁': '忄', '两点水': '冫', '口字旁': '口', '月字旁': '月', '女字旁': '女',
  '衣字旁': '衤', '病字头': '疒', '宝盖头': '宀', '秃宝盖': '冖', '竹字头': '⺮',
  '反犬旁': '犭', '火字旁': '火', '四点底': '灬', '心字底': '心', '王字旁': '王',
  '石字旁': '石', '土字旁': '土', '禾字旁': '禾', '米字旁': '米', '车字旁': '车',
  '足字旁': '⻊', '目字旁': '目', '子字旁': '子', '马字旁': '马', '牛字旁': '牜',
  '弓字旁': '弓', '尸字头': '尸', '食字旁': '饣', '耳字旁': '耳', '舟字旁': '舟',
}
/** 解析偏旁题：题干含"XX字的部首/偏旁"（引号里的字 + 部首词或部首字形） */
function parseRadical(q: string): { char: string; radical: string } | null {
  const m = q.match(/"([^"]{1,3})"/)
  if (!m) return null
  const char = m[1]!
  // 1) 先找部首全称（如"日字旁""三点水""走之底"）
  const radicalNames = Object.keys(RADICAL_FORM)
  for (const name of radicalNames) {
    if (q.includes(name)) return { char, radical: RADICAL_FORM[name]! }
  }
  // 2) 再找选项中单独的部首字形（辶 / 氵 / 亻 / 钅 等）
  const forms = Object.values(RADICAL_FORM)
  const chars = q.match(/[艹氵氵讠日木亻彳扌阝辶钅纟忄冫口月女衤疒宀冖⺮犭火灬心王石土禾米车⻊目子马牜弓尸饣耳舟]/g)
  if (chars) {
    for (const c of chars) {
      const hit = forms.find(f => f === c)
      if (hit) return { char, radical: hit }
    }
  }
  return null
}
/** 画偏旁拆解卡：大字 + 橙框标出部首位置提示 */
function drawRadical(add: any, W: number, char: string, radical: string, y: number): number {
  const cx = W / 2
  // 字卡
  add(new Rect({ x: cx - 50, y, width: 100, height: 84, fill: '#FFF7ED', stroke: '#FB923C', strokeWidth: 3, cornerRadius: 12 } as any))
  add(new Text({ text: char, x: 0, y: y + 8, width: W, textAlign: 'center', fontSize: 56, fontWeight: '700', fill: '#1F2937' } as any))
  // 部首提示条
  add(new Rect({ x: cx - 30, y: y + 92, width: 60, height: 30, fill: '#FB923C', cornerRadius: 8 } as any))
  add(new Text({ text: `部首：${radical}`, x: 0, y: y + 98, width: W, textAlign: 'center', fontSize: 16, fontWeight: '700', fill: '#fff' } as any))
  add(new Text({ text: '💡 先找部首，再数笔画', x: 0, y: y + 128, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  return 152
}

// ============ 语文：近义词 / 反义词 对照 ============
/** 解析近义/反义词题：题干含"近义词/反义词" + 两个词 */
function parseSynonym(q: string): { a: string; b: string; kind: 'syn' | 'ant' } | null {
  const isSyn = /近义词/.test(q)
  const isAnt = /反义词/.test(q)
  if (!isSyn && !isAnt) return null
  // 提取题干里的中文词（2~4字）
  const words = q.match(/[""]([^""]{1,4})[""]|([一-龥]{1,4})(的近义词|的反义词)/g) || []
  const clean: string[] = []
  words.forEach(w => {
    const t = w.replace(/[""的近义词的反义词]/g, '').trim()
    if (t && !clean.includes(t)) clean.push(t)
  })
  // 从选项里提取候选词补全
  if (clean.length < 2) {
    const opts = q.match(/选项[：:]\s*\[([^\]]+)\]/)
    if (opts) {
      opts[1]!.split(/[，,]/).forEach(o => { const t = o.trim(); if (t && !clean.includes(t)) clean.push(t) })
    }
  }
  if (clean.length < 2) return null
  return { a: clean[0]!, b: clean[1]!, kind: isSyn ? 'syn' : 'ant' }
}
/** 画近/反义词对照卡 */
function drawSynonym(add: any, W: number, a: string, b: string, kind: 'syn' | 'ant', y: number): number {
  const cx1 = W / 3, cx2 = (W / 3) * 2
  add(new Rect({ x: cx1 - 52, y, width: 104, height: 56, fill: '#ECFDF5', stroke: '#34D399', strokeWidth: 2, cornerRadius: 12 } as any))
  add(new Text({ text: a, x: cx1 - 52, y: y + 16, width: 104, textAlign: 'center', fontSize: 20, fontWeight: '700', fill: '#065F46' } as any))
  add(new Rect({ x: cx2 - 52, y, width: 104, height: 56, fill: '#ECFDF5', stroke: '#34D399', strokeWidth: 2, cornerRadius: 12 } as any))
  add(new Text({ text: b, x: cx2 - 52, y: y + 16, width: 104, textAlign: 'center', fontSize: 20, fontWeight: '700', fill: '#065F46' } as any))
  if (kind === 'syn') {
    add(new Text({ text: '=', x: W / 2 - 14, y: y + 12, width: 28, textAlign: 'center', fontSize: 30, fontWeight: '700', fill: '#F59E0B' } as any))
    add(new Text({ text: '意思相近', x: 0, y: y + 62, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  } else {
    add(new Text({ text: '⟷', x: W / 2 - 16, y: y + 12, width: 32, textAlign: 'center', fontSize: 26, fontWeight: '700', fill: '#F87171' } as any))
    add(new Text({ text: '意思相反', x: 0, y: y + 62, width: W, textAlign: 'center', fontSize: 12, fill: '#9CA3AF' } as any))
  }
  return 80
}

/** 画一排数量点/球 */
function drawDots(add: any, W: number, count: number, y: number, color: string, label: string): number {
  const maxPerRow = 10
  const r = 11
  const gap = 26
  const total = Math.min(count, 20)
  const rows = Math.ceil(total / maxPerRow)
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / maxPerRow)
    const col = i % maxPerRow
    const inRow = Math.min(maxPerRow, total - row * maxPerRow)
    const startX = (W - (inRow - 1) * gap) / 2
    const x = startX + col * gap
    const yy = y + row * gap
    add(new Ellipse({ x: x - r, y: yy - r, width: r * 2, height: r * 2, fill: color } as any))
  }
  const h = rows * gap + 6
  if (label) {
    add(new Text({
      text: label, x: 0, y: y + h - 2, width: W, textAlign: 'center',
      fontSize: 13, fill: '#9CA3AF',
    } as any))
  }
  return h + 18
}

/** 画算式小球（a 个红 + b 个蓝），用于加减法理解 */
function drawExpr(add: any, W: number, a: number, b: number, op: '+' | '-', y: number): number {
  const r = 13
  const gap = 30
  const rowItems = op === '+' ? a + b : a
  const startX = (W - (rowItems - 1) * gap) / 2
  for (let i = 0; i < a; i++) {
    add(new Ellipse({ x: startX + i * gap - r, y: y - r, width: r * 2, height: r * 2, fill: '#F87171' } as any))
  }
  if (op === '+') {
    for (let i = 0; i < b; i++) {
      add(new Ellipse({ x: startX + (a + i) * gap - r, y: y - r, width: r * 2, height: r * 2, fill: '#60A5FA' } as any))
    }
  } else {
    // 减法：用虚线圈出要去掉的 b 个
    for (let i = 0; i < b; i++) {
      const idx = a - 1 - i
      add(new Ellipse({ x: startX + idx * gap - r, y: y - r, width: r * 2, height: r * 2,
        fill: '#F87171', stroke: '#9CA3AF', strokeWidth: 2, dashPattern: [4, 4] } as any))
    }
  }
  // 符号文字
  add(new Text({ text: op === '+' ? '加' : '减', x: 0, y: y + r + 2, width: W, textAlign: 'center',
    fontSize: 13, fill: '#9CA3AF' } as any))
  return gap + 22
}

/** 解析 "a × b" / "a * b" / "a x b" 乘法 */
function parseMultiply(q: string): { a: number; b: number } | null {
  const m = q.match(/(\d+)\s*[×x*]\s*(\d+)/)
  if (m) return { a: +m[1]!, b: +m[2]! }
  return null
}

/** 画乘法方格阵（a 行 × b 列，每格一个方块，总数 = a×b） */
function drawMultiply(add: any, W: number, a: number, b: number, y: number): number {
  const cell = 22
  const gap = 6
  const cols = Math.min(b, 10)
  const rows = Math.min(a, 10)
  const gridW = cols * cell + (cols - 1) * gap
  const gridH = rows * cell + (rows - 1) * gap
  const startX = (W - gridW) / 2
  const palette = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6']
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (cell + gap)
      const yy = y + r * (cell + gap)
      const color = palette[(r + c) % palette.length]!
      add(new Rect({ x, y: yy, width: cell, height: cell, fill: color, cornerRadius: 4 } as any))
    }
  }
  add(new Text({
    text: `${a} 行 × ${b} 列 = ${a * b} 个`, x: 0, y: y + gridH + 4, width: W, textAlign: 'center',
    fontSize: 13, fill: '#9CA3AF',
  } as any))
  return gridH + 22
}

/** 解析"X时" / "X点" / "X时Y分" 时钟题 */
function parseClock(q: string): { h: number; m: number } | null {
  const m1 = q.match(/(\d+)\s*[时点]\s*(\d+)\s*分/)
  if (m1) return { h: +m1[1]!, m: +m1[2]! }
  const m2 = q.match(/(\d+)\s*[时点半]/)
  if (m2) {
    if (/半/.test(q)) return { h: +m2[1]!, m: 30 }
    return { h: +m2[1]!, m: 0 }
  }
  return null
}

/** 画时钟表盘 + 时针/分针（用代码生成，帮助理解时间） */
function drawClock(add: any, W: number, h: number, m: number, y: number): number {
  const cx = W / 2
  const cy = y + 50
  const R = 46
  // 表盘
  add(new Ellipse({ x: cx - R, y: cy - R, width: R * 2, height: R * 2, fill: '#FFFFFF', stroke: '#374151', strokeWidth: 3 } as any))
  // 刻度（12 个小时点）
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2
    const ix = cx + Math.cos(ang) * (R - 6)
    const iy = cy + Math.sin(ang) * (R - 6)
    add(new Ellipse({ x: ix - 2, y: iy - 2, width: 4, height: 4, fill: '#9CA3AF' } as any))
  }
  // 数字 12 / 3 / 6 / 9
  const labels: [string, number, number][] = [
    ['12', 0, -R + 14], ['3', R - 14, 0], ['6', 0, R - 14], ['9', -R + 14, 0],
  ]
  labels.forEach(([t, dx, dy]) => {
    add(new Text({ text: t, x: cx + dx - 8, y: cy + dy - 8, width: 16, textAlign: 'center', fontSize: 12, fill: '#6B7280' } as any))
  })
  // 时针角度（每小时30° + 每分钟0.5°）
  const hourAng = ((h % 12) / 12) * Math.PI * 2 + (m / 60) * (Math.PI * 2 / 12) - Math.PI / 2
  // 分针角度（每分钟6°）
  const minAng = (m / 60) * Math.PI * 2 - Math.PI / 2
  // 分针（长）
  add(new Rect({
    x: cx - 2.5, y: cy - R + 12, width: 5, height: R - 12, fill: '#60A5FA',
    origin: 'bottom', rotation: (minAng + Math.PI / 2) * 180 / Math.PI,
  } as any))
  // 时针（短）
  add(new Rect({
    x: cx - 3, y: cy - R + 26, width: 6, height: R - 26, fill: '#374151',
    origin: 'bottom', rotation: (hourAng + Math.PI / 2) * 180 / Math.PI,
  } as any))
  // 中心点
  add(new Ellipse({ x: cx - 4, y: cy - 4, width: 8, height: 8, fill: '#374151' } as any))
  // 文字说明
  const hLabel = m === 0 ? `${h}点整` : m === 30 ? `${h}点半` : `${h}点${m}分`
  add(new Text({ text: `现在是：${hLabel}`, x: 0, y: cy + R + 4, width: W, textAlign: 'center', fontSize: 13, fill: '#9CA3AF' } as any))
  return R * 2 + 26
}

/** 画形状（用于"哪个是圆形/方形/三角"等题） */
function drawShape(shape: NonNullable<OptRender['shape']>, x: number, y: number, size: number, color: string): any {
  const common = { x: x - size / 2, y: y - size / 2, width: size, height: size } as any
  if (shape === 'circle') return new Ellipse({ ...common } as any)
  if (shape === 'square') return new Rect({ ...common, cornerRadius: 6 } as any)
  if (shape === 'triangle') return new Polygon({ ...common, sides: 3 } as any)
  if (shape === 'star' || shape === 'heart' || shape === 'diamond') {
    const points = shape === 'star' ? 5 : shape === 'heart' ? 5 : 4
    const inner = shape === 'star' ? 0.45 : shape === 'heart' ? 0.5 : 0.4
    return new Star({ ...common, points, innerRadius: size * inner } as any)
  }
  return new Rect({ ...common } as any)
}

/** 根据题型内容，自动选择图示绘制函数 */
function buildDiagram(add: (n: any) => void, W: number, startY: number = 16): number {
  const q = props.question
  const txt = q.question
  let y = startY

  // 0) 显式字段优先：笔画数 / 分数（题库直接给数据，最准确）
  if (q.strokes && q.strokes > 0) {
    return drawStrokes(add, W, q.strokes, y)
  }
  if (q.fraction && q.fraction.denominator > 0) {
    return drawFraction(add, W, q.fraction.numerator, q.fraction.denominator, y)
  }

  // 1) 加减法算式
  const expr = parseExpr(txt)
  if (expr && q.type === 'choice') {
    return drawExpr(add, W, expr.a, expr.b, expr.op, y)
  }

  // 2) 数一数题型
  const cnt = parseCount(txt)
  if (cnt) {
    return drawDots(add, W, cnt.n, y, '#FBBF24', `数一数：${cnt.n} 个${cnt.noun}`)
  }

  // 2.4) 比大小（"5 > 3" / "2 < 4" / "3 = 3"）
  const cmp = parseCompare(txt)
  if (cmp && q.type === 'choice') {
    return drawCompare(add, W, cmp.a, cmp.b, cmp.op, y)
  }

  // 2.5) 乘法方格阵（"3×4=?"）
  const mul = parseMultiply(txt)
  if (mul && q.type === 'choice') {
    return drawMultiply(add, W, mul.a, mul.b, y)
  }

  // 2.6) 时钟题（"3时" / "3点半" / "3时15分"）
  const clk = parseClock(txt)
  if (clk && q.type === 'choice') {
    return drawClock(add, W, clk.h, clk.m, y)
  }

  // 2.7) 英语颜色（"red 是什么颜色？" / 中文颜色词）
  const col = parseColor(txt)
  if (col && q.type === 'choice') {
    return drawColorSwatch(add, W, col.hex, col.cn, y)
  }

  // 2.8) 英语数字（"one 是几？"）
  const enNum = parseEnglishNumber(txt)
  if (enNum !== null && q.type === 'choice') {
    return drawNumberDots(add, W, enNum, y)
  }

  // 2.9) 数学人民币（含"元角分"的金额题）
  const money = parseMoney(txt)
  if (money && q.type === 'choice') {
    return drawMoney(add, W, txt, y)
  }

  // 2.10) 语文反义词（"上对___" / "左对右" / "大对小" / "多对少"）
  const ant = parseAntonym(txt)
  if (ant && q.type === 'choice') {
    return drawAntonym(add, W, ant.a, ant.b, ant.dir, y)
  }

  // 2.11) 语文拼音单韵母（"a" 是什么 / 学拼音）
  const py = parsePinyin(txt)
  if (py && q.type === 'choice') {
    return drawPinyin(add, W, py, y)
  }

  // 2.12) 数学除法（"6 ÷ 2 = ?"）—— 在乘法之后、时钟之前都可，这里放在拼音后
  const div = parseDivide(txt)
  if (div && q.type === 'choice') {
    return drawDivide(add, W, div.a, div.b, y)
  }

  // 2.13) 数学长度单位（含"米/厘米"）
  const len = parseLength(txt)
  if (len && q.type === 'choice') {
    return drawLength(add, W, len.num, len.unit, y)
  }

  // 2.14) 数学图形/几何体/角（圆/方/三角/圆柱/球/正方体/长方体/角）
  const shp = parseShape3d(txt)
  if (shp && q.type === 'choice') {
    return drawShape3d(add, W, shp.kind, shp.label, y)
  }

  // 2.15) 数学位置（前/后/左/右/上/下/里/外/中间）
  const pos = parsePosition(txt)
  if (pos && q.type === 'choice') {
    return drawPosition(add, W, pos.word, y)
  }

  // 2.16) 英语字母识别（"字母 A" / 首字母题）
  const ltr = parseLetter(txt)
  if (ltr && q.type === 'choice' && /字母|letter|大写的|小写/.test(txt)) {
    return drawLetter(add, W, ltr, y)
  }

  // 2.17) 英语单词（身体/食物/动物/颜色）—— emoji 配对图
  const wem = parseWordEmoji(txt)
  if (wem && q.type === 'choice') {
    return drawWordEmoji(add, W, wem.word, wem.emoji, y)
  }

  // 2.18) 语文偏旁部首（"晴 的部首是？" / "晒字的部首"）—— 字卡 + 部首高亮
  const combined = txt + ' ' + (q.options ? q.options.join(' ') : '')
  const rad = parseRadical(combined)
  if (rad && q.type === 'choice') {
    return drawRadical(add, W, rad.char, rad.radical, y)
  }

  // 2.19) 语文近义词 / 反义词（"XX 的近义词是？" / "XX 的反义词是？"）
  const syn = parseSynonym(txt)
  if (syn && q.type === 'choice') {
    return drawSynonym(add, W, syn.a, syn.b, syn.kind, y)
  }

  // 3) 形状题（选项含 shape 时，在题干画所有候选形状对照）
  const opts = buildOptions()
  if (opts.some(o => o.shape) && q.scene?.items) {
    const shapes = q.scene.items
    const gap = W / (shapes.length + 1)
    shapes.forEach((s, i) => {
      const node = drawShape(s.shape!, gap * (i + 1), y + 26, 40, s.color || '#FF9F66')
      add(node as any)
      add(new Text({ text: s.label, x: gap * (i + 1) - 40, y: y + 54, width: 80, textAlign: 'center',
        fontSize: 13, fill: '#6B7280' } as any))
    })
    return 100
  }

  return 0 // 无图示
}

function makeIcon(item: OptRender, size: number): any {
  if (item.image) {
    return new LeaferImage({ url: item.image, width: size, height: size, x: -size / 2, y: -size / 2 } as any)
  }
  if (item.shape) {
    return drawShape(item.shape, 0, 0, size, item.color || '#FF9F66')
  }
  // 默认 emoji（字体图形，非图片素材）
  return new Text({
    text: item.emoji || '▪️', fontSize: 34, x: -size / 2, y: -size / 2 + 6, width: size, textAlign: 'center',
  } as any)
}

/** 估算文字像素宽度（中文按 fontSize 计，英文/数字按约 0.55*fontSize 计） */
function estimateTextWidth(text: string, fontSize: number): number {
  let w = 0
  for (const ch of text) {
    w += /[一-龥]/.test(ch) ? fontSize : fontSize * 0.58
  }
  return w
}

/**
 * 构建选项卡片：宽度按内容自适应，并在 maxW 内限制；整体高度与图标协调。
 * 卡片结构（从左到右）：【A/B/C 序号小圆点】[+ 图形] + 文字
 */
function buildOptionCard(item: OptRender, idx: number, box: { x: number; y: number; w: number; h: number }, S: number = 1): Group {
  const padX = 16 * S
  const hasIcon = !!(item.emoji || item.image || item.shape)
  const iconSize = 36 * S
  const fontSize = Math.round(16 * S)
  const badgeSize = 22 * S
  const badgeGap = 10 * S

  // 卡片宽 = 内容（已由 render() 用 maxContentW 算好，box.w 即为统一列宽）+ 居中
  const cardW = box.w
  const cardH = box.h

  const g = new Group({ x: box.x, y: box.y, draggable: false, cursor: 'pointer' } as any)
  const card = new Rect({
    width: cardW, height: cardH, fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: Math.max(1.5, 2 * S), cornerRadius: Math.max(8, 14 * S),
  } as any)

  // 序号 A/B/C 圆点（暖橘色，醒目）
  const badge = new Ellipse({
    x: padX, y: cardH / 2 - badgeSize / 2,
    width: badgeSize, height: badgeSize,
    fill: '#FFEDD5', stroke: '#FB923C', strokeWidth: Math.max(1, 1.5 * S),
  } as any)
  const badgeText = new Text({
    text: String.fromCharCode(65 + idx), // A=65, B=66...
    x: padX, y: cardH / 2 - badgeSize / 2,
    width: badgeSize, height: badgeSize,
    fontSize: Math.round(13 * S), fontWeight: '700', fill: '#C2410C',
    textAlign: 'center', verticalAlign: 'middle',
  } as any)

  // 内容起点：序号右边缘 + 间距
  const contentStartX = padX + badgeSize + badgeGap
  const icon = hasIcon ? makeIcon(item, iconSize) : null
  if (icon) { icon.x = contentStartX + iconSize / 2; icon.y = cardH / 2 }

  const labelX = contentStartX + (hasIcon ? iconSize + 10 * S : 0)
  const labelW = Math.max(40 * S, cardW - labelX - padX)
  const label = new Text({
    text: item.label,
    fontSize, fontWeight: '600', fill: '#374151',
    x: labelX,
    y: 0, width: labelW, height: cardH,
    textAlign: 'left', verticalAlign: 'middle',
  } as any)

  g.add(card as any)
  g.add(badge as any)
  g.add(badgeText as any)
  if (icon) g.add(icon as any)
  g.add(label as any)

  const paint = (fill: string, stroke: string) => { (card as any).fill = fill; (card as any).stroke = stroke }
  g.on('tap', () => onPick(item, paint))
  g.on('pointer.over', () => { if (!locked.value && !props.disabled) paint('#FFF7F0', '#FF9F66') })
  g.on('pointer.out', () => { if (!locked.value) paint('#FFFFFF', '#E5E7EB') })
  return g
}

function onPick(item: OptRender, paint: (f: string, s: string) => void) {
  if (locked.value || props.disabled) return
  locked.value = true
  const correct = item.value === props.question.answer
  // userAnswer 传用户选中的选项 label，存到错题本可以显示「你答 X」而不是占位符
  if (correct) { paint('#DCFCE7', '#22C55E'); emit('result', true, item.value) }
  else { paint('#FEE2E2', '#EF4444'); emit('result', false, item.value) }
}

function render() {
  if (!stage.value) return
  // 画布实际像素宽度（CSS px），坐标系 = 实际像素（不再做内部缩放）
  const W = stage.value.actualWidth ?? 360
  // 整体缩放系数 —— 把"按 360 设计的图示"等比放大到画布实际宽度
  const S = W / 360
  stage.value.clear()
  const add: (n: any) => void = (n) => stage.value!.add(n)

  const padY = 12 * S
  // 题干图示与选项卡片之间的安全间隙（防文字下沉/被遮）
  const diagGap = 16 * S

  // 题干图示：用 Group 整体缩放，内部代码 100% 沿用 360 坐标系（无需逐处改字号/间距）
  // wrapGroup 收集 buildDiagram 的所有节点，做 scaleX=scaleY=S 后整体放进画布
  const diagramNodes: any[] = []
  const diagAdd = (n: any) => { diagramNodes.push(n) }
  const diagH = buildDiagram(diagAdd, 360, padY / S) || 0
  if (diagramNodes.length > 0) {
    const dg = new Group({ x: 0, y: padY, scaleX: S, scaleY: S, overflow: 'visible' } as any)
    diagramNodes.forEach(n => dg.add(n))
    add(dg as any)
  }
  // 扫描所有图示子节点的实际底边，按"最远一个"作为真实高度（避免依赖 draw 函数返回值被低估）
  let maxBottom = diagH
  for (const n of diagramNodes) {
    const ny = (n as any).y ?? 0
    let nh = 0
    if (typeof (n as any).height === 'number') nh = (n as any).height
    else if (typeof (n as any).fontSize === 'number') nh = (n as any).fontSize * 1.4
    if (ny + nh > maxBottom) maxBottom = ny + nh
  }
  const diagStartY = padY
  const diagRealH = maxBottom * S + 4 * S // 加 4px 兜底

  // 列数规则：4 个及以下 → 单列（每行一个，文字不换行 + 整组视觉清爽），
  // 5~6 个 → 2 列，7+ 个 → 3 列
  const opts = buildOptions()
  const cols = opts.length <= 4 ? 1 : (opts.length <= 6 ? 2 : 3)
  const gapX = 14 * S, gapY = 12 * S
  const cardH = 60 * S

  // 单列时整行撑满画布（减去左右留白），文字永远不会换行；
  // 多列时按内容自适应取最大列宽，整组居中。
  const sidePad = 12 * S
  const fullRowW = W - 2 * sidePad
  const padXCard = 16 * S
  const iconSize = 36 * S
  const fontSize = Math.round(16 * S)
  const badgeSize = 22 * S
  const badgeGap = 10 * S
  let maxContentW = 0
  for (const o of opts) {
    const hasIcon = !!(o.emoji || o.image || o.shape)
    const textW = estimateTextWidth(o.label, fontSize)
    const innerW = badgeSize + badgeGap
      + (hasIcon ? iconSize + 10 * S : 0)
      + textW
    const cardW = Math.max(
      120 * S,
      Math.min(360 * S, innerW + 2 * padXCard)
    )
    maxContentW = Math.max(maxContentW, cardW)
  }
  const colW = cols === 1 ? fullRowW : maxContentW
  const groupW = cols * colW + (cols - 1) * gapX
  const startX = cols === 1 ? sidePad : Math.max(8 * S, (W - groupW) / 2)

  const optStartY = diagStartY + diagRealH + diagGap
  const rows = Math.ceil(opts.length / cols)
  opts.forEach((o, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const x = startX + c * (colW + gapX)
    const y = optStartY + r * (cardH + gapY)
    add(buildOptionCard(o, i, { x, y, w: colW, h: cardH }, S) as any)
  })

  // 容器总高 = 图示 + 选项 + 底部留白
  const optBottom = optStartY + (rows - 1) * (cardH + gapY) + cardH
  const needed = optBottom + padY
  contentHeight.value = Math.max(MIN_HEIGHT * S, Math.round(needed))
  // 主动同步画布高度（LeaferStage watch 也兜底）
  if (typeof stage.value?.syncHeight === 'function') stage.value.syncHeight(contentHeight.value)
}

// stage 实例就绪（LeaferStage onMounted 后 emit('ready')）即首次渲染
watch(
  () => stage.value,
  (s) => { if (s) render() },
  { immediate: true }
)

// 容器宽度变化或切题时重渲染
watch(
  () => [stage.value?.actualWidth, props.question],
  () => { locked.value = false; if (stage.value) render() },
  { immediate: true }
)
</script>

<template>
  <LeaferStage ref="stage" width="100%" :height="contentHeight" background="#FFFFFF" @ready="render" />
</template>
