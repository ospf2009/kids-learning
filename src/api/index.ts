/**
 * API 客户端
 * 封装后端 HTTP API 调用
 * 
 * 开发时指向 localhost，部署时改为服务器地址
 */

// 这里改成你服务器上 API 的地址
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ===== 错误处理 =====
class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(data.error || '请求失败', res.status)
  }

  return data as T
}

// ===== 用户 API =====
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

export const userApi = {
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

  get(id: string) {
    return request<{ user: ApiUser }>(`/api/users/${id}`)
  },

  update(id: string, data: Record<string, unknown>) {
    return request<{ success: boolean; user: ApiUser }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ===== 错题 API =====
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
  options: string[]
  date: string
  retried: number
  retry_correct: number
}

export const wrongApi = {
  add(data: {
    userId: string
    chapterId: string
    subject: string
    gradeId: string
    questionId: string
    question: string
    userAnswer: string
    correctAnswer: string
    options: string[]
  }) {
    return request<{ success: boolean; id: string }>('/api/wrong-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getByUser(userId: string) {
    return request<{ questions: ApiWrongQuestion[] }>(`/api/wrong-questions/${userId}`)
  },

  remove(id: string) {
    return request<{ success: boolean }>(`/api/wrong-questions/${id}`, { method: 'DELETE' })
  },

  updateRetry(id: string, retried: boolean, retryCorrect: boolean) {
    return request<{ success: boolean }>(`/api/wrong-questions/${id}/retry`, {
      method: 'PUT',
      body: JSON.stringify({ retried, retryCorrect }),
    })
  },
}

// ===== 测验结果 API =====
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

export const quizApi = {
  add(data: {
    userId: string
    chapterId: string
    subject: string
    gradeId: string
    score: number
    totalQuestions: number
    correctAnswers: number
  }) {
    return request<{ success: boolean; id: string }>('/api/quiz-results', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getByUser(userId: string) {
    return request<{ results: ApiQuizResult[] }>(`/api/quiz-results/${userId}`)
  },
}

// ===== 每日任务 API =====
export interface DailyTaskItem {
  id: string
  subject: 'chinese' | 'math' | 'english'
  title: string
  icon: string
  total: number
  completed: number
  isCompleted: boolean
}

export const dailyApi = {
  get(userId: string, date: string) {
    return request<{ tasks: DailyTaskItem[] }>(`/api/daily-tasks/${userId}/${date}`)
  },

  save(userId: string, date: string, tasks: DailyTaskItem[]) {
    return request<{ success: boolean }>(`/api/daily-tasks/${userId}/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ tasks }),
    })
  },
}
