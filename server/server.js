/**
 * kids-learning API 服务
 * Express + sql.js (纯 JS SQLite，无需 C++ 编译)
 * 
 * 启动： node server.js
 * 默认端口： 3001（可通过 PORT 环境变量设置）
 */

import express from 'express'
import cors from 'cors'
import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomUUID, createHash } from 'node:crypto'

const PORT = process.env.PORT || 7777
const DB_PATH = './data.db'

// ===== 数据库初始化 =====
let db

async function initDb() {
  const SQL = await initSqlJs()

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')

  // sql.js 的 run 不支持多条 SQL 一起执行，逐条执行
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    grade TEXT NOT NULL DEFAULT 'grade1-down',
    avatar TEXT NOT NULL DEFAULT 'S',
    stars INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_study_date TEXT NOT NULL DEFAULT '',
    completed_lessons TEXT NOT NULL DEFAULT '{}',
    achievements TEXT NOT NULL DEFAULT '[]',
    badges TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS wrong_questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options TEXT NOT NULL DEFAULT '[]',
    date TEXT NOT NULL,
    retried INTEGER NOT NULL DEFAULT 0,
    retry_correct INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS daily_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    tasks_data TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  db.run('CREATE INDEX IF NOT EXISTS idx_wrong_questions_user ON wrong_questions(user_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_quiz_results_chapter ON quiz_results(chapter_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date)')

  return db
}

// 保存数据库到文件
function saveDb() {
  const data = db.export()
  writeFileSync(DB_PATH, Buffer.from(data))
}

// sql.js 查询辅助函数：取单行
function getOne(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

// sql.js 查询辅助函数：取多行
function getAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

// sql.js 执行写入（返回影响行数）
function execRun(sql, params = []) {
  db.run(sql, params)
  saveDb()
  return db.getRowsModified()
}

// ===== 工具函数 =====
function hashPassword(password) {
  return createHash('sha256').update(password + 'kids-learning-salt').digest('hex')
}

function generateId() {
  return randomUUID()
}

// ===== 初始化 DB（异步） =====
const dbReady = initDb()

// ===== Express =====
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// ===== 用户 API =====

// 注册
app.post('/api/users/register', (req, res) => {
  try {
    const { username, password, grade } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const existing = getOne('SELECT id FROM users WHERE username = ?', [username])
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' })
    }

    const id = generateId()
    const passwordHash = hashPassword(password)
    const createdAt = new Date().toISOString()

    execRun(
      'INSERT INTO users (id, username, password_hash, grade, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, username, passwordHash, grade || 'grade1-down', createdAt]
    )

    const user = getOne(
      'SELECT id, username, grade, avatar, stars, streak, last_study_date, completed_lessons, achievements, badges, created_at FROM users WHERE id = ?',
      [id]
    )
    res.json({ success: true, user })
  } catch (e) {
    console.error('Register error:', e)
    res.status(500).json({ error: '注册失败' })
  }
})

// 登录
app.post('/api/users/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const user = getOne('SELECT * FROM users WHERE username = ?', [username])
    if (!user) {
      return res.status(401).json({ error: '用户名不存在' })
    }

    const passwordHash = hashPassword(password)
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: '密码错误' })
    }

    const { password_hash, ...safeUser } = user
    res.json({ success: true, user: safeUser })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: '登录失败' })
  }
})

// 获取用户信息
app.get('/api/users/:id', (req, res) => {
  try {
    const user = getOne(
      'SELECT id, username, grade, avatar, stars, streak, last_study_date, completed_lessons, achievements, badges, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (!user) return res.status(404).json({ error: '用户不存在' })
    res.json({ user })
  } catch (e) {
    console.error('Get user error:', e)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 更新用户数据
app.put('/api/users/:id', (req, res) => {
  try {
    const { stars, streak, lastStudyDate, completedLessons, achievements, badges, grade, avatar } = req.body
    const updates = []
    const params = []

    if (stars !== undefined) { updates.push('stars = ?'); params.push(stars) }
    if (streak !== undefined) { updates.push('streak = ?'); params.push(streak) }
    if (lastStudyDate !== undefined) { updates.push('last_study_date = ?'); params.push(lastStudyDate) }
    if (completedLessons !== undefined) { updates.push('completed_lessons = ?'); params.push(JSON.stringify(completedLessons)) }
    if (achievements !== undefined) { updates.push('achievements = ?'); params.push(JSON.stringify(achievements)) }
    if (badges !== undefined) { updates.push('badges = ?'); params.push(JSON.stringify(badges)) }
    if (grade !== undefined) { updates.push('grade = ?'); params.push(grade) }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar) }

    if (updates.length === 0) return res.status(400).json({ error: '没有提供要更新的字段' })

    params.push(req.params.id)
    execRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)

    const user = getOne(
      'SELECT id, username, grade, avatar, stars, streak, last_study_date, completed_lessons, achievements, badges, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    res.json({ success: true, user })
  } catch (e) {
    console.error('Update user error:', e)
    res.status(500).json({ error: '更新用户信息失败' })
  }
})

// ===== 错题 API =====

// 记录错题
app.post('/api/wrong-questions', (req, res) => {
  try {
    const { userId, chapterId, subject, gradeId, questionId, question, userAnswer, correctAnswer, options } = req.body
    const id = generateId()

    execRun(
      'INSERT INTO wrong_questions (id, user_id, chapter_id, subject, grade_id, question_id, question, user_answer, correct_answer, options, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, chapterId, subject, gradeId, questionId, question, userAnswer, correctAnswer, JSON.stringify(options || []), new Date().toISOString()]
    )

    res.json({ success: true, id })
  } catch (e) {
    console.error('Record wrong question error:', e)
    res.status(500).json({ error: '记录错题失败' })
  }
})

// 获取用户错题列表
app.get('/api/wrong-questions/:userId', (req, res) => {
  try {
    const questions = getAll('SELECT * FROM wrong_questions WHERE user_id = ? ORDER BY date DESC', [req.params.userId])
    res.json({ questions: questions.map(q => ({ ...q, options: JSON.parse(q.options) })) })
  } catch (e) {
    console.error('Get wrong questions error:', e)
    res.status(500).json({ error: '获取错题失败' })
  }
})

// 删除错题
app.delete('/api/wrong-questions/:id', (req, res) => {
  try {
    execRun('DELETE FROM wrong_questions WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('Delete wrong question error:', e)
    res.status(500).json({ error: '删除错题失败' })
  }
})

// 更新错题重做状态
app.put('/api/wrong-questions/:id/retry', (req, res) => {
  try {
    const { retried, retryCorrect } = req.body
    execRun('UPDATE wrong_questions SET retried = ?, retry_correct = ? WHERE id = ?',
      [retried ? 1 : 0, retryCorrect ? 1 : 0, req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('Update retry error:', e)
    res.status(500).json({ error: '更新重做状态失败' })
  }
})

// ===== 测验结果 API =====

app.post('/api/quiz-results', (req, res) => {
  try {
    const { userId, chapterId, subject, gradeId, score, totalQuestions, correctAnswers } = req.body
    const id = generateId()

    execRun(
      'INSERT INTO quiz_results (id, user_id, chapter_id, subject, grade_id, score, total_questions, correct_answers, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, chapterId, subject, gradeId, score, totalQuestions, correctAnswers, new Date().toISOString()]
    )

    res.json({ success: true, id })
  } catch (e) {
    console.error('Save quiz result error:', e)
    res.status(500).json({ error: '保存测验结果失败' })
  }
})

app.get('/api/quiz-results/:userId', (req, res) => {
  try {
    const results = getAll('SELECT * FROM quiz_results WHERE user_id = ? ORDER BY date DESC', [req.params.userId])
    res.json({ results })
  } catch (e) {
    console.error('Get quiz results error:', e)
    res.status(500).json({ error: '获取测验结果失败' })
  }
})

// ===== 每日任务 API =====

app.get('/api/daily-tasks/:userId/:date', (req, res) => {
  try {
    const task = getOne('SELECT * FROM daily_tasks WHERE user_id = ? AND date = ?', [req.params.userId, req.params.date])
    res.json({ tasks: task ? JSON.parse(task.tasks_data) : [] })
  } catch (e) {
    console.error('Get daily tasks error:', e)
    res.status(500).json({ error: '获取每日任务失败' })
  }
})

app.put('/api/daily-tasks/:userId/:date', (req, res) => {
  try {
    const { tasks } = req.body
    const existing = getOne('SELECT id FROM daily_tasks WHERE user_id = ? AND date = ?', [req.params.userId, req.params.date])

    if (existing) {
      execRun('UPDATE daily_tasks SET tasks_data = ? WHERE id = ?', [JSON.stringify(tasks), existing.id])
    } else {
      execRun(
        'INSERT INTO daily_tasks (id, user_id, date, tasks_data) VALUES (?, ?, ?, ?)',
        [generateId(), req.params.userId, req.params.date, JSON.stringify(tasks)]
      )
    }

    res.json({ success: true })
  } catch (e) {
    console.error('Save daily tasks error:', e)
    res.status(500).json({ error: '保存每日任务失败' })
  }
})

// ===== 健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ===== 启动 =====
dbReady.then(() => {
  app.listen(PORT, () => {
    console.log(`[kids-learning API] 运行在 http://localhost:${PORT}`)
    console.log(`[kids-learning API] 健康检查: http://localhost:${PORT}/api/health`)
  })
}).catch(e => {
  console.error('数据库初始化失败:', e)
  process.exit(1)
})
