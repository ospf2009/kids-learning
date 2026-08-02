/**
 * 错题本历史脏数据清洗脚本
 *
 * 背景：早期 ChapterPractice.submitInteractive() 在答错时写死了占位符 '__wrong__'
 *       作为 userAnswer 存进了 wrong_questions.user_answer 列，导致错题本显示异常。
 *
 * 用法（在 server 目录下执行）：
 *   node cleanup-wrong-answers.mjs                 # 预览，不改动任何数据
 *   node cleanup-wrong-answers.mjs --fix           # 把脏值改写为「（空）」，保留错题
 *   node cleanup-wrong-answers.mjs --delete        # 删除这些脏记录
 *   node cleanup-wrong-answers.mjs --fix --user=<userId>        # 只处理某个用户
 *   node cleanup-wrong-answers.mjs --fix --replacement=已答错   # 自定义替换文案
 *   node cleanup-wrong-answers.mjs --delete --no-backup         # 跳过备份（不推荐）
 *
 * 注意：脚本会直接读写 ./data.db。执行写操作前默认自动生成带时间戳的备份文件。
 *       如果 API 服务正在运行，建议先停服再执行，避免服务进程把内存中的旧数据覆盖回磁盘。
 */

import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'

const DB_PATH = './data.db'

// 与 server.js 中 DIRTY_ANSWER_SQL 保持一致
const DIRTY_WHERE = `(user_answer IN ('__wrong__', 'wrong', '未填答') OR TRIM(COALESCE(user_answer, '')) = '')`

// ===== 解析命令行参数 =====
const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const valueOf = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

const doFix = has('--fix')
const doDelete = has('--delete')
const noBackup = has('--no-backup')
const userId = valueOf('user')
const replacement = valueOf('replacement') || '（空）'

if (doFix && doDelete) {
  console.error('错误：--fix 与 --delete 互斥，只能选其一。')
  process.exit(1)
}

const mode = doDelete ? 'delete' : doFix ? 'fix' : 'preview'

// ===== 主流程 =====
async function main() {
  if (!existsSync(DB_PATH)) {
    console.error(`错误：找不到数据库文件 ${DB_PATH}，请在 server 目录下执行本脚本。`)
    process.exit(1)
  }

  const SQL = await initSqlJs()
  const db = new SQL.Database(readFileSync(DB_PATH))

  const whereClause = userId ? `WHERE ${DIRTY_WHERE} AND user_id = ?` : `WHERE ${DIRTY_WHERE}`
  const params = userId ? [userId] : []

  // --- 查询脏数据 ---
  const stmt = db.prepare(
    `SELECT id, user_id, question, user_answer, correct_answer, date
     FROM wrong_questions ${whereClause} ORDER BY date DESC`
  )
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()

  const totalStmt = db.prepare('SELECT COUNT(*) AS c FROM wrong_questions')
  totalStmt.step()
  const total = totalStmt.getAsObject().c
  totalStmt.free()

  console.log('='.repeat(60))
  console.log(`数据库        : ${DB_PATH}`)
  console.log(`模式          : ${mode}${mode === 'preview' ? '（仅预览，不会修改数据）' : ''}`)
  console.log(`用户范围      : ${userId || '全部用户'}`)
  console.log(`错题总数      : ${total}`)
  console.log(`脏数据条数    : ${rows.length}`)
  console.log('='.repeat(60))

  if (rows.length === 0) {
    console.log('没有需要清洗的数据，退出。')
    db.close()
    return
  }

  // --- 打印明细（最多 20 条）---
  console.log('\n脏数据明细（最多显示 20 条）：')
  rows.slice(0, 20).forEach((r, i) => {
    const q = String(r.question || '').replace(/\s+/g, ' ').slice(0, 40)
    console.log(
      `  ${String(i + 1).padStart(2)}. [${r.id.slice(0, 8)}] ${q}` +
        ` | 你答=${JSON.stringify(r.user_answer)} | 正解=${r.correct_answer}`
    )
  })
  if (rows.length > 20) console.log(`  ... 其余 ${rows.length - 20} 条已省略`)

  if (mode === 'preview') {
    console.log('\n这是预览模式，未做任何改动。')
    console.log('如需清洗，请追加参数：')
    console.log(`  --fix     把 user_answer 改写为「${replacement}」，保留错题记录`)
    console.log('  --delete  直接删除这些错题记录')
    db.close()
    return
  }

  // --- 备份 ---
  if (!noBackup) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${DB_PATH}.backup-${stamp}`
    copyFileSync(DB_PATH, backupPath)
    console.log(`\n已备份原库到：${backupPath}`)
  } else {
    console.log('\n已跳过备份（--no-backup）')
  }

  // --- 执行清洗 ---
  if (mode === 'delete') {
    db.run(`DELETE FROM wrong_questions ${whereClause}`, params)
  } else {
    db.run(
      `UPDATE wrong_questions SET user_answer = ? ${whereClause}`,
      userId ? [replacement, userId] : [replacement]
    )
  }
  const affected = db.getRowsModified()

  // --- 落盘 ---
  writeFileSync(DB_PATH, Buffer.from(db.export()))
  db.close()

  console.log(`\n清洗完成：${mode === 'delete' ? '删除' : '改写'} ${affected} 条记录。`)
  console.log('如果 API 服务正在运行，请重启服务让它重新加载数据库。')
}

main().catch((e) => {
  console.error('执行失败：', e)
  process.exit(1)
})
