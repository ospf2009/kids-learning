<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { rewards, achievements, getCurrentLevel, getNextLevel } from '@/data/rewards'
import { computed, ref } from 'vue'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref<'shop' | 'achievements' | 'badges'>('shop')

function goBack() { router.push('/') }
function redeemReward(reward: typeof rewards[0]) {
  if (userStore.redeemReward(reward.cost)) {
    alert('成功兑换：' + reward.name + '！')
  } else {
    alert('星星不够哦，继续学习赚取更多星星吧！')
  }
}

const levelInfo = computed(() => {
  const current = getCurrentLevel(userStore.stars)
  const next = getNextLevel(userStore.stars)
  return { current, next }
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">&larr; 返回</button>
      <h1>奖励中心</h1>
    </div>

    <!-- 星星余额 + 等级 -->
    <div class="balance-card">
      <div class="balance-icon">&#x2605;</div>
      <div class="balance-body">
        <span class="balance-num">{{ userStore.stars }}</span>
        <span class="balance-label">星星</span>
      </div>
      <div class="level-pill">{{ levelInfo.current?.icon }} {{ levelInfo.current?.name }}</div>
    </div>

    <div class="level-section" v-if="levelInfo.next">
      <div class="level-row">
        <span>{{ levelInfo.current?.icon }} {{ levelInfo.current?.name }}</span>
        <span>{{ levelInfo.next?.icon }} {{ levelInfo.next?.name }}</span>
      </div>
      <div class="progress-bar"><div class="fill" :style="{ width: userStore.levelProgress + '%' }"></div></div>
      <p class="level-hint">还需 {{ levelInfo.next.minStars - userStore.stars }}&#x2605; 升级</p>
    </div>

    <!-- 标签 -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'shop' }" @click="activeTab = 'shop'">商店</button>
      <button class="tab" :class="{ active: activeTab === 'achievements' }" @click="activeTab = 'achievements'">成就</button>
      <button class="tab" :class="{ active: activeTab === 'badges' }" @click="activeTab = 'badges'">徽章</button>
    </div>

    <!-- 商店 -->
    <div v-if="activeTab === 'shop'" class="reward-grid">
      <div v-for="r in rewards" :key="r.id" class="reward-card" :class="{ affordable: userStore.stars >= r.cost }">
        <div class="rc-icon">{{ r.icon }}</div>
        <div class="rc-name">{{ r.name }}</div>
        <div class="rc-desc">{{ r.description }}</div>
        <div class="rc-cost">&#x2605; {{ r.cost }}</div>
        <button class="rc-btn" :disabled="userStore.stars < r.cost" @click="redeemReward(r)">
          {{ userStore.stars >= r.cost ? '兑换' : '星星不足' }}
        </button>
      </div>
    </div>

    <!-- 成就 -->
    <div v-if="activeTab === 'achievements'" class="ach-list">
      <div v-for="a in achievements" :key="a.id" class="ach-card" :class="{ done: userStore.achievements.includes(a.id) }">
        <div class="ach-icon" :style="{ opacity: userStore.achievements.includes(a.id) ? 1 : 0.4 }">{{ a.icon }}</div>
        <div class="ach-body">
          <div class="ach-name">{{ a.name }}</div>
          <div class="ach-desc">{{ a.description }}</div>
          <div class="ach-cond">{{ a.condition }}</div>
        </div>
        <div class="ach-status">{{ userStore.achievements.includes(a.id) ? '&#x2714;' : '&#x2605; ' + a.reward }}</div>
      </div>
    </div>

    <!-- 徽章 -->
    <div v-if="activeTab === 'badges'">
      <div v-if="userStore.badges.length === 0" class="empty-state">
        <div class="empty-icon">&#x1F4ED;</div>
        <p>还没有徽章，去商店兑换吧</p>
      </div>
      <div v-else class="badge-grid">
        <div v-for="b in userStore.badges" :key="b" class="badge-item">{{ b }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding-bottom: var(--space-8); animation: fadeInUp 0.3s ease; }
.page-header h1 { font-size: var(--font-size-lg); }

/* 余额卡片 */
.balance-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
}
.balance-icon { font-size: 36px; }
.balance-body { flex: 1; }
.balance-num { display: block; font-size: var(--font-size-2xl); font-weight: 800; color: #D97706; line-height: 1; }
.balance-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.level-pill { padding: 6px 14px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 600; }

/* 等级进度 */
.level-section { margin-bottom: var(--space-5); }
.level-row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 8px; }
.progress-bar { height: 6px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg, #F59E0B, #D97706); transition: width 0.5s ease; }
.level-hint { text-align: center; font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px; }

/* 标签 */
.tabs { display: flex; gap: 8px; margin-bottom: var(--space-5); }
.tab {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: white;
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.tab.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

/* 商店 */
.reward-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.reward-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
  transition: all 0.2s;
}
.reward-card.affordable { border-color: #FDE68A; background: #FFFBEB; }
.reward-card:hover { box-shadow: var(--shadow-sm); }
.rc-icon { font-size: 32px; margin-bottom: 6px; }
.rc-name { font-size: var(--font-size-sm); font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.rc-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: 6px; }
.rc-cost { font-size: var(--font-size-md); font-weight: 700; color: #D97706; margin-bottom: 8px; }
.rc-btn {
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  background: var(--bg-input);
  color: var(--text-primary);
  transition: all 0.2s;
}
.reward-card.affordable .rc-btn { background: var(--color-primary); color: white; }
.reward-card.affordable .rc-btn:hover { background: var(--color-primary-light); }
.rc-btn:disabled { opacity: 0.5; cursor: default; }

/* 成就 */
.ach-list { display: flex; flex-direction: column; gap: 8px; }
.ach-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.ach-card.done { background: #FFFBEB; border-color: #FDE68A; }
.ach-icon { font-size: 28px; width: 40px; text-align: center; }
.ach-body { flex: 1; }
.ach-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.ach-desc { font-size: var(--font-size-xs); color: var(--text-secondary); }
.ach-cond { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; }
.ach-status { font-size: var(--font-size-md); color: #D97706; }

/* 徽章 */
.empty-state { text-align: center; padding: var(--space-12) 0; }
.empty-icon { font-size: 48px; margin-bottom: var(--space-3); }
.empty-state p { color: var(--text-secondary); }
.badge-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.badge-item {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
</style>
