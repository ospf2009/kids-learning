/**
 * API 请求封装
 */

// 根据环境选择 API 地址
// 生产环境：你的服务器 IP/域名 + 端口
// 开发环境：本地 7777
const API_BASE = import.meta.env.DEV
  ? 'http://47.95.213.150:7777'
  : 'http://47.95.213.150:7777'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `请求失败 (${res.status})`)
  }

  return res.json()
}

export interface ApiUser {
  id: string
  username: string
  grade: string
  avatar: string
  stars: number
  streak: number
  last_study_date: string
  completed_lessons: string
  achievements: string
  badges: string
  created_at: string
}

export interface ApiWrongQuestion {
  id: string
  user_id: string
  chapter_id: string
  subject: string
  grade_id: string
  question_id: string
  question: string
  user_answer: string
  correct_answer: string
  options: string
  date: string
  retried: number
  retry_correct: number
}

export interface ApiQuizResult {
  id: string
  user_id: string
  chapter_id: string
  subject: string
  grade_id: string
  score: number
  total_questions: number
  correct_answers: number
  date: string
}

export const api = {
  // 用户
  register(username: string, password: string, grade: string) {
    return request<{ success: boolean; user: ApiUser }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, grade }),
    })
  },

  login(username: string, password: string) {
    return request<{ success: boolean; user: ApiUser }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  getUser(id: string) {
    return request<{ user: ApiUser }>(`/api/users/${id}`)
  },

  updateUser(id: string, data: Record<string, unknown>) {
    return request<{ success: boolean; user: ApiUser }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // 错题
  addWrongQuestion(data: {
    userId: string; chapterId: string; subject: string; gradeId: string;
    questionId: string; question: string; userAnswer: string;
    correctAnswer: string; options: string[];
  }) {
    return request<{ success: boolean; id: string }>('/api/wrong-questions', {
      method: 'POST', body: JSON.stringify(data),
    })
  },

  getWrongQuestions(userId: string) {
    return request<{ questions: ApiWrongQuestion[] }>(`/api/wrong-questions/${userId}`)
  },

  updateWrongQuestionRetry(id: string, retried: boolean, retryCorrect: boolean) {
    return request<{ success: boolean }>(`/api/wrong-questions/${id}/retry`, {
      method: 'PUT', body: JSON.stringify({ retried, retryCorrect }),
    })
  },

  deleteWrongQuestion(id: string) {
    return request<{ success: boolean }>(`/api/wrong-questions/${id}`, {
      method: 'DELETE',
    })
  },

  /** 预览错题本历史脏数据（user_answer 为 '__wrong__' 等占位符），不改动数据 */
  previewWrongQuestionCleanup(userId?: string) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : ''
    return request<{
      dirtyCount: number
      totalCount: number
      samples: Array<{
        id: string; user_id: string; question: string
        user_answer: string; correct_answer: string; date: string
      }>
    }>(`/api/wrong-questions/cleanup/preview${qs}`)
  },

  /** 清洗错题本历史脏数据
   *  mode='delete' 删除脏记录；mode='fix' 把 user_answer 改写为 replacement */
  cleanupWrongQuestions(opts?: {
    mode?: 'delete' | 'fix'; userId?: string; replacement?: string
  }) {
    return request<{ success: boolean; mode: string; affected: number }>(
      '/api/wrong-questions/cleanup',
      { method: 'POST', body: JSON.stringify(opts || {}) }
    )
  },

  // 测验结果
  addQuizResult(data: {
    userId: string; chapterId: string; subject: string; gradeId: string;
    score: number; totalQuestions: number; correctAnswers: number;
  }) {
    return request<{ success: boolean; id: string }>('/api/quiz-results', {
      method: 'POST', body: JSON.stringify(data),
    })
  },

  getQuizResults(userId: string) {
    return request<{ results: ApiQuizResult[] }>(`/api/quiz-results/${userId}`)
  },

  // 每日任务
  getDailyTasks(userId: string, date: string) {
    return request<{ tasks: unknown[] }>(`/api/daily-tasks/${userId}/${date}`)
  },

  saveDailyTasks(userId: string, date: string, tasks: unknown[]) {
    return request<{ success: boolean }>(`/api/daily-tasks/${userId}/${date}`, {
      method: 'PUT', body: JSON.stringify({ tasks }),
    })
  },

  // 用户出题缓存（账号绑定的随机题缓存）
  getQuizCache(userId: string, chapterId: string, subject: string, gradeId: string) {
    return request<{ questions: unknown[] | null }>(
      `/api/quiz-cache/${userId}/${chapterId}/${subject}/${gradeId}`
    )
  },

  saveQuizCache(userId: string, chapterId: string, subject: string, gradeId: string, questions: unknown[]) {
    return request<{ success: boolean }>(`/api/quiz-cache/${userId}/${chapterId}/${subject}/${gradeId}`, {
      method: 'PUT',
      body: JSON.stringify({ questions }),
    })
  },

  clearQuizCache(userId: string, chapterId: string, subject: string, gradeId: string) {
    return request<{ success: boolean }>(
      `/api/quiz-cache/${userId}/${chapterId}/${subject}/${gradeId}`,
      { method: 'DELETE' }
    )
  },

  // 健康检查
  health() {
    return request<{ status: string; time: string }>('/api/health')
  },
}
