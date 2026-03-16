import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Message, Model, TermLine, ToolId } from '@/types'

function uid() {
  return Math.random().toString(36).slice(2)
}

function msg(role: Message['role'], content: string): Message {
  return { id: uid(), role, content, timestamp: new Date() }
}

interface Actions {
  setActiveTool: (t: ToolId) => void
  setModel: (m: Model) => void
  setTemperature: (t: number) => void
  setStreaming: (s: boolean) => void
  setSystemPrompt: (s: string) => void
  setThinking: (b: boolean) => void
  addTokens: (text: string) => void
  toggleTheme: () => void
  setSidebarOpen: (b: boolean) => void

  // Chat
  addChatMessage: (role: Message['role'], content: string) => Message
  clearChat: () => void

  // PDF
  setPdfContext: (text: string, name: string) => void
  addPdfMessage: (role: Message['role'], content: string) => Message
  clearPdf: () => void

  // Code
  setCodeContext: (code: string) => void
  addCodeMessage: (role: Message['role'], content: string) => Message
  clearCodeMessages: () => void

  // LeetCode
  setLcContext: (problem: string) => void
  addLcMessage: (role: Message['role'], content: string) => Message
  clearLcMessages: () => void

  // Research
  setResearchContext: (text: string, name: string) => void
  addResearchMessage: (role: Message['role'], content: string) => Message
  clearResearch: () => void
  clearResearchMessages: () => void

  // Terminal
  addTermLine: (type: TermLine['type'], text: string) => void
  clearTerminal: () => void
  pushTermHistory: (cmd: string) => void
  setTermMode: (m: 'explain' | 'simulate') => void

  // Streaming
  updateLastMessage: (
    target: 'chat' | 'pdf' | 'code' | 'lc' | 'research',
    text: string
  ) => void
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set) => ({
      activeTool: 'chat',
      model: 'claude-sonnet-4-5',
      temperature: 0.7,
      streaming: true,
      systemPrompt: '',
      thinking: false,
      totalTokens: 0,
      theme: 'dark',
      sidebarOpen: true,

      chatMessages: [],
      pdfMessages: [],
      pdfText: '',
      pdfFileName: '',
      codeMessages: [],
      codeContext: '',
      lcMessages: [],
      lcContext: '',
      researchMessages: [],
      researchText: '',
      researchFileName: '',
      termLines: [
        { id: uid(), type: 'system', text: 'Aurelius AI Terminal v2.0' },
        { id: uid(), type: 'system', text: 'Type /help for commands' },
      ],
      termHistory: [],
      termMode: 'explain',

      setActiveTool: (t) => set({ activeTool: t }),
      setModel: (m) => set({ model: m }),
      setTemperature: (t) => set({ temperature: t }),
      setStreaming: (s) => set({ streaming: s }),
      setSystemPrompt: (s) => set({ systemPrompt: s }),
      setThinking: (b) => set({ thinking: b }),
      addTokens: (text) =>
        set((s) => ({
          totalTokens: s.totalTokens + Math.ceil(text.length / 4),
        })),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setSidebarOpen: (b) => set({ sidebarOpen: b }),

      addChatMessage: (role, content) => {
        const m = msg(role, content)
        set((s) => ({ chatMessages: [...s.chatMessages, m] }))
        return m
      },
      clearChat: () => set({ chatMessages: [], totalTokens: 0 }),

      setPdfContext: (text, name) =>
        set({ pdfText: text, pdfFileName: name, pdfMessages: [] }),
      addPdfMessage: (role, content) => {
        const m = msg(role, content)
        set((s) => ({ pdfMessages: [...s.pdfMessages, m] }))
        return m
      },
      clearPdf: () =>
        set({ pdfText: '', pdfFileName: '', pdfMessages: [] }),

      setCodeContext: (code) =>
        set({ codeContext: code, codeMessages: [] }),
      addCodeMessage: (role, content) => {
        const m = msg(role, content)
        set((s) => ({ codeMessages: [...s.codeMessages, m] }))
        return m
      },
      clearCodeMessages: () => set({ codeMessages: [] }),

      setLcContext: (problem) =>
        set({ lcContext: problem, lcMessages: [] }),
      addLcMessage: (role, content) => {
        const m = msg(role, content)
        set((s) => ({ lcMessages: [...s.lcMessages, m] }))
        return m
      },
      clearLcMessages: () => set({ lcMessages: [] }),

      setResearchContext: (text, name) =>
        set({ researchText: text, researchFileName: name, researchMessages: [] }),
      addResearchMessage: (role, content) => {
        const m = msg(role, content)
        set((s) => ({ researchMessages: [...s.researchMessages, m] }))
        return m
      },
      clearResearch: () =>
        set({ researchText: '', researchFileName: '', researchMessages: [] }),
      clearResearchMessages: () => set({ researchMessages: [] }),

      addTermLine: (type, text) => {
        const line: TermLine = { id: uid(), type, text }
        set((s) => ({ termLines: [...s.termLines, line] }))
      },
      clearTerminal: () =>
        set({
          termLines: [{ id: uid(), type: 'system', text: 'Terminal cleared.' }],
          termHistory: [],
        }),
      pushTermHistory: (cmd) =>
        set((s) => ({
          termHistory: [...s.termHistory.slice(-49), cmd],
        })),
      setTermMode: (m) => set({ termMode: m }),

      updateLastMessage: (target, text) => {
        const keyMap = {
          chat: 'chatMessages',
          pdf: 'pdfMessages',
          code: 'codeMessages',
          lc: 'lcMessages',
          research: 'researchMessages',
        } as const
        const key = keyMap[target]
        set((s) => {
          const arr = [...(s[key] as Message[])]
          if (arr.length && arr[arr.length - 1].role === 'assistant') {
            arr[arr.length - 1] = { ...arr[arr.length - 1], content: text }
          } else {
            arr.push(msg('assistant', text))
          }
          return { [key]: arr }
        })
      },
    }),
    {
      name: 'aurelius-store',
      partialize: (s) => ({
        model: s.model,
        temperature: s.temperature,
        streaming: s.streaming,
        systemPrompt: s.systemPrompt,
        theme: s.theme,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
)