/**
 * 配置管理模块
 * 负责读取和写入用户配置，配置文件存储在用户主目录下的 .Azusa/config.json 中
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

const configDir = path.join(os.homedir(), '.Azusa')
const configPath = path.join(configDir, 'config.json')

function ensureConfig(): void {
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}', 'utf-8')
}

export function readConfig(): Record<string, any> {
  ensureConfig()
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

export function writeConfig(data: Record<string, any>): void {
  ensureConfig()
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8')
}
