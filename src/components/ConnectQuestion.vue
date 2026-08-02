<script setup lang="ts">
/**
 * ConnectQuestion.vue —— 连线互动题
 * 画布左右各一列元素（如「汉字」连「拼音」）。
 * 交互：先点左侧一个，再点右侧一个，自动连一条线并判定该对是否正确。
 *   - 全部 pairs 都连对 → 判对
 *   - 任意一对连错     → 判错（连线变红，可点红线上「重连」按钮清除后重连）
 * 这里采用「逐对点击连线」的轻量交互，适合低龄儿童。
 */
import { ref, onMounted } from 'vue'
import type { Question, SceneItem, ConnectPair } from '@/data/chapters'
import { Group, Rect, Text, Line } from 'leafer-ui'
import LeaferStage from './LeaferStage.vue'

const props = defineProps<{
  question: Question
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'result', correct: boolean, userAnswer?: string): void
}>()

const stage = ref<InstanceType<typeof LeaferStage> | null>(null)
const locked = ref(false)
const correctPairs = ref(0)

let pendingLeft: SceneItem | null = null
const pairs: ConnectPair[] = []

interface NodeState { group: Group; item: SceneItem; circle: Rect }
const leftNodes: NodeState[] = []
const rightNodes: NodeState[] = []

function buildNode(item: SceneItem, x: number, y: number, size = 64): Group {
  const g = new Group({ x, y, cursor: 'pointer' } as any)
  const circle = new Rect({
    width: size, height: size, x: -size / 2, y: -size / 2,
    fill: '#EFF6FF', stroke: '#BFDBFE', strokeWidth: 2, cornerRadius: 16,
  } as any)
  const emoji = new Text({
    text: item.emoji || '▪️', fontSize: 28,
    x: -size / 2, y: -size / 2 + 6, width: size, align: 'center',
  } as any)
  const label = new Text({
    text: item.label, fontSize: 13, fill: '#1E3A8A',
    x: -size / 2, y: size / 2 - 16, width: size, align: 'center',
  } as any)
  g.add(circle as any)
  g.add(emoji as any)
  g.add(label as any)
  return g
}

function centerOf(item: SceneItem): { x: number; y: number } {
  return { x: item.x, y: item.y }
}

function drawLine(a: SceneItem, b: SceneItem, color: string): Line {
  const pa = centerOf(a), pb = centerOf(b)
  return new Line({
    x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y,
    stroke: color, strokeWidth: 3,
  } as any)
}

onMounted(() => {
  const leafer = stage.value?.leafer
  if (!leafer) return
  pairs.push(...(props.question.scene?.pairs || []))

  // 渲染左列
  for (const p of pairs) {
    const g = buildNode(p.left, p.left.x, p.left.y)
    leafer.add(g as any)
    leftNodes.push({ group: g, item: p.left, circle: g.children()[0] as Rect })
    g.on('tap', () => onNodeTap(p.left, g))
  }
  // 渲染右列
  for (const p of pairs) {
    const g = buildNode(p.right, p.right.x, p.right.y)
    leafer.add(g as any)
    rightNodes.push({ group: g, item: p.right, circle: g.children()[0] as Rect })
    g.on('tap', () => onNodeTap(p.right, g))
  }
})

function onNodeTap(item: SceneItem, group: Group) {
  if (locked.value || props.disabled) return
  const isLeft = leftNodes.some(n => n.item.id === item.id)

  if (isLeft) {
    if (pendingLeft && pendingLeft.id === item.id) {
      // 取消选择
      pendingLeft = null
      ;(group.children()[0] as any).stroke = '#BFDBFE'
      return
    }
    // 高亮选中的左侧节点
    leftNodes.forEach(n => { if (n.item.id !== item.id) (n.circle as any).stroke = '#BFDBFE' })
    pendingLeft = item
    ;(group.children()[0] as any).stroke = '#3B82F6'
    return
  }

  // 点击右侧：必须有已选左侧
  if (!pendingLeft) return
  const left = pendingLeft
  const pair = pairs.find(p => p.left.id === left.id && p.right.id === item.id)
  pendingLeft = null
  ;(leftNodes.find(n => n.item.id === left.id)?.circle as any).stroke = '#BFDBFE'

  if (pair) {
    const line = drawLine(left, item, '#22C55E')
    stage.value?.leafer?.add(line as any)
    correctPairs.value++
    if (correctPairs.value >= pairs.length) {
      locked.value = true
      // 连线题：把每对连线用 「左→右」 拼起来
      const summary = pairs.map(p => `${p.left.label}→${p.right.label}`).join('、')
      emit('result', true, summary)
    }
  } else {
    const line = drawLine(left, item, '#EF4444')
    stage.value?.leafer?.add(line as any)
    locked.value = true
    // 错误的那对：左 label → 右 label
    emit('result', false, `${left.label}→${item.label}`)
  }
}
</script>

<template>
  <LeaferStage ref="stage" width="100%" :height="340" background="#FFFFFF" />
</template>
