import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    // 认证页面
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
    },
    // 个人中心
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/profile/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    // 章节练习
    {
      path: '/practice/:subject',
      name: 'subject-practice',
      component: () => import('@/views/practice/SubjectPractice.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/practice/:subject/:chapterId',
      name: 'chapter-practice',
      component: () => import('@/views/practice/ChapterPractice.vue'),
      meta: { requiresAuth: true },
    },
    // 错题本
    {
      path: '/wrong-book',
      name: 'wrong-book',
      component: () => import('@/views/wrongbook/WrongBookView.vue'),
      meta: { requiresAuth: true },
    },
    // 错题复习
    {
      path: '/wrong-book/review',
      name: 'wrong-book-review',
      component: () => import('@/views/wrongbook/WrongBookReview.vue'),
      meta: { requiresAuth: true },
    },
    // 每日挑战
    {
      path: '/daily-challenge',
      name: 'daily-challenge',
      component: () => import('@/views/challenge/DailyChallengeView.vue'),
      meta: { requiresAuth: true },
    },
    // 兼容旧路由
    {
      path: '/subject/:subject',
      redirect: (to) => ({ path: `/practice/${to.params.subject}` }),
    },
    {
      path: '/subject/:subject/:chapterId',
      redirect: (to) => ({ path: `/practice/${to.params.subject}/${to.params.chapterId}` }),
    },
    // 游戏和奖励
    {
      path: '/rewards',
      name: 'rewards',
      component: () => import('@/views/RewardsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/games',
      name: 'games',
      component: () => import('@/views/GamesView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 路由守卫 — 轻量快速，不等待异步操作
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const saved = localStorage.getItem('kids-learning-current-user')

  // 需要登录但未登录
  if (to.meta.requiresAuth && !authStore.currentUser && !saved) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录但 currentUser 未恢复 → 异步恢复（不阻塞跳转）
  if (!authStore.currentUser && saved) {
    authStore.restoreSession().catch(() => {})
  }

  // 已登录状态下避免进入登录页
  if ((to.name === 'login' || to.name === 'register') && authStore.currentUser) {
    next('/')
    return
  }

  next()
})

export default router
