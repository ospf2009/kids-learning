// 🏆 奖励系统数据
export interface Reward {
  id: string
  name: string
  icon: string
  description: string
  cost: number
  type: 'badge' | 'avatar' | 'theme' | 'decoration'
}

export interface Achievement {
  id: string
  name: string
  icon: string
  description: string
  condition: string
  reward: number
}

// 🏅 可兑换的奖励
export const rewards: Reward[] = [
  { id: 'r1', name: '小星星徽章', icon: '⭐', description: '闪闪发光的星星徽章', cost: 10, type: 'badge' },
  { id: 'r2', name: '小红花徽章', icon: '🌸', description: '漂亮的小红花', cost: 15, type: 'badge' },
  { id: 'r3', name: '金太阳徽章', icon: '🌞', description: '灿烂的金太阳', cost: 20, type: 'badge' },
  { id: 'r4', name: '彩虹徽章', icon: '🌈', description: '七彩的彩虹', cost: 25, type: 'badge' },
  { id: 'r5', name: '皇冠徽章', icon: '👑', description: '闪闪的皇冠', cost: 30, type: 'badge' },
  { id: 'r6', name: '火箭徽章', icon: '🚀', description: '飞向太空的火箭', cost: 40, type: 'badge' },
  { id: 'r7', name: '可爱熊猫头像', icon: '🐼', description: '萌萌的熊猫头像', cost: 50, type: 'avatar' },
  { id: 'r8', name: '太空主题', icon: '🌌', description: '神秘的太空背景', cost: 60, type: 'theme' },
  { id: 'r9', name: '海底世界主题', icon: '🐠', description: '美丽的海底背景', cost: 60, type: 'theme' },
  { id: 'r10', name: '花园装饰', icon: '🌷', description: '花园背景装饰', cost: 35, type: 'decoration' },
]

// 🎯 成就列表
export const achievements: Achievement[] = [
  { id: 'ach1', name: '初次尝试', icon: '🌱', description: '完成第一道题目', condition: '完成1题', reward: 5 },
  { id: 'ach2', name: '小试牛刀', icon: '📝', description: '完成10道题目', condition: '完成10题', reward: 10 },
  { id: 'ach3', name: '语文小达人', icon: '📖', description: '语文全部完成', condition: '语文全通', reward: 20 },
  { id: 'ach4', name: '数学小天才', icon: '🔢', description: '数学全部完成', condition: '数学全通', reward: 20 },
  { id: 'ach5', name: '英语小达人', icon: '🔤', description: '英语全部完成', condition: '英语全通', reward: 20 },
  { id: 'ach6', name: '全科学霸', icon: '🏆', description: '三科全部完成', condition: '全科通关', reward: 50 },
  { id: 'ach7', name: '连续学习3天', icon: '🔥', description: '连续3天完成作业', condition: '连续3天', reward: 15 },
  { id: 'ach8', name: '连续学习7天', icon: '💎', description: '连续7天完成作业', condition: '连续7天', reward: 30 },
  { id: 'ach9', name: '满分王', icon: '💯', description: '一次练习全对', condition: '全对一次', reward: 10 },
  { id: 'ach10', name: '速度王', icon: '⚡', description: '3分钟内完成一科', condition: '快速完成', reward: 8 },
]

// 📊 等级系统
export const levels = [
  { level: 1, name: '学习小萌新', icon: '🌱', minStars: 0 },
  { level: 2, name: '学习小能手', icon: '🌿', minStars: 20 },
  { level: 3, name: '学习小达人', icon: '🌳', minStars: 50 },
  { level: 4, name: '学习小明星', icon: '⭐', minStars: 100 },
  { level: 5, name: '学习小天才', icon: '🌟', minStars: 200 },
  { level: 6, name: '超级学霸', icon: '👑', minStars: 350 },
]

// 获取当前等级
export function getCurrentLevel(stars: number) {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (stars >= levels[i].minStars) {
      return levels[i]
    }
  }
  return levels[0]
}

// 获取下一等级
export function getNextLevel(stars: number) {
  for (const level of levels) {
    if (stars < level.minStars) {
      return level
    }
  }
  return null
}
