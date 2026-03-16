'use client'
import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from '@/app/components/ui'

/* ── Code block with copy button ─────────────────────── */
function CodeBlock({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const lang = (className ?? '').replace('language-', '') || 'code'
  const text = String(children ?? '').trim()

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[var(--bdr2)] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-[var(--bdr)]">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-[var(--acc)]">
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--txt3)] border border-[var(--bdr)] px-2 py-0.5 rounded hover:text-[var(--txt)] hover:border-[var(--bdr2)] transition-colors"
        >
          {copied ? (
            <Check size={10} className="text-emerald-400" />
          ) : (
            <Copy size={10} />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-black/30 p-4 overflow-x-auto">
        <code className="font-mono text-[13px] leading-relaxed text-[var(--txt)]">
          {text}
        </code>
      </pre>
    </div>
  )
}

/* ── Single message bubble ────────────────────────────── */
interface MessageBubbleProps {
  message: Message
  streaming?: boolean
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast('Copied')
  }

  return (
    <div
      className={cn(
        'group flex gap-3 px-5 py-2 animate-slide-up',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-[9px] flex items-center justify-center text-[13px] font-display font-semibold flex-shrink-0 mt-1',
          isUser
            ? 'bg-gradient-to-br from-[var(--acc)] to-[#e8c97a] text-[#2a1a00]'
            : 'bg-gradient-to-br from-[var(--acc2)] to-[#5ba0c8] text-[#001828]'
        )}
      >
        {isUser ? 'Y' : 'A'}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 min-w-0',
          isUser ? 'items-end flex flex-col' : ''
        )}
      >
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-[12.5px] font-semibold text-[var(--txt)]">
            {isUser ? 'You' : 'Aurelius'}
          </span>
          <span className="font-mono text-[10px] text-[var(--txt3)]">
            {message.timestamp instanceof Date
              ? message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
        </div>

        <div
          className={cn(
            'text-[14px] leading-relaxed max-w-[700px]',
            isUser
              ? 'bg-[var(--acc-g)] border border-[rgba(201,168,108,0.12)] border-l-2 border-l-[var(--acc)] rounded-xl px-4 py-3 text-[var(--txt)]'
              : 'prose-ai'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={cn(streaming && 'cursor-blink')}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  code({ node, className, children, ref, ...props }) {
                    const isBlock = String(children).includes('\n')
                    if (isBlock)
                      return (
                        <CodeBlock className={className}>
                          {children}
                        </CodeBlock>
                      )
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  pre({ node, children, ref, ...props }) {
                    return <>{children}</>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 w-6 h-6 flex items-center justify-center rounded bg-[var(--surf2)] border border-[var(--bdr)] text-[var(--txt3)] hover:text-[var(--txt)]"
      >
        {copied ? (
          <Check size={10} className="text-emerald-400" />
        ) : (
          <Copy size={10} />
        )}
      </button>
    </div>
  )
}

/* ── Typing indicator ─────────────────────────────────── */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-5 py-3">
      <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[var(--acc2)] to-[#5ba0c8] flex items-center justify-center text-[13px] font-display font-semibold text-[#001828] flex-shrink-0">
        A
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--acc2)] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Messages scroll list ─────────────────────────────── */
interface MessagesListProps {
  messages: Message[]
  streamingId?: string
  children?: React.ReactNode
}

export function MessagesList({
  messages,
  streamingId,
  children,
}: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingId])

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {children}
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          streaming={m.id === streamingId}
        />
      ))}
      <div ref={bottomRef} />
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
interface UploadZoneProps {
  onFile: (f: File) => void
  accept?: string
  icon?: React.ReactNode
  title?: string
  sub?: string
  btnLabel?: string
}

export function UploadZone({
  onFile,
  accept = '.pdf',
  icon,
  title = 'Drop file here',
  sub = 'or click to browse',
  btnLabel = 'Choose File',
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 m-4 p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
        dragging
          ? 'border-[var(--acc)] bg-[var(--acc-g)]'
          : 'border-[var(--bdr2)] hover:border-[var(--acc)] hover:bg-[var(--acc-g)]'
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="text-[var(--acc)] opacity-70">{icon}</div>
      <p className="font-display text-xl font-light text-[var(--txt)]">
        {title}
      </p>
      <p className="text-[12px] text-[var(--txt3)]">{sub}</p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          inputRef.current?.click()
        }}
        className="px-5 py-2 bg-[var(--acc-g)] border border-[rgba(201,168,108,0.3)] rounded-md text-[var(--acc)] text-[12px] hover:bg-[rgba(201,168,108,0.2)] transition-colors"
      >
        {btnLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
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
    <div className="flex gap-2 p-3 flex-wrap border-t border-[var(--bdr)]">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-body border transition-all',
            a.primary
              ? 'bg-[var(--acc-g)] border-[rgba(201,168,108,0.3)] text-[var(--acc)] hover:bg-[rgba(201,168,108,0.2)]'
              : 'bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt2)] hover:border-[var(--bdr2)] hover:text-[var(--txt)]'
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
    <div className="border-t border-[var(--bdr)] bg-[var(--surf)] backdrop-blur-2xl">
      {children && (
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}
      <div className="flex gap-2 items-end px-3 pb-3 pt-1">
        <div
          className={cn(
            'flex-1 bg-[var(--bg2)] border rounded-xl transition-all',
            disabled
              ? 'border-[var(--bdr)]'
              : 'border-[var(--bdr2)] focus-within:border-[var(--acc)] focus-within:shadow-[0_0_0_3px_var(--acc-g)]'
          )}
        >
          <textarea
            ref={ref}
            rows={1}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-[14px] text-[var(--txt)] placeholder:text-[var(--txt3)] leading-relaxed max-h-[180px] overflow-y-auto font-body"
            onChange={(e) => {
              setValue(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 180) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
        </div>
        <button
          onClick={send}
          disabled={disabled || !value.trim()}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--acc)] to-[#e8c97a] text-[#2a1a00] shadow-[0_4px_14px_rgba(201,168,108,0.3)] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 hover:-translate-y-px active:scale-95 transition-all"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="px-4 pb-2 text-[11px] text-[var(--txt3)]">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}