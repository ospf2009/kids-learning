/**
 * IndexedDB 数据库工具
 */
const DB_NAME = 'kids-learning'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'username' })
      }
      if (!db.objectStoreNames.contains('progress')) {
        const store = db.createObjectStore('progress', { keyPath: 'id' })
        store.createIndex('username', 'username', { unique: false })
      }
      if (!db.objectStoreNames.contains('wrongQuestions')) {
        const store = db.createObjectStore('wrongQuestions', { keyPath: 'id', autoIncrement: true })
        store.createIndex('username', 'username', { unique: false })
      }
      if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true })
        store.createIndex('username', 'username', { unique: false })
      }
    }
  })
}

function txPromise<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(db => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      const req = fn(store)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

// === 用户 ===
export interface DBUser {
  username: string
  password: string
  grade: string
  createdAt: string
}

export async function createUser(user: DBUser): Promise<void> {
  await txPromise('users', 'readwrite', s => s.put(user))
}

export async function getUser(username: string): Promise<DBUser | undefined> {
  return txPromise('users', 'readonly', s => s.get(username))
}

// === 进度 ===
export interface ProgressRecord {
  id: string
  username: string
  subject: string
  chapterId: string
  completed: boolean
  score: number
  total: number
  lastAttempt: string
}

export async function saveProgress(record: ProgressRecord): Promise<void> {
  await txPromise('progress', 'readwrite', s => s.put(record))
}

export async function getUserProgress(username: string): Promise<ProgressRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly')
    const index = tx.objectStore('progress').index('username')
    const req = index.getAll(username)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// === 错题 ===
export interface WrongQuestion {
  id?: number
  username: string
  subject: string
  chapterId: string
  questionId: string
  question: string
  userAnswer: string
  correctAnswer: string
  timestamp: string
}

export async function addWrongQuestion(q: WrongQuestion): Promise<void> {
  await txPromise('wrongQuestions', 'readwrite', s => s.put(q))
}

export async function getWrongQuestions(username: string): Promise<WrongQuestion[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wrongQuestions', 'readonly')
    const index = tx.objectStore('wrongQuestions').index('username')
    const req = index.getAll(username)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function removeWrongQuestion(id: number): Promise<void> {
  await txPromise('wrongQuestions', 'readwrite', s => s.delete(id))
}

// === 历史记录 ===
export interface HistoryRecord {
  id?: number
  username: string
  subject: string
  chapterId: string
  score: number
  total: number
  date: string
}

export async function addHistory(record: HistoryRecord): Promise<void> {
  await txPromise('history', 'readwrite', s => s.add(record))
}

export async function getHistory(username: string): Promise<HistoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly')
    const index = tx.objectStore('history').index('username')
    const req = index.getAll(username)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
