/**
 * 旧版 IndexedDB 接口兼容层
 * 
 * 把原来直接调 IndexedDB 的地方，映射到 API 调用
 * userDB / progressDB / wrongDB / quizDB 这些接口保持不变
 */

import { userApi, wrongApi, quizApi, dailyApi, type ApiWrongQuestion } from '@/api'
import { generateId } from './index'

// ===== User 类型（保持兼容） =====
export interface DBUser {
  id: string
  username: string
  passwordHash: string
  grade: string
  avatar: string
  createdAt: string
}

// ===== User DB（兼容旧接口） =====
export const userDB = {
  add: async (user: DBUser) => {
    // 注册走 API，这里忽略（auth store 里用 register 代替）
    return user
  },
  put: async (user: DBUser) => {
    // 更新用户数据 → API
    await userApi.update(user.id, {
      grade: user.grade,
      avatar: user.avatar,
    })
    return user
  },
  get: async (id: string): Promise<DBUser | undefined> => {
    try {
      const { user } = await userApi.get(id)
      return {
        id: user.id,
        username: user.username,
        passwordHash: '',
        grade: user.grade,
        avatar: user.avatar,
        createdAt: user.created_at,
      }
    } catch {
      return undefined
    }
  },
  getAll: async (): Promise<DBUser[]> => {
    // 暂时不支持获取全部用户（API 没有暴露这个接口）
    return []
  },
  getByUsername: async (username: string): Promise<DBUser | undefined> => {
    // 这个接口在注册/登录时使用，已经通过 API 处理
    return undefined
  },
  remove: async (id: string) => {},
}

// ===== 错题 DB =====
export const wrongDB = {
  add: async (wrong: {
    id: string
    userId: string
    chapterId: string
    subject: string
    gradeId: string
    questionId: string
    question: string
    userAnswer: string
    correctAnswer: string
    options: string[]
    date: string
    retried: boolean
    retryCorrect: boolean
  }) => {
    await wrongApi.add({
      userId: wrong.userId,
      chapterId: wrong.chapterId,
      subject: wrong.subject,
      gradeId: wrong.gradeId,
      questionId: wrong.questionId,
      question: wrong.question,
      userAnswer: wrong.userAnswer,
      correctAnswer: wrong.correctAnswer,
      options: wrong.options,
    })
    return wrong
  },
  put: async (wrong: any) => wrong,
  get: async (id: string) => undefined,
  getAll: async () => [],
  getByUser: async (userId: string): Promise<any[]> => {
    try {
      const { questions } = await wrongApi.getByUser(userId)
      return questions.map(mapWrongQuestion)
    } catch {
      return []
    }
  },
  getByUserChapter: async (userId: string, chapterId: string): Promise<any[]> => {
    try {
      const { questions } = await wrongApi.getByUser(userId)
      return questions.filter(q => q.chapter_id === chapterId).map(mapWrongQuestion)
    } catch {
      return []
    }
  },
  remove: async (id: string) => {
    await wrongApi.remove(id)
  },
  clear: async () => {},
}

function mapWrongQuestion(q: ApiWrongQuestion) {
  return {
    id: q.id,
    userId: q.user_id,
    chapterId: q.chapter_id,
    subject: q.subject,
    gradeId: q.grade_id,
    questionId: q.question_id,
    question: q.question,
    userAnswer: q.user_answer,
    correctAnswer: q.correct_answer,
    options: q.options || [],
    date: q.date,
    retried: q.retried === 1,
    retryCorrect: q.retry_correct === 1,
  }
}

// ===== Progress DB（兼容存根） =====
export const progressDB = {
  add: async (p: any) => p,
  put: async (p: any) => p,
  get: async (id: string) => undefined,
  getAll: async () => [],
  getByUser: async (userId: string) => [],
  getByChapter: async (chapterId: string) => [],
  getByUserChapter: async (userId: string, chapterId: string) => undefined,
  remove: async (id: string) => {},
}

// ===== Quiz DB =====
export const quizDB = {
  add: async (result: {
    id: string
    userId: string
    chapterId: string
    subject: string
    gradeId: string
    score: number
    totalQuestions: number
    correctAnswers: number
    date: string
  }) => {
    await quizApi.add({
      userId: result.userId,
      chapterId: result.chapterId,
      subject: result.subject,
      gradeId: result.gradeId,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
    })
    return result
  },
  put: async (r: any) => r,
  get: async (id: string) => undefined,
  getAll: async () => [],
  getByUser: async (userId: string) => {
    try {
      const { results } = await quizApi.getByUser(userId)
      return results
    } catch { return [] }
  },
  getByChapter: async (chapterId: string) => [],
  remove: async (id: string) => {},
}
