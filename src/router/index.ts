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

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
    // 确保 Pinia 已激活
    const authStore = useAuthStore()

    // 如果还没有恢复会话，先恢复
    if (!authStore.currentUser && localStorage.getItem('kids-learning-current-user')) {
      await authStore.restoreSession()
    }

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else if ((to.name === 'login' || to.name === 'register') && authStore.isLoggedIn) {
      next('/')
    } else {
      next()
    }
  } catch (e) {
    window.__kidsErrors = window.__kidsErrors || []
    const msg = e instanceof Error ? e.message : String(e)
    window.__kidsErrors.push({ msg: '[Router guard] ' + msg })
    next()  // 出错时放行
  }
})

export default router
