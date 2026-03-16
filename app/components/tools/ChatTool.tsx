'use client'
import { useState, useRef } from 'react'
import { Zap, Settings, Thermometer, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { callClaude } from '@/lib/ai'
import {
  MessagesList,
  TypingIndicator,
  ChatInputBar,
} from '@/app/components/ui/MessageBubble'
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
  const abortRef = useRef(false)

  async function send(text: string) {
    if (thinking) return
    addChatMessage('user', text)
    setThinking(true)
    abortRef.current = false

    const placeholder = addChatMessage('assistant', '')
    setStreamingId(placeholder.id)

    // slice(0,-2) excludes the user msg just added + empty placeholder
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
    })
  }

  const showWelcome = chatMessages.length === 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Messages */}
      <MessagesList messages={chatMessages} streamingId={streamingId}>

        {/* Welcome screen */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-slide-up">
            <div className="text-4xl text-[var(--acc)] mb-5 animate-spin-slow">
              ✦
            </div>
            <h1 className="font-display text-5xl font-light text-[var(--txt)] tracking-tight mb-3">
              Good {getGreeting()}
            </h1>
            <p className="text-[15px] text-[var(--txt2)] mb-10 max-w-md">
              Aurelius is your refined Claude interface. Ask anything.
            </p>
            <div className="grid grid-cols-2 gap-2.5 max-w-xl w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-4 py-3 bg-[var(--surf)] border border-[var(--bdr)] rounded-xl text-[13px] text-[var(--txt2)] text-left hover:border-[var(--acc)] hover:bg-[var(--acc-g)] hover:text-[var(--txt)] transition-all duration-150 backdrop-blur-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {thinking &&
          chatMessages[chatMessages.length - 1]?.content === '' && (
            <TypingIndicator />
          )}
      </MessagesList>

      {/* Input bar */}
      <ChatInputBar
        onSend={send}
        disabled={thinking}
        placeholder="Ask anything…"
      >
        {/* Toolbar buttons */}
        <button
          onClick={() => setStreaming(!streaming)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all',
            streaming
              ? 'bg-[var(--acc-g)] border-[rgba(201,168,108,0.3)] text-[var(--acc)]'
              : 'bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt2)]'
          )}
        >
          <Zap size={10} />
          Stream {streaming ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => {
            setDraftSystem(systemPrompt)
            setShowSystem(true)
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt2)] hover:text-[var(--txt)] transition-all"
        >
          <Settings size={10} />
          System
        </button>

        <button
          onClick={() => {
            setDraftTemp(temperature)
            setShowTemp(true)
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt2)] hover:text-[var(--txt)] transition-all"
        >
          <Thermometer size={10} />
          Temp {temperature}
        </button>

        <button
          onClick={() => {
            clearChat()
            toast('Chat cleared')
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt2)] hover:text-red-400 hover:border-red-400/40 transition-all"
        >
          <Trash2 size={10} />
          Clear
        </button>
      </ChatInputBar>

      {/* System Prompt Modal */}
      <Modal
        open={showSystem}
        onClose={() => setShowSystem(false)}
        title="System Prompt"
      >
        <p className="px-5 py-3 text-[13px] text-[var(--txt2)]">
          Define Claude&apos;s persona, tone, and constraints for this session.
        </p>
        <textarea
          value={draftSystem}
          onChange={(e) => setDraftSystem(e.target.value)}
          placeholder="You are an expert software engineer…"
          className="w-[calc(100%-40px)] mx-5 min-h-[140px] bg-[var(--bg)] border border-[var(--bdr2)] rounded-lg text-[var(--txt)] text-[13px] font-body leading-relaxed px-3.5 py-3 outline-none resize-y focus:border-[var(--acc)] transition-colors"
        />
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-[var(--bdr)]">
          <Button variant="outline" onClick={() => setShowSystem(false)}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              setSystemPrompt(draftSystem)
              setShowSystem(false)
              toast('System prompt applied')
            }}
          >
            Apply
          </Button>
        </div>
      </Modal>

      {/* Temperature Modal */}
      <Modal
        open={showTemp}
        onClose={() => setShowTemp(false)}
        title="Temperature"
        maxWidth="max-w-sm"
      >
        <p className="px-5 py-3 text-[13px] text-[var(--txt2)]">
          Lower = precise · Higher = creative
        </p>
        <div className="px-5 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--txt3)]">0</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draftTemp}
              onChange={(e) => setDraftTemp(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-[11px] text-[var(--txt3)]">1</span>
          </div>
          <p className="text-center font-display text-4xl font-light text-[var(--acc)] py-3">
            {draftTemp.toFixed(2)}
          </p>
        </div>
        <div className="flex justify-end px-5 py-4 border-t border-[var(--bdr)]">
          <Button
            variant="accent"
            onClick={() => {
              setTemperature(draftTemp)
              setShowTemp(false)
              toast(`Temperature: ${draftTemp}`)
            }}
          >
            Set Temperature
          </Button>
        </div>
      </Modal>

    </div>
  )
}