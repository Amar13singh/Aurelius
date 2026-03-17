'use client'
import { useState, useRef } from 'react'
import { Zap, Settings, Thermometer, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { callClaude } from '@/lib/ai'
import { MessagesList, ChatInputBar } from '@/app/components/ui/MessageBubble'
import { Modal, Button, toast } from '@/app/components/ui'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Explain quantum entanglement simply',
  'Write a Python web scraper',
  'Critique my startup idea honestly',
  'Plan a 7-day Japan itinerary',
  'Summarize the SOLID principles',
  'Write a cover letter for a senior dev role',
]

// Provider badge colors
const PROVIDER_STYLES: Record<string, string> = {
  Groq:        'text-orange-400 border-orange-400/30 bg-orange-400/10',
  OpenRouter:  'text-purple-400 border-purple-400/30 bg-purple-400/10',
  Gemini:      'text-blue-400   border-blue-400/30   bg-blue-400/10',
  Puter:       'text-green-400  border-green-400/30  bg-green-400/10',
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
}

export function ChatTool() {
  const {
    model, temperature, streaming, systemPrompt,
    thinking, setThinking, addTokens,
    chatMessages, addChatMessage, updateLastMessage, clearChat,
    setStreaming, setSystemPrompt, setTemperature,
  } = useStore()

  const [streamingId, setStreamingId] = useState<string | undefined>()
  const [showSystem, setShowSystem] = useState(false)
  const [showTemp, setShowTemp] = useState(false)
  const [draftSystem, setDraftSystem] = useState(systemPrompt)
  const [draftTemp, setDraftTemp] = useState(temperature)
  const [activeProvider, setActiveProvider] = useState<string>('')  // 👈 tracks which provider responded
  const abortRef = useRef(false)

  async function send(text: string) {
    if (thinking) return
    addChatMessage('user', text)
    setThinking(true)
    abortRef.current = false

    const placeholder = addChatMessage('assistant', '')
    setStreamingId(placeholder.id)

    const history = useStore
      .getState()
      .chatMessages.slice(0, -2)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    await callClaude({
      messages: [...history, { role: 'user', content: text }],
      systemPrompt,
      model,
      stream: streaming,
      onToken: (full) => {
        if (abortRef.current) return
        updateLastMessage('chat', full)
        addTokens(full.slice(-20))
      },
      onDone: (full) => {
        updateLastMessage('chat', full)
        addTokens(full)
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('chat', err)
        setStreamingId(undefined)
        setThinking(false)
      },
      onProvider: (name) => setActiveProvider(name),  // 👈 set provider on success
    })
  }

  async function regenerate() {
    const msgs = useStore.getState().chatMessages
    const lastUser = [...msgs].reverse().find(m => m.role === 'user')
    if (!lastUser || thinking) return
    const filtered = msgs.filter((_, i) => i !== msgs.length - 1)
    useStore.setState({ chatMessages: filtered })
    await send(lastUser.content)
  }

  const showWelcome = chatMessages.length === 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <MessagesList
        messages={chatMessages}
        streamingId={streamingId}
        onRegenerate={regenerate}
      >
        {showWelcome && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-slide-up min-h-[60vh]">
            <div className="text-5xl mb-6 select-none">✦</div>
            <h1 className="text-4xl font-bold text-[var(--txt)] mb-3 tracking-tight">
              Good {getGreeting()}
            </h1>
            <p className="text-[15px] text-[var(--txt2)] mb-10 max-w-md">
              Aurelius — your refined Claude AI interface. Ask anything.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-5 py-4 bg-[var(--bg2)] border border-[var(--bdr)] rounded-xl text-[13.5px] text-[var(--txt2)] text-left hover:border-[var(--acc2)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </MessagesList>

      <ChatInputBar onSend={send} disabled={thinking} placeholder="Message Aurelius…">

        {/* 👇 Provider badge — shows which AI provider responded */}
        {activeProvider && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] border font-medium transition-all',
              PROVIDER_STYLES[activeProvider] ?? 'text-[var(--txt3)] border-[var(--bdr)] bg-[var(--bg3)]'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {activeProvider}
          </span>
        )}

        <button
          onClick={() => setStreaming(!streaming)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] border transition-all',
            streaming
              ? 'bg-[var(--acc2)] bg-opacity-10 border-[var(--acc2)] border-opacity-30 text-[var(--acc2)]'
              : 'bg-[var(--bg3)] border-[var(--bdr)] text-[var(--txt3)]'
          )}
        >
          <Zap size={10} />
          Stream {streaming ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => { setDraftSystem(systemPrompt); setShowSystem(true) }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] border bg-[var(--bg3)] border-[var(--bdr)] text-[var(--txt3)] hover:text-[var(--txt)] transition-all"
        >
          <Settings size={10} />
          System
        </button>

        <button
          onClick={() => { setDraftTemp(temperature); setShowTemp(true) }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] border bg-[var(--bg3)] border-[var(--bdr)] text-[var(--txt3)] hover:text-[var(--txt)] transition-all"
        >
          <Thermometer size={10} />
          Temp {temperature}
        </button>

        <button
          onClick={() => { clearChat(); setActiveProvider(''); toast('Chat cleared') }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] border bg-[var(--bg3)] border-[var(--bdr)] text-[var(--txt3)] hover:text-red-400 hover:border-red-400/40 transition-all"
        >
          <Trash2 size={10} />
          Clear
        </button>
      </ChatInputBar>

      {/* System Prompt Modal */}
      <Modal open={showSystem} onClose={() => setShowSystem(false)} title="System Prompt">
        <p className="px-5 py-3 text-[13px] text-[var(--txt2)]">
          Define Claude&apos;s persona and constraints for this session.
        </p>
        <textarea
          value={draftSystem}
          onChange={(e) => setDraftSystem(e.target.value)}
          placeholder="You are an expert software engineer…"
          className="w-[calc(100%-40px)] mx-5 min-h-[140px] bg-[var(--bg)] border border-[var(--bdr2)] rounded-lg text-[var(--txt)] text-[13px] leading-relaxed px-3.5 py-3 outline-none resize-y focus:border-[var(--acc2)] transition-colors placeholder:text-[var(--txt3)]"
        />
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-[var(--bdr)]">
          <Button variant="outline" onClick={() => setShowSystem(false)}>Cancel</Button>
          <Button variant="accent" onClick={() => {
            setSystemPrompt(draftSystem)
            setShowSystem(false)
            toast('System prompt applied')
          }}>
            Apply
          </Button>
        </div>
      </Modal>

      {/* Temperature Modal */}
      <Modal open={showTemp} onClose={() => setShowTemp(false)} title="Temperature" maxWidth="max-w-sm">
        <p className="px-5 py-3 text-[13px] text-[var(--txt2)]">Lower = precise · Higher = creative</p>
        <div className="px-5 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--txt3)]">0</span>
            <input type="range" min={0} max={1} step={0.05} value={draftTemp}
              onChange={(e) => setDraftTemp(parseFloat(e.target.value))} className="flex-1" />
            <span className="text-[11px] text-[var(--txt3)]">1</span>
          </div>
          <p className="text-center text-3xl font-bold text-[var(--acc2)] py-3">
            {draftTemp.toFixed(2)}
          </p>
        </div>
        <div className="flex justify-end px-5 py-4 border-t border-[var(--bdr)]">
          <Button variant="accent" onClick={() => {
            setTemperature(draftTemp)
            setShowTemp(false)
            toast(`Temperature: ${draftTemp}`)
          }}>
            Set Temperature
          </Button>
        </div>
      </Modal>
    </div>
  )
}