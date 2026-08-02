<script setup lang="ts">
/**
 * TapQuestion.vue —— 点击互动题
 * 在 Leafer 画布上渲染若干图文元素，孩子点击「正确目标」即完成。
 * 支持两种判定：
 *   - 全部 isAnswer 元素都被点击，且未点错  → 正确
 *   - 点击了任意非答案元素                  → 立即判错（不阻塞，可继续点到对）
 * 这里采用「点错即错、点全对即对」的交互，最终通过 emit('result', correct) 上报。
 */
import { ref, onMounted } from 'vue'
import type { Question, SceneItem } from '@/data/chapters'
import { Group, Rect, Text, Ellipse } from 'leafer-ui'
import LeaferStage from './LeaferStage.vue'

const props = defineProps<{
  question: Question
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'result', correct: boolean, userAnswer?: string): void
}>()

const stage = ref<InstanceType<typeof LeaferStage> | null>(null)
const answered = ref<string[]>([])          // 已点击的正确元素 id
const wrongTapped = ref(false)              // 是否点过错的
const locked = ref(false)                   // 已判分锁定

function buildCard(item: SceneItem, size = 76): Group {
  const g = new Group({
    x: item.x,
    y: item.y,
    draggable: false,
    cursor: 'pointer',
  } as any)

  const circle = new Ellipse({
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
    fontSize: 34,
    x: -size / 2,
    y: -size / 2 + 8,
    width: size,
    align: 'center',
  } as any)

  const label = new Text({
    text: item.label,
    fontSize: 12,
    fill: '#8A6D5B',
    x: -size / 2,
    y: size / 2 - 18,
    width: size,
    align: 'center',
  } as any)

  g.add(circle as any)
  g.add(emoji as any)
  g.add(label as any)

  g.on('tap', () => onTap(item, circle))
  g.on('pointer.over', () => { (circle as any).stroke = '#FF9F66' })
  g.on('pointer.out', () => { if (!answered.value.includes(item.id)) (circle as any).stroke = '#FFD6B0' })

  return g
}

function onTap(item: SceneItem, circle: Ellipse) {
  if (locked.value || props.disabled) return
  if (item.isAnswer) {
    if (!answered.value.includes(item.id)) {
      answered.value.push(item.id)
      ;(circle as any).fill = '#DCFCE7'
      ;(circle as any).stroke = '#22C55E'
    }
    const all = (props.question.scene?.items || []).filter(i => i.isAnswer)
    if (all.length > 0 && all.every(i => answered.value.includes(i.id))) {
      locked.value = true
      // 上报用户实际点了哪些元素（用 item label 拼接，方便错题本展示）
      emit('result', true, answered.value.map(id => {
        const it = (props.question.scene?.items || []).find(i => i.id === id)
        return it?.label || id
      }).join('、'))
    }
  } else {
    wrongTapped.value = true
    ;(circle as any).fill = '#FEE2E2'
    ;(circle as any).stroke = '#EF4444'
    locked.value = true
    // 错答上报：点错的元素 label
    emit('result', false, item.label)
  }
}

onMounted(() => {
  const leafer = stage.value?.leafer
  if (!leafer) return
  const items = props.question.scene?.items || []
  for (const it of items) {
    leafer.add(buildCard(it) as any)
  }
})
</script>

<template>
  <LeaferStage ref="stage" width="100%" :height="300" background="#FFFFFF" />
</template>
