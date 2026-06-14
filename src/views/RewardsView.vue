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
    alert(`🎉 成功兑换：${reward.name}！`)
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
  <div class="rewards-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>🏆 奖励中心</h1>
    </header>

    <!-- 星星余额 -->
    <div class="balance-card">
      <div class="balance-icon">⭐</div>
      <div class="balance-info">
        <div class="balance-count">{{ userStore.stars }}</div>
        <div class="balance-label">我的星星</div>
      </div>
      <div class="level-badge">
        {{ levelInfo.current?.icon }} {{ levelInfo.current?.name }}
      </div>
    </div>

    <!-- 等级进度 -->
    <div class="level-progress" v-if="levelInfo.next">
      <div class="level-info">
        <span>{{ levelInfo.current?.icon }} {{ levelInfo.current?.name }}</span>
        <span>{{ levelInfo.next?.icon }} {{ levelInfo.next?.name }}</span>
      </div>
      <div class="progress-bar">
        <div class="fill" :style="{ width: userStore.levelProgress + '%' }"></div>
      </div>
      <div class="progress-text">还差 {{ levelInfo.next.minStars - userStore.stars }} ⭐ 升级</div>
    </div>

    <!-- 标签页 -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'shop' }"
        @click="activeTab = 'shop'"
      >🛒 商店</button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'achievements' }"
        @click="activeTab = 'achievements'"
      >🎯 成就</button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'badges' }"
        @click="activeTab = 'badges'"
      >🏅 徽章</button>
    </div>

    <!-- 商店 -->
    <div class="tab-content" v-if="activeTab === 'shop'">
      <div class="rewards-grid">
        <div
          v-for="reward in rewards"
          :key="reward.id"
          class="reward-card"
          :class="{ affordable: userStore.stars >= reward.cost }"
        >
          <div class="reward-icon">{{ reward.icon }}</div>
          <div class="reward-name">{{ reward.name }}</div>
          <div class="reward-desc">{{ reward.description }}</div>
          <div class="reward-cost">
            ⭐ {{ reward.cost }}
          </div>
          <button
            class="btn btn-accent redeem-btn"
            :disabled="userStore.stars < reward.cost"
            @click="redeemReward(reward)"
          >
            {{ userStore.stars >= reward.cost ? '兑换' : '星星不足' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 成就 -->
    <div class="tab-content" v-if="activeTab === 'achievements'">
      <div class="achievements-list">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="achievement-card"
          :class="{ unlocked: userStore.achievements.includes(ach.id) }"
        >
          <div class="ach-icon">{{ ach.icon }}</div>
          <div class="ach-info">
            <div class="ach-name">{{ ach.name }}</div>
            <div class="ach-desc">{{ ach.description }}</div>
            <div class="ach-condition">条件：{{ ach.condition }}</div>
          </div>
          <div class="ach-reward">
            <span v-if="userStore.achievements.includes(ach.id)">✅</span>
            <span v-else>⭐ {{ ach.reward }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 徽章 -->
    <div class="tab-content" v-if="activeTab === 'badges'">
      <div class="badges-empty" v-if="userStore.badges.length === 0">
        <div class="empty-icon">🏅</div>
        <p>还没有徽章哦，去商店兑换吧！</p>
      </div>
      <div class="badges-grid" v-else>
        <div v-for="badge in userStore.badges" :key="badge" class="badge-item">
          {{ badge }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rewards-view { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-xl); }
.back-btn { background: var(--bg-card); border: 2px solid #EEE; border-radius: var(--radius-full); padding: 8px 16px; font-family: var(--font-family); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-normal); }
.back-btn:hover { background: #FFF9E6; border-color: var(--color-accent); }
.page-header h1 { font-size: var(--font-size-2xl); color: var(--color-accent); }

.balance-card { display: flex; align-items: center; gap: var(--space-lg); background: linear-gradient(135deg, #FFF9E6, #FFF3CC); border-radius: var(--radius-xl); padding: var(--space-xl); margin-bottom: var(--space-lg); box-shadow: var(--shadow-sm); }
.balance-icon { font-size: 48px; }
.balance-count { font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-accent); }
.balance-label { font-size: var(--font-size-sm); color: var(--text-secondary); }
.level-badge { margin-left: auto; padding: 8px 16px; background: var(--bg-card); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 600; box-shadow: var(--shadow-sm); }

.level-progress { margin-bottom: var(--space-xl); }
.level-info { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 8px; }
.progress-bar { height: 10px; background: #F0F0F0; border-radius: var(--radius-full); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), #FFD700); border-radius: var(--radius-full); transition: width 0.8s var(--bounce); }
.progress-text { text-align: center; font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px; }

.tabs { display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg); }
.tab-btn { flex: 1; padding: 10px; border: 2px solid #EEE; border-radius: var(--radius-full); background: var(--bg-card); font-family: var(--font-family); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-normal); }
.tab-btn.active { background: linear-gradient(135deg, var(--color-accent), #FFD700); border-color: var(--color-accent); color: var(--text-primary); }

.rewards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.reward-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-md); text-align: center; box-shadow: var(--shadow-sm); transition: all var(--transition-normal); border: 2px solid transparent; }
.reward-card.affordable { border-color: var(--color-accent); }
.reward-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.reward-icon { font-size: 36px; margin-bottom: 8px; }
.reward-name { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.reward-desc { font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 8px; }
.reward-cost { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent); margin-bottom: 8px; }
.redeem-btn { width: 100%; padding: 8px; font-size: var(--font-size-sm); }
.redeem-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.achievements-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.achievement-card { display: flex; align-items: center; gap: var(--space-md); background: var(--bg-card); border-radius: var(--radius-md); padding: var(--space-md); box-shadow: var(--shadow-sm); opacity: 0.6; transition: all var(--transition-normal); }
.achievement-card.unlocked { opacity: 1; background: linear-gradient(135deg, #FFF9E6, #FFF3CC); border: 2px solid var(--color-accent); }
.ach-icon { font-size: 32px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #F0F0F0; border-radius: var(--radius-md); }
.achievement-card.unlocked .ach-icon { background: #FFF3CC; }
.ach-info { flex: 1; }
.ach-name { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); }
.ach-desc { font-size: var(--font-size-xs); color: var(--text-secondary); }
.ach-condition { font-size: var(--font-size-xs); color: var(--text-light); }
.ach-reward { font-size: var(--font-size-lg); }

.badges-empty { text-align: center; padding: var(--space-2xl); }
.empty-icon { font-size: 64px; margin-bottom: var(--space-md); }
.badges-empty p { color: var(--text-secondary); }
.badges-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-md); }
.badge-item { width: 60px; height: 60px; background: linear-gradient(135deg, var(--color-accent), #FFD700); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: var(--shadow-sm); }
</style>
