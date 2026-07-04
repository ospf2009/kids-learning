/**
 * IndexedDB 数据库管理
 * 纯前端实现，支持多账号
 */

const DB_NAME = 'kids-learning'
const DB_VERSION = 1

export interface DBUser {
  id: string
  username: string
  passwordHash: string
  grade: string
  avatar: string
  createdAt: string
}

export interface DBProgress {
  id: string
  userId: string
  chapterId: string
  subject: string
  gradeId: string
  completed: boolean
  score: number
  totalQuestions: number
  correctAnswers: number
  attempts: number
  lastAttemptDate: string
}

export interface DBWrongQuestion {
  id: string
  userId: string
  questionId: string
  chapterId: string
  subject: string
  gradeId: string
  question: string
  userAnswer: string
  correctAnswer: string
  options: string[]
  date: string
  retried: boolean
  retryCorrect: boolean
}

export interface DBQuizResult {
  id: string
  userId: string
  chapterId: string
  subject: string
  gradeId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  date: string
}

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 用户表
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' })
        userStore.createIndex('username', 'username', { unique: true })
      }

      // 进度表
      if (!db.objectStoreNames.contains('progress')) {
        const progressStore = db.createObjectStore('progress', { keyPath: 'id' })
        progressStore.createIndex('userId', 'userId', { unique: false })
        progressStore.createIndex('chapterId', 'chapterId', { unique: false })
        progressStore.createIndex('userChapter', ['userId', 'chapterId'], { unique: true })
      }

      // 错题表
      if (!db.objectStoreNames.contains('wrongQuestions')) {
        const wrongStore = db.createObjectStore('wrongQuestions', { keyPath: 'id' })
        wrongStore.createIndex('userId', 'userId', { unique: false })
        wrongStore.createIndex('userChapter', ['userId', 'chapterId'], { unique: false })
      }

      // 测验结果表
      if (!db.objectStoreNames.contains('quizResults')) {
        const quizStore = db.createObjectStore('quizResults', { keyPath: 'id' })
        quizStore.createIndex('userId', 'userId', { unique: false })
        quizStore.createIndex('chapterId', 'chapterId', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// 通用 CRUD 操作
async function add<T>(storeName: string, data: T): Promise<T> {
  const db = await openDB()
  const clean = JSON.parse(JSON.stringify(data))
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.add(clean)
    request.onsuccess = () => resolve(clean)
    request.onerror = () => reject(request.error)
  })
}

async function put<T>(storeName: string, data: T): Promise<T> {
  const db = await openDB()
  // 深拷贝：剥离 Vue proxy / 不可克隆内容
  const clean = JSON.parse(JSON.stringify(data))
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(clean)
    request.onsuccess = () => resolve(clean)
    request.onerror = () => reject(request.error)
  })
}

async function deepClone<T>(v: T): Promise<T> {
  // JSON 安全的深拷贝
  if (v === null || v === undefined || typeof v !== 'object') return v
  return JSON.parse(JSON.stringify(v))
}

async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(key)
    request.onsuccess = () => resolve(deepClone(request.result) as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(deepClone(request.result) as T[])
    request.onerror = () => reject(request.error)
  })
}

async function getByIndex<T>(storeName: string, indexName: string, key: string | string[]): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(key)
    request.onsuccess = () => resolve(deepClone(request.result) as T[])
    request.onerror = () => reject(request.error)
  })
}

async function remove(storeName: string, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function clear(storeName: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 用户操作
export const userDB = {
  add: (user: DBUser) => add<DBUser>('users', user),
  put: (user: DBUser) => put<DBUser>('users', user),
  get: (id: string) => get<DBUser>('users', id),
  getAll: () => getAll<DBUser>('users'),
  getByUsername: async (username: string): Promise<DBUser | undefined> => {
    const users = await getByIndex<DBUser>('users', 'username', username)
    return users[0]
  },
  remove: (id: string) => remove('users', id),
}

// 进度操作
export const progressDB = {
  add: (progress: DBProgress) => add<DBProgress>('progress', progress),
  put: (progress: DBProgress) => put<DBProgress>('progress', progress),
  get: (id: string) => get<DBProgress>('progress', id),
  getAll: () => getAll<DBProgress>('progress'),
  getByUser: (userId: string) => getByIndex<DBProgress>('progress', 'userId', userId),
  getByChapter: (chapterId: string) => getByIndex<DBProgress>('progress', 'chapterId', chapterId),
  getByUserChapter: async (userId: string, chapterId: string): Promise<DBProgress | undefined> => {
    const results = await getByIndex<DBProgress>('progress', 'userChapter', [userId, chapterId])
    return results[0]
  },
  remove: (id: string) => remove('progress', id),
}

// 错题操作
export const wrongDB = {
  add: (wrong: DBWrongQuestion) => add<DBWrongQuestion>('wrongQuestions', wrong),
  put: (wrong: DBWrongQuestion) => put<DBWrongQuestion>('wrongQuestions', wrong),
  get: (id: string) => get<DBWrongQuestion>('wrongQuestions', id),
  getAll: () => getAll<DBWrongQuestion>('wrongQuestions'),
  getByUser: (userId: string) => getByIndex<DBWrongQuestion>('wrongQuestions', 'userId', userId),
  getByUserChapter: (userId: string, chapterId: string) =>
    getByIndex<DBWrongQuestion>('wrongQuestions', 'userChapter', [userId, chapterId]),
  remove: (id: string) => remove('wrongQuestions', id),
  clear: () => clear('wrongQuestions'),
}

// 测验结果操作
export const quizDB = {
  add: (result: DBQuizResult) => add<DBQuizResult>('quizResults', result),
  put: (result: DBQuizResult) => put<DBQuizResult>('quizResults', result),
  get: (id: string) => get<DBQuizResult>('quizResults', id),
  getAll: () => getAll<DBQuizResult>('quizResults'),
  getByUser: (userId: string) => getByIndex<DBQuizResult>('quizResults', 'userId', userId),
  getByChapter: (chapterId: string) => getByIndex<DBQuizResult>('quizResults', 'chapterId', chapterId),
  remove: (id: string) => remove('quizResults', id),
}

// 密码哈希（简单实现，纯前端）
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'kids-learning-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 生成唯一 ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}
