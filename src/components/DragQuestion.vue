<script setup lang="ts">
/**
 * DragQuestion.vue —— 拖拽归类互动题
 * 画布上散落若干可拖拽元素（emoji+文字），下方有目标放置区。
 * 孩子把元素拖进「接受它的目标区」即完成匹配：
 *   - 全部 acceptIds 元素都落入正确目标区 → 判对
 *   - 落入错误目标区 → 判错（元素弹回原位，可重试）
 */
import { ref, onMounted } from 'vue'
import type { Question, SceneItem, DragTarget } from '@/data/chapters'
import { Group, Rect, Text } from 'leafer-ui'
import LeaferStage from './LeaferStage.vue'

const props = defineProps<{
  question: Question
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'result', correct: boolean, userAnswer?: string): void
}>()

const stage = ref<InstanceType<typeof LeaferStage> | null>(null)
const placed = ref<string[]>([])   // 已正确放入目标区的元素 id
const locked = ref(false)

interface DragState {
  group: Group
  item: SceneItem
  homeX: number
  homeY: number
  circle: Rect
}

const drags: DragState[] = []

function buildTarget(t: DragTarget, w = 150, h = 64): Group {
  const g = new Group({ x: t.x, y: t.y } as any)
  const box = new Rect({
    width: w,
    height: h,
    fill: '#F1F5F9',
    stroke: '#CBD5E1',
    strokeWidth: 2,
    cornerRadius: 14,
    dashPattern: [6, 6],
  } as any)
  const label = new Text({
    text: t.emoji ? `${t.emoji} ${t.label}` : t.label,
    fontSize: 15,
    fill: '#64748B',
    x: 0,
    y: h / 2 - 9,
    width: w,
    align: 'center',
  } as any)
  g.add(box as any)
  g.add(label as any)
  return g
}

function buildItem(item: SceneItem, size = 64): Group {
  const g = new Group({
    x: item.x,
    y: item.y,
    draggable: true,
    cursor: 'move',
  } as any)

  const circle = new Rect({
    width: size,
    height: size,
    x: -size / 2,
    y: -size / 2,
    fill: '#FFF7F0',
    stroke: '#FFD6B0',
    strokeWidth: 2,
    cornerRadius: 16,
  } as any)

  const emoji = new Text({
    text: item.emoji || '▪️',
    fontSize: 30,
    x: -size / 2,
    y: -size / 2 + 6,
    width: size,
    align: 'center',
  } as any)

  const label = new Text({
    text: item.label,
    fontSize: 11,
    fill: '#8A6D5B',
    x: -size / 2,
    y: size / 2 - 16,
    width: size,
    align: 'center',
  } as any)

  g.add(circle as any)
  g.add(emoji as any)
  g.add(label as any)
  return g
}

function hitTarget(x: number, y: number): DragTarget | null {
  const targets = props.question.scene?.targets || []
  for (const t of targets) {
    const tw = 150, th = 64
    if (x >= t.x && x <= t.x + tw && y >= t.y && y <= t.y + th) return t
  }
  return null
}

onMounted(() => {
  const leafer = stage.value?.leafer
  if (!leafer) return
  const scene = props.question.scene

  for (const t of scene?.targets || []) {
    leafer.add(buildTarget(t) as any)
  }
  for (const it of scene?.items || []) {
    const g = buildItem(it)
    leafer.add(g as any)
    const state: DragState = { group: g, item: it, homeX: it.x, homeY: it.y, circle: g.children()[0] as Rect }
    drags.push(state)

    g.on('dragend', () => {
      if (locked.value || props.disabled) {
        g.set({ x: state.homeX, y: state.homeY })
        return
      }
      const t = hitTarget(g.x, g.y)
      if (t && t.acceptIds.includes(it.id)) {
        // 命中正确目标
        placed.value.push(it.id)
        ;(state.circle as any).fill = '#DCFCE7'
        ;(state.circle as any).stroke = '#22C55E'
        g.set({ draggable: false, cursor: 'default' })
        const allItems = (scene?.items || []).filter(i => true)
        const allTargets = scene?.targets || []
        const totalNeeded = allTargets.reduce((s, tt) => s + tt.acceptIds.length, 0)
        if (placed.value.length >= totalNeeded) {
          locked.value = true
          // 上报用户实际拖了哪些元素（用 item label 拼接）
          emit('result', true, placed.value.map(id => {
            const it2 = (scene?.items || []).find(i => i.id === id)
            return it2?.label || id
          }).join('、'))
        }
      } else {
        // 放错或没放进任何区 → 弹回
        g.set({ x: state.homeX, y: state.homeY })
        if (t) {
          // 拖进了错误的目标区 → 判错
          locked.value = true
          // 上报：拖错的元素 + 错误的目标区 label
          emit('result', false, `${it.label}→${t.label}`)
        }
      }
    })
  }
})
</script>

<template>
  <LeaferStage ref="stage" width="100%" :height="340" background="#FFFFFF" />
</template>
