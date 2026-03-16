'use client'
import { useState, useRef } from 'react'
import { Code2, Upload } from 'lucide-react'
import { useStore } from '@/store'
import { callClaude } from '@/lib/ai'
import {
  ToolLayout,
  MessagesList,
  TypingIndicator,
  ChatInputBar,
  ActionBar,
} from '@/app/components/ui/MessageBubble'
import { Select, toast } from '@/app/components/ui'

type Lang =
  | 'auto'
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'c++'
  | 'rust'
  | 'go'
  | 'sql'

const EXT_MAP: Record<string, Lang> = {
  py: 'python', js: 'javascript', ts: 'typescript',
  java: 'java', cpp: 'c++', rs: 'rust', go: 'go', sql: 'sql',
}

const ANALYSIS_PROMPTS: Record<string, (lang: string) => string> = {
  review:   (l) => `Perform a comprehensive code review of this ${l} code. Cover: correctness, readability, security, performance, and best practices. Use clear sections.`,
  bugs:     (l) => `Find all bugs, edge cases, and potential runtime failures in this ${l} code. For each: location, severity (critical/medium/low), explanation, and fix.`,
  optimize: (l) => `Optimize this ${l} code for performance. Show the bottlenecks, the optimized version with comments, and Big-O complexity before and after.`,
  explain:  (l) => `Explain this ${l} code in detail: what it does, how each part works, design patterns used, data flow, and use cases. Target a junior developer.`,
  refactor: (l) => `Refactor this ${l} code following clean code principles. Show the refactored version with comments explaining every change.`,
  tests:    (l) => `Generate comprehensive unit tests for this ${l} code. Include happy path, edge cases, error cases, and proper mocking.`,
}

export function CodeTool() {
  const {
    model, thinking, setThinking, addTokens,
    codeMessages, addCodeMessage, updateLastMessage, clearCodeMessages,
  } = useStore()

  const [code, setCode] = useState('')
  const [lang, setLang] = useState<Lang>('auto')
  const [streamingId, setStreamingId] = useState<string | undefined>()

  const [codeHistory, setCodeHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])


  const fileRef = useRef<HTMLInputElement>(null)

  async function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    setCode(text)
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (EXT_MAP[ext]) setLang(EXT_MAP[ext])
    toast(`Loaded: ${f.name}`)
  }

  async function analyze(mode: string) {
    if (!code.trim()) { toast('Paste some code first'); return }
    if (thinking) return

    const resolvedLang = lang === 'auto' ? 'the' : lang
    const prompt =
      ANALYSIS_PROMPTS[mode]?.(resolvedLang) ??
      ANALYSIS_PROMPTS.review(resolvedLang)
    const fullPrompt = `${prompt}\n\n\`\`\`${lang === 'auto' ? '' : lang}\n${code}\n\`\`\``

    clearCodeMessages()
    const history: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: fullPrompt },
    ]
    setCodeHistory(history)

    addCodeMessage('user', `**${mode.charAt(0).toUpperCase() + mode.slice(1)}** analysis`)
    setThinking(true)
    const placeholder = addCodeMessage('assistant', '')
    setStreamingId(placeholder.id)

    await callClaude({
      messages: history,
      systemPrompt:
        'You are a senior software engineer and code reviewer. Provide thorough, actionable analysis with code examples.',
      model,
      stream: true,
      onToken: (full) => {
        updateLastMessage('code', full)
        addTokens(full.slice(-30))
      },
      onDone: (full) => {
        updateLastMessage('code', full)
        setCodeHistory((h) => [...h, { role: 'assistant', content: full }])
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('code', err)
        setStreamingId(undefined)
        setThinking(false)
      },
    })
  }

  async function askFollowup(q: string) {
    if (thinking) return

    const history: { role: 'user' | 'assistant'; content: string }[] =
      codeHistory.length
        ? codeHistory
        : code
        ? [
            {
              role: 'user',
              content: `Here is the code:\n\`\`\`\n${code}\n\`\`\``,
            },
            {
              role: 'assistant',
              content: 'I can see your code. What would you like to know?',
            },
          ]
        : []

    const next: { role: 'user' | 'assistant'; content: string }[] = [
      ...history,
      { role: 'user', content: q },
    ]
    setCodeHistory(next)
    addCodeMessage('user', q)
    setThinking(true)
    const placeholder = addCodeMessage('assistant', '')
    setStreamingId(placeholder.id)

    await callClaude({
      messages: next,
      systemPrompt:
        'You are a senior software engineer. Answer questions about code concisely and accurately.',
      model,
      stream: true,
      onToken: (full) => { updateLastMessage('code', full) },
      onDone: (full) => {
        updateLastMessage('code', full)
        setCodeHistory((h) => [...h, { role: 'assistant', content: full }])
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('code', err)
        setStreamingId(undefined)
        setThinking(false)
      },
    })
  }

  return (
    <ToolLayout
      left={
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--bdr)] flex-shrink-0 gap-2 flex-wrap">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--txt3)]">
              Code Input
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
              >
                <option value="auto">Auto-detect</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="c++">C++</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="sql">SQL</option>
              </Select>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--surf2)] border border-[var(--bdr)] rounded-md text-[11px] text-[var(--txt2)] hover:text-[var(--txt)] transition-colors"
              >
                <Upload size={11} />
                Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept=".py,.js,.ts,.java,.cpp,.c,.go,.rs,.sql,.html,.css,.json,.md,.txt"
                onChange={loadFile}
              />
            </div>
          </div>

          {/* Code editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Paste your code here…\n\n// Example:\nfunction fibonacci(n) {\n  if (n <= 1) return n\n  return fibonacci(n-1) + fibonacci(n-2)\n}`}
            className="flex-1 bg-[var(--bg3)] border-none outline-none resize-none p-4 font-mono text-[12.5px] text-[var(--txt)] leading-relaxed placeholder:text-[var(--txt3)]"
            spellCheck={false}
          />

          {/* Action buttons */}
          <ActionBar
            actions={[
              {
                label: 'Full Review',
                onClick: () => analyze('review'),
                primary: true,
                icon: <Code2 size={12} />,
              },
              { label: 'Find Bugs',  onClick: () => analyze('bugs') },
              { label: 'Optimize',   onClick: () => analyze('optimize') },
              { label: 'Explain',    onClick: () => analyze('explain') },
              { label: 'Refactor',   onClick: () => analyze('refactor') },
              { label: 'Gen Tests',  onClick: () => analyze('tests') },
            ]}
          />
        </div>
      }
      right={
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--bdr)] flex-shrink-0">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--txt3)]">
              Analysis Results
            </span>
          </div>

          <MessagesList messages={codeMessages} streamingId={streamingId}>
            {!codeMessages.length && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--txt3)] py-16">
                <Code2 size={36} className="opacity-20" />
                <p className="text-[13px]">
                  Paste code and click an action to analyze
                </p>
              </div>
            )}
            {thinking &&
              codeMessages[codeMessages.length - 1]?.content === '' && (
                <TypingIndicator />
              )}
          </MessagesList>

          <ChatInputBar
            placeholder="Ask a follow-up about the code…"
            onSend={askFollowup}
            disabled={thinking}
          />
        </div>
      }
    />
  )
}