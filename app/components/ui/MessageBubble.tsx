'use client'
import React, { useEffect, useRef, useState,useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
// import rehypeKatex from 'rehype-katex'
import rehypeKatex from 'rehype-katex'
// import rehypeHighlight from 'rehype-highlight'
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, User } from 'lucide-react'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from '@/app/components/ui'

// import Prism from 'prismjs'
// import 'prismjs/components/prism-python'
// ... all prism imports


/* ── Code block ───────────────────────────────────────── */


function CodeBlock({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const lang = (className ?? '').replace('language-', '') || 'text'
  const text = String(children ?? '').trim()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (ref.current && (window as any).Prism) {
      (window as any).Prism.highlightElement(ref.current)
    }
  }, [text])

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[var(--bdr)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg3)] border-b border-[var(--bdr)]">
        <span className="text-[11px] font-mono font-semibold text-[var(--txt2)] uppercase tracking-wider">
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-[var(--txt3)] hover:text-[var(--txt)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg2)]"
        >
          {copied ? (
            <><Check size={12} className="text-[var(--acc3)]" /><span className="text-[var(--acc3)]">Copied!</span></>
          ) : (
            <><Copy size={12} /><span>Copy</span></>
          )}
        </button>
      </div>
      <div className="overflow-x-auto" style={{ background: '#1d1f21' }}>
        <pre style={{ margin: 0, padding: '16px', background: 'transparent' }}>
          <code
            ref={ref}
            className={`language-${lang}`}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: '1.7' }}
          >
            {text}
          </code>
        </pre>
      </div>
    </div>
  )
}

/* ── Message bubble ───────────────────────────────────── */
interface MessageBubbleProps {
  message: Message
  streaming?: boolean
  onRegenerate?: () => void
  isLast?: boolean
}

export function MessageBubble({
  message,
  streaming,
  onRegenerate,
  isLast,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<null | 'up' | 'down'>(null)

  function copy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast('Copied to clipboard')
  }

  const time = message.timestamp instanceof Date
    ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={cn(
      'group w-full py-6 px-4 animate-slide-up',
      isUser ? 'bg-transparent' : 'bg-[var(--bg2)] border-y border-[var(--bdr)]'
    )}>
      <div className="max-w-3xl mx-auto flex gap-4">

        {/* Avatar */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[12px] font-bold',
          isUser
            ? 'bg-[var(--acc2)] text-white'
            : 'bg-[var(--bg3)] border border-[var(--bdr)] text-[var(--acc)]'
        )}>
          {isUser ? <User size={14} /> : 'A'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Name + time */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-semibold text-[var(--txt)]">
              {isUser ? 'You' : 'Aurelius'}
            </span>
            <span className="text-[11px] text-[var(--txt3)]">{time}</span>
          </div>

          {/* Message content */}
          {isUser ? (
            <div className="text-[14.5px] text-[var(--txt)] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className={cn(
              'prose-ai text-[14.5px] leading-relaxed',
              streaming && 'cursor-blink'
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ className, children, ...props }) {
                    const isBlock = String(children).includes('\n')
                    if (isBlock) {
                      return <CodeBlock className={className}>{children}</CodeBlock>
                    }
                    return (
                      <code
                        className="font-mono text-[13px] bg-[var(--bg3)] text-[var(--acc)] px-1.5 py-0.5 rounded border border-[var(--bdr)]"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return <>{children}</>
                  },
                  h1({ children }) {
                    return <h1 className="text-2xl font-bold text-[var(--txt)] mt-6 mb-3 pb-2 border-b border-[var(--bdr)]">{children}</h1>
                  },
                  h2({ children }) {
                    return <h2 className="text-xl font-semibold text-[var(--txt)] mt-5 mb-2 pb-1 border-b border-[var(--bdr)]">{children}</h2>
                  },
                  h3({ children }) {
                    return <h3 className="text-[16px] font-semibold text-[var(--txt)] mt-4 mb-2">{children}</h3>
                  },
                  p({ children }) {
                    return <p className="text-[var(--txt)] leading-relaxed mb-3 last:mb-0">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 mb-3 space-y-1 text-[var(--txt)]">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 mb-3 space-y-1 text-[var(--txt)]">{children}</ol>
                  },
                  li({ children }) {
                    return <li className="text-[var(--txt)] leading-relaxed">{children}</li>
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-[var(--bdr2)] pl-4 my-3 text-[var(--txt2)] italic bg-[var(--bg3)] py-2 rounded-r-lg">
                        {children}
                      </blockquote>
                    )
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 rounded-lg border border-[var(--bdr)]">
                        <table className="w-full text-[13px]">{children}</table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return <th className="px-4 py-2.5 bg-[var(--bg3)] font-semibold text-[var(--txt2)] text-left border-b border-[var(--bdr)] text-[12px] uppercase tracking-wider">{children}</th>
                  },
                  td({ children }) {
                    return <td className="px-4 py-2.5 border-b border-[var(--bdr)] text-[var(--txt)] last:border-0">{children}</td>
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="text-[var(--acc2)] hover:underline">
                        {children}
                      </a>
                    )
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-[var(--txt)]">{children}</strong>
                  },
                  hr() {
                    return <hr className="border-[var(--bdr)] my-4" />
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Actions — show on hover or for last AI message */}
          {!isUser && !streaming && (
            <div className={cn(
              'flex items-center gap-1 mt-3 transition-opacity',
              isLast ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}>
              <button onClick={copy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] border border-transparent hover:border-[var(--bdr)] transition-all">
                {copied ? <Check size={12} className="text-[var(--acc3)]" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {onRegenerate && isLast && (
                <button onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] border border-transparent hover:border-[var(--bdr)] transition-all">
                  <RefreshCw size={12} />
                  Regenerate
                </button>
              )}
              <div className="flex items-center gap-1 ml-1">
                <button onClick={() => setLiked(liked === 'up' ? null : 'up')}
                  className={cn(
                    'p-1.5 rounded-md transition-all border border-transparent',
                    liked === 'up'
                      ? 'text-[var(--acc3)] bg-[var(--bg3)] border-[var(--bdr)]'
                      : 'text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)]'
                  )}>
                  <ThumbsUp size={12} />
                </button>
                <button onClick={() => setLiked(liked === 'down' ? null : 'down')}
                  className={cn(
                    'p-1.5 rounded-md transition-all border border-transparent',
                    liked === 'down'
                      ? 'text-[var(--acc)] bg-[var(--bg3)] border-[var(--bdr)]'
                      : 'text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)]'
                  )}>
                  <ThumbsDown size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Typing indicator ─────────────────────────────────── */
export function TypingIndicator() {
  return (
    <div className="w-full py-6 px-4 bg-[var(--bg2)] border-y border-[var(--bdr)]">
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className="w-8 h-8 rounded-full bg-[var(--bg3)] border border-[var(--bdr)] flex items-center justify-center text-[var(--acc)] text-[12px] font-bold flex-shrink-0">
          A
        </div>
        <div className="flex items-center gap-1 mt-2.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--txt3)] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Messages list ────────────────────────────────────── */
interface MessagesListProps {
  messages: Message[]
  streamingId?: string
  onRegenerate?: () => void
  children?: React.ReactNode
}

export function MessagesList({
  messages,
  streamingId,
  onRegenerate,
  children,
}: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingId])

  return (
    <div className="flex-1 overflow-y-auto">
      {children}
      {messages.map((m, i) => (
        <MessageBubble
          key={m.id}
          message={m}
          streaming={m.id === streamingId}
          isLast={i === messages.length - 1}
          onRegenerate={
            m.role === 'assistant' && i === messages.length - 1
              ? onRegenerate
              : undefined
          }
        />
      ))}
      {streamingId && messages[messages.length - 1]?.content === '' && (
        <TypingIndicator />
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}

/* ── Tool split layout ────────────────────────────────── */
export function ToolLayout({
  left,
  right,
}: {
  left: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[44%] min-w-[260px] flex flex-col border-r border-[var(--bdr)] overflow-hidden">
        {left}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">{right}</div>
    </div>
  )
}

/* ── Upload zone ──────────────────────────────────────── */
export function UploadZone({
  onFile,
  accept = '.pdf',
  icon,
  title = 'Drop file here',
  sub = 'or click to browse',
  btnLabel = 'Choose File',
}: {
  onFile: (f: File) => void
  accept?: string
  icon?: React.ReactNode
  title?: string
  sub?: string
  btnLabel?: string
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 m-4 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all',
        dragging
          ? 'border-[var(--acc2)] bg-[var(--acc-g)]'
          : 'border-[var(--bdr2)] hover:border-[var(--acc2)] hover:bg-[var(--bg3)]'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="text-[var(--txt3)]">{icon}</div>
      <p className="text-[15px] font-semibold text-[var(--txt)]">{title}</p>
      <p className="text-[12px] text-[var(--txt3)]">{sub}</p>
      <button
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        className="px-4 py-2 bg-[var(--bg3)] border border-[var(--bdr2)] rounded-lg text-[var(--txt2)] text-[12px] hover:border-[var(--acc2)] hover:text-[var(--txt)] transition-all"
      >
        {btnLabel}
      </button>
      <input
        ref={inputRef} type="file" accept={accept} hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}

/* ── Action bar ───────────────────────────────────────── */
export function ActionBar({
  actions,
}: {
  actions: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    primary?: boolean
  }[]
}) {
  return (
    <div className="flex gap-2 p-3 flex-wrap border-t border-[var(--bdr)] bg-[var(--bg2)]">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all',
            a.primary
              ? 'bg-[var(--acc2)] border-[var(--acc2)] text-white hover:opacity-90'
              : 'bg-[var(--bg3)] border-[var(--bdr)] text-[var(--txt2)] hover:border-[var(--bdr2)] hover:text-[var(--txt)]'
          )}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  )
}

/* ── Chat input bar ───────────────────────────────────── */
export function ChatInputBar({
  placeholder = 'Ask anything…',
  onSend,
  disabled,
  children,
}: {
  placeholder?: string
  onSend: (text: string) => void
  disabled?: boolean
  children?: React.ReactNode
}) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  function send() {
    const t = value.trim()
    if (!t || disabled) return
    onSend(t)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  return (
    <div className="border-t border-[var(--bdr)] bg-[var(--bg)]">
      {/* Toolbar */}
      {children && (
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}

      {/* Input */}
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className={cn(
          'flex gap-3 items-end bg-[var(--bg2)] border rounded-xl px-4 py-3 transition-all',
          disabled
            ? 'border-[var(--bdr)]'
            : 'border-[var(--bdr2)] focus-within:border-[var(--acc2)] focus-within:shadow-[0_0_0_3px_rgba(88,166,255,0.1)]'
        )}>
          <textarea
            ref={ref}
            rows={1}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[14px] text-[var(--txt)] placeholder:text-[var(--txt3)] leading-relaxed max-h-[200px] overflow-y-auto"
            onChange={(e) => {
              setValue(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 200) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            onClick={send}
            disabled={disabled || !value.trim()}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-[var(--acc2)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[11px] text-[var(--txt3)] mt-2">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}