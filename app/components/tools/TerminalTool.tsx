'use client'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useStore } from '@/store'
import { callClaude } from '@/lib/ai'
import { cn } from '@/lib/utils'

const BUILTINS: Record<string, () => string> = {
  date:     () => new Date().toString(),
  whoami:   () => 'aurelius',
  pwd:      () => '/home/aurelius',
  ls:       () => 'drwxr-xr-x  projects/\ndrwxr-xr-x  downloads/\n-rw-r--r--  README.md\n-rwxr-xr-x  run.sh',
  'ls -la': () => 'total 32\ndrwxr-xr-x  aurelius  128  Mar 16 12:00 .\ndrwxr-xr-x  aurelius  256  Mar 16 11:00 ..\ndrwxr-xr-x  aurelius  192  Mar 16 12:00 projects\n-rw-r--r--  aurelius  312  Mar 16 10:00 README.md\n-rwxr-xr-x  aurelius  856  Mar 16 09:00 run.sh',
  uname:    () => 'Linux aurelius-local 6.1.0 #1 SMP x86_64 GNU/Linux',
  uptime:   () => ' 12:00:00 up 3 days, 4:22, 1 user, load average: 0.12, 0.08, 0.05',
  clear:    () => '__CLEAR__',
}

const MODE_SYSTEM = {
  explain:
    'You are an expert Linux/Unix terminal assistant. When the user types a command: explain what it does, its flags, and common variations. When they ask in plain English: answer the terminal/shell topic helpfully. Keep responses concise and practical.',
  simulate:
    'You are simulating a Unix shell. Respond with realistic terminal output as if the command was executed. For dangerous commands (rm -rf, mkfs, dd etc.) warn the user instead. Keep output brief and realistic.',
}

export function TerminalTool() {
  const {
    model, thinking, setThinking,
    termLines, termHistory, termMode,
    addTermLine, clearTerminal,
    pushTermHistory, setTermMode,
  } = useStore()

  const [input, setInput] = useState('')
  const [histIdx, setHistIdx] = useState(-1)
  const [aiLines, setAiLines] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [termLines, aiLines])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, termHistory.length - 1)
      setHistIdx(next)
      setInput(termHistory[termHistory.length - 1 - next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(histIdx - 1, -1)
      setHistIdx(next)
      setInput(next === -1 ? '' : termHistory[termHistory.length - 1 - next] ?? '')
    }
  }

  async function run() {
    const cmd = input.trim()
    if (!cmd || thinking) return
    setInput('')
    setHistIdx(-1)
    pushTermHistory(cmd)
    addTermLine('input', `$ ${cmd}`)

    // Meta commands
    if (cmd === '/clear' || cmd === 'clear') {
      clearTerminal()
      return
    }
    if (cmd === '/help' || cmd === 'help') {
      addTermLine('system', 'Built-ins: clear, date, whoami, pwd, ls, ls -la, uname, uptime, echo [text], history, /mode')
      addTermLine('system', 'Or ask in plain English: "how do I find large files?" "what does grep -r do?"')
      return
    }
    if (cmd === '/mode') {
      const next = termMode === 'explain' ? 'simulate' : 'explain'
      setTermMode(next)
      addTermLine('system', `Mode: ${next === 'explain' ? 'AI Explain' : 'Shell Simulate'}`)
      return
    }
    if (cmd === 'history') {
      termHistory
        .slice(-15)
        .forEach((c, i) =>
          addTermLine('output', `  ${String(i + 1).padStart(3)}  ${c}`)
        )
      return
    }
    if (cmd.startsWith('echo ')) {
      addTermLine('output', cmd.slice(5))
      return
    }

    // Built-in commands
    const builtin = BUILTINS[cmd]
    if (builtin) {
      const out = builtin()
      if (out === '__CLEAR__') { clearTerminal(); return }
      out.split('\n').forEach((l) => addTermLine('output', l))
      return
    }

    // AI response
    const aiId = `ai-${Date.now()}`
    setThinking(true)
    setAiLines((prev) => ({ ...prev, [aiId]: '' }))

    await callClaude({
      messages: [{ role: 'user', content: cmd }],
      systemPrompt: MODE_SYSTEM[termMode],
      model,
      stream: true,
      onToken: (full) =>
        setAiLines((prev) => ({ ...prev, [aiId]: full })),
      onDone: (full) => {
        setAiLines((prev) => {
          const next = { ...prev }
          delete next[aiId]
          return next
        })
        full.split('\n').forEach((l) => addTermLine('ai', l))
        setThinking(false)
      },
      onError: (err) => {
        setAiLines((prev) => {
          const next = { ...prev }
          delete next[aiId]
          return next
        })
        addTermLine('error', err)
        setThinking(false)
      },
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#080a0c]">

      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.07] flex-shrink-0">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center font-mono text-[11.5px] text-white/30">
          aurelius — ai-terminal
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = termMode === 'explain' ? 'simulate' : 'explain'
              setTermMode(next)
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10.5px] border transition-all',
              termMode === 'explain'
                ? 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400'
                : 'bg-[var(--acc-g)] border-[rgba(201,168,108,0.25)] text-[var(--acc)]'
            )}
          >
            {termMode === 'explain' ? '✦ AI Explain' : '⚡ Simulate'}
          </button>
          <button
            onClick={clearTerminal}
            className="px-2.5 py-1 rounded-full font-mono text-[10.5px] border border-white/10 text-white/30 hover:text-white/60 transition-colors"
          >
            clear
          </button>
        </div>
      </div>

      {/* Output area */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {termLines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'mb-1 whitespace-pre-wrap break-words',
              line.type === 'system' && 'text-sky-400/60',
              line.type === 'input'  && 'text-[#e8c97a]',
              line.type === 'output' && 'text-[#a8c4b8]',
              line.type === 'error'  && 'text-red-400',
              line.type === 'ai'     && 'text-emerald-300/90',
            )}
          >
            {line.text}
          </div>
        ))}

        {/* Streaming AI output */}
        {Object.entries(aiLines).map(([id, text]) => (
          <div
            key={id}
            className="mb-1 text-emerald-300/90 whitespace-pre-wrap"
          >
            {text}
            <span className="animate-pulse">▋</span>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-t border-white/[0.07] bg-white/[0.02] flex-shrink-0">
        <span className="font-mono text-[13px] flex-shrink-0 select-none">
          <span className="text-sky-400/60">aurelius</span>
          <span className="text-white/30">@</span>
          <span className="text-sky-400/60">local</span>
          <span className="text-white/30">:</span>
          <span className="text-sky-400/60">~</span>
          <span className="text-emerald-400 ml-1">$</span>
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={thinking}
          placeholder="Enter command or ask AI…"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8ecee] placeholder:text-white/20 caret-[var(--acc)] disabled:opacity-50"
        />
        <button
          onClick={run}
          disabled={thinking || !input.trim()}
          className="w-7 h-7 flex items-center justify-center bg-emerald-400/10 border border-emerald-400/20 rounded-md text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-30 transition-all"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}