export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
}

export type ToolId =
  | 'chat'
  | 'pdf'
  | 'code'
  | 'leetcode'
  | 'research'
  | 'terminal'

export type Model =
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-5'
  | 'claude-haiku-4-5-20251001'

export interface AppState {
  activeTool: ToolId
  model: Model
  temperature: number
  streaming: boolean
  systemPrompt: string
  thinking: boolean
  totalTokens: number
  theme: 'dark' | 'light'
  sidebarOpen: boolean

  // per-tool histories
  chatMessages: Message[]
  pdfMessages: Message[]
  pdfText: string
  pdfFileName: string
  codeMessages: Message[]
  codeContext: string
  lcMessages: Message[]
  lcContext: string
  researchMessages: Message[]
  researchText: string
  researchFileName: string
  termLines: TermLine[]
  termHistory: string[]
  termMode: 'explain' | 'simulate'
}

export interface TermLine {
  id: string
  type: 'system' | 'input' | 'output' | 'error' | 'ai'
  text: string
}