import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/chinese',
      name: 'chinese',
      component: () => import('@/views/chinese/ChineseHome.vue'),
    },
    {
      path: '/chinese/:lessonId',
      name: 'chinese-lesson',
      component: () => import('@/views/chinese/ChineseLesson.vue'),
    },
    {
      path: '/math',
      name: 'math',
      component: () => import('@/views/math/MathHome.vue'),
    },
    {
      path: '/math/:lessonId',
      name: 'math-lesson',
      component: () => import('@/views/math/MathLesson.vue'),
    },
    {
      path: '/english',
      name: 'english',
      component: () => import('@/views/english/EnglishHome.vue'),
    },
    {
      path: '/english/:lessonId',
      name: 'english-lesson',
      component: () => import('@/views/english/EnglishLesson.vue'),
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: () => import('@/views/RewardsView.vue'),
    },
  ],
})

export default router
