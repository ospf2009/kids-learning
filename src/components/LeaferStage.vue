<script setup lang="ts">
/**
 * LeaferStage.vue
 * 通用画布容器：所有互动题（tap/drag/connect/choice 等）共用一个 Leafer 实例。
 * 切题时调用 clear() 清掉上一题的图形，再 add 新题，避免重复创建画布。
 *
 * 自适应（width="100%"）：
 *   - 画布逻辑宽度 = 真实显示宽度（actualWidth），位图按 actualWidth × dpr 渲染 → 清晰
 *   - 内容坐标直接使用 actualWidth（CSS 像素），无需在内部做 scale 缩放；
 *     子组件按 actualWidth 计算坐标即可自然撑满画布，无错位、无超界
 *   - 画布高度 = props.height（外部通过 syncHeight 动态调整），与外层容器高度精确对齐
 *
 * 用法：
 *   <LeaferStage ref="stage" width="100%" :height="360" />
 *   stage.value?.clear()
 *   stage.value?.add(node)
 *   const leafer = stage.value?.leafer
 */
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Leafer, Rect, Group, type Leafer as ILeafer } from 'leafer-ui'

const props = withDefaults(
  defineProps<{
    width?: number | string
    height?: number
    background?: string
  }>(),
  { width: 360, height: 360, background: '#FFFFFF' }
)

const emit = defineEmits<{
  (e: 'ready', leafer: ILeafer): void
}>()

const container = ref<HTMLDivElement | null>(null)
const _rawLeafer = ref<ILeafer | null>(null)
const designGroup = ref<any>(null)
let ro: ResizeObserver | null = null

const leafer = computed<ILeafer | null>(() => _rawLeafer.value)

const isResponsive = computed(() => typeof props.width === 'string')
/** 容器实际像素宽度（响应式时取父容器宽并clamp，非响应式时取 props.width） */
const actualWidth = computed(() => {
  if (!isResponsive.value) return props.width as number
  const w = container.value?.clientWidth || 360
  return Math.max(280, Math.min(720, Math.round(w)))
})
const cssHeight = computed(() => Math.round(props.height))
const cssWidthStyle = computed(() =>
  isResponsive.value ? '100%' : (props.width as number) + 'px'
)

/** 清除 Leafer 自动创建 canvas 上可能残留的 transform（本方案不使用 CSS 缩放） */
function clearCanvasTransform() {
  const cv = container.value?.querySelector('canvas')
  if (cv) { cv.style.transform = 'none'; cv.style.position = 'static' }
}

function createLeafer() {
  if (!container.value) return
  _rawLeafer.value?.destroy()
  _rawLeafer.value = null
  designGroup.value = null

  const w = actualWidth.value
  const h = props.height

  _rawLeafer.value = new Leafer({
    view: container.value,
    width: w,
    height: h,
    fill: props.background,
  } as any)

  // 背景层（用于清屏时识别），按真实显示尺寸
  // ⚠️ 必须先添加背景，再添加设计组 —— Leafer 的 z-order 是后添加的在上层
  const bg = new Rect({
    tag: 'background',
    width: w,
    height: h,
    fill: props.background,
  } as any)
  _rawLeafer.value.add(bg as any)

  // 设计组：作为题目内容的容器（不缩放、不偏移；坐标 = 实际像素）
  const dg = new Group({ overflow: 'visible' } as any)
  designGroup.value = dg
  // 设计组后添加 → 渲染在背景之上
  _rawLeafer.value.add(dg as any)

  clearCanvasTransform()
  emit('ready', _rawLeafer.value as ILeafer)
}

/** 清空画布所有内容节点（保留背景层与设计层） */
function clear() {
  if (designGroup.value) {
    const children = [...designGroup.value.children]
    for (const c of children) c.remove()
  }
}

/** 向画布添加节点（自动进入设计层） */
function add(node: any) {
  if (designGroup.value) designGroup.value.add(node)
  else _rawLeafer.value?.add(node)
}

function rebuildOnResize() {
  if (!isResponsive.value || !container.value) return
  const newW = actualWidth.value
  if (_rawLeafer.value && (_rawLeafer.value as any).width !== newW) {
    ;(_rawLeafer.value as any).width = newW
    const bg = _rawLeafer.value.children.find((c: any) => c.tag === 'background')
    if (bg) { (bg as any).width = newW }
  }
}

onMounted(() => {
  createLeafer()
  if (isResponsive.value && container.value) {
    ro = new ResizeObserver(() => rebuildOnResize())
    ro.observe(container.value)
  }
})

/** 同步更新画布视口高度（外部根据内容动态调整 height 时调用） */
function syncHeight(newH: number) {
  if (!_rawLeafer.value) return
  ;(_rawLeafer.value as any).height = newH
  const bg = _rawLeafer.value.children.find((c: any) => c.tag === 'background')
  if (bg) { (bg as any).height = newH }
}
watch(
  () => props.height,
  (h) => { if (_rawLeafer.value) syncHeight(h) }
)

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
  _rawLeafer.value?.destroy()
  _rawLeafer.value = null
})

defineExpose({ leafer, clear, add, actualWidth, syncHeight })
</script>

<template>
  <div ref="container" class="leafer-stage"
       :style="{ width: cssWidthStyle, height: cssHeight + 'px' }"></div>
</template>

<style scoped>
.leafer-stage {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin: 0 auto;
  touch-action: none; /* 防止移动端拖动时页面滚动 */
}
/* Leafer 自动创建 canvas：宽高 = leafer.width × leafer.height = 真实显示尺寸 × dpr，
   不再用 CSS transform 二次拉伸（位图本身已是清晰分辨率，CSS 缩放只会变模糊）。 */
.leafer-stage :deep(canvas.leafer-canvas-view) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
