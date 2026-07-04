<template>
  <span class="material-icon" :style="sizeStyle" :title="title">{{ iconName }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  title?: string
}>(), {
  size: 'md',
})

const iconName = computed(() => props.name)

const sizeMap: Record<string, string> = {
  sm: '18px',
  md: '24px',
  lg: '32px',
  xl: '48px',
}

const sizeStyle = computed(() => {
  if (typeof props.size === 'number') {
    return { fontSize: `${props.size}px` }
  }
  return { fontSize: sizeMap[props.size] || '24px' }
})
</script>

<style scoped>
.material-icon {
  font-family: 'Material Icons Round';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
  vertical-align: middle;
  user-select: none;
}
</style>
