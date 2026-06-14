<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'

const route = useRoute()
const userStore = useUserStore()

onMounted(() => {
  userStore.loadFromLocalStorage()
  userStore.initDailyTasks()
})
</script>

<template>
  <div class="app-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="cloud cloud-1">☁️</div>
      <div class="cloud cloud-2">☁️</div>
      <div class="star star-1">⭐</div>
      <div class="star star-2">✨</div>
      <div class="star star-3">⭐</div>
    </div>

    <!-- 主内容 -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.cloud {
  position: absolute;
  font-size: 48px;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.cloud-1 {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.cloud-2 {
  top: 20%;
  right: 10%;
  animation-delay: 2s;
}

.star {
  position: absolute;
  font-size: 24px;
  opacity: 0.4;
  animation: twinkle 3s ease-in-out infinite;
}

.star-1 {
  top: 15%;
  right: 20%;
  animation-delay: 0s;
}

.star-2 {
  top: 30%;
  left: 15%;
  animation-delay: 1s;
}

.star-3 {
  bottom: 20%;
  right: 25%;
  animation-delay: 2s;
}

.main-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(10px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.2); }
}
</style>
