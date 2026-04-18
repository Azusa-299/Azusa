/**
 * 会话管理模块
 * 负责 ~/.Azusa/sessions/ 目录下会话文件的 CRUD 操作
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

// 会话接口
export interface Session {
  id: string
  title: string
  sourceId: string
  modelId: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp?: number
  }>
  createdAt: number
  updatedAt: number
}


// 会话目录
const sessionsDir = path.join(os.homedir(), '.Azusa', 'sessions')

// 确保会话目录存在
function ensureSessionsDir(): void {
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true })
  }
}


// 获取会话文件路径
function getSessionPath(sessionId: string): string {
  return path.join(sessionsDir, `${sessionId}.json`)
}


// 读取会话
export function readSession(sessionId: string): Session | null {
  ensureSessionsDir()
  const filePath = getSessionPath(sessionId)
  if (!fs.existsSync(filePath)) {
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}


// 读取所有会话
export function readAllSessions(): Session[] {
  ensureSessionsDir()
  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'))
  const sessions: Session[] = []
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(sessionsDir, file), 'utf-8')
      sessions.push(JSON.parse(content))
    } catch {
      continue
    }
  }
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
}


// 写入会话
export function writeSession(session: Session): void {
  ensureSessionsDir()
  session.updatedAt = Date.now()
  fs.writeFileSync(getSessionPath(session.id), JSON.stringify(session, null, 2), 'utf-8')
}


// 删除会话
export function deleteSession(sessionId: string): boolean {
  const filePath = getSessionPath(sessionId)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}


// 创建会话
export function createSession(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Session {
  const now = Date.now()
  const session: Session = {
    ...data,
    id: `session_${now}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now
  }
  writeSession(session)
  return session
}
