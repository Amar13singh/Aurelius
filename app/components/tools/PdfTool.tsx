'use client'
import { useState } from 'react'
import { FileText, X } from 'lucide-react'
import { useStore } from '@/store'
import { callClaude } from '@/lib/ai'
import { extractPdfText } from '@/lib/pdf'
import {
  ToolLayout,
  UploadZone,
  MessagesList,
  TypingIndicator,
  ChatInputBar,
} from '@/app/components/ui/MessageBubble'
import { toast } from '@/app/components/ui'
import { cn } from '@/lib/utils'

const QUICK = [
  'Summarize in 5 bullet points',
  'What are the key findings?',
  'List important terms & definitions',
  'What questions does this raise?',
]

// Provider badge colors — matches ChatTool
const PROVIDER_STYLES: Record<string, string> = {
  Groq:       'text-orange-400 border-orange-400/30 bg-orange-400/10',
  OpenRouter: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  Gemini:     'text-blue-400   border-blue-400/30   bg-blue-400/10',
  Puter:      'text-green-400  border-green-400/30  bg-green-400/10',
}

export function PdfTool() {
  const {
    model, thinking, setThinking, addTokens,
    pdfText, pdfFileName, pdfMessages,
    setPdfContext, addPdfMessage, updateLastMessage, clearPdf,
  } = useStore()

  const [streamingId, setStreamingId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [activeProvider, setActiveProvider] = useState<string>('')

  async function loadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast('Please upload a PDF file')
      return
    }
    setLoading(true)
    toast('Reading PDF…')
    try {
      const { text, pages } = await extractPdfText(file)
      setPdfContext(text, file.name)
      addPdfMessage(
        'assistant',
        `**${file.name}** loaded — ${pages} pages, ~${Math.ceil(
          text.length / 4
        ).toLocaleString()} tokens. Ask me anything about it.`
      )
      toast('PDF ready')
    } catch (e) {
      toast('Error reading PDF: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function ask(question: string) {
    if (!pdfText) { toast('Upload a PDF first'); return }
    if (thinking) return

    addPdfMessage('user', question)
    setThinking(true)
    const placeholder = addPdfMessage('assistant', '')
    setStreamingId(placeholder.id)

    // ✅ FIXED: slice(0, -2) removes [user question + empty placeholder]
    // THEN filter removes any other empty messages from history
    // This gives clean history WITHOUT the current exchange
    const history = useStore
      .getState()
      .pdfMessages
      .slice(0, -2)
      .filter((m) => m.content !== '')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Trim PDF to safe size for all providers
    const trimmedPdf = pdfText.slice(0, 40000)

    await callClaude({
      messages: [...history, { role: 'user', content: question }],
      systemPrompt: `You are an expert document analyst. Answer questions based ONLY on the following document.\n\n--- DOCUMENT ---\n${trimmedPdf}`,
      model,
      stream: true, // ✅ FIXED: was hardcoded false, broke Groq/OpenRouter
      onToken: (full) => {
        if (!full) return // ✅ FIXED: guard against empty reset during provider fallback
        updateLastMessage('pdf', full)
        addTokens(full.slice(-20))
      },
      onDone: (full) => {
        updateLastMessage('pdf', full)
        addTokens(full)
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('pdf', err)
        setStreamingId(undefined)
        setThinking(false)
      },
      onProvider: (name) => setActiveProvider(name),
    })
  }

  return (
    <ToolLayout
      left={
        pdfText ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* File header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--bdr)] flex-shrink-0">
              <FileText size={14} className="text-[var(--acc)] flex-shrink-0" />
              <span className="flex-1 text-[12.5px] font-semibold text-[var(--txt)] truncate">
                {pdfFileName}
              </span>
              <button
                onClick={() => {
                  clearPdf()
                  setActiveProvider('')
                  toast('PDF cleared')
                }}
                className="text-[var(--txt3)] hover:text-red-400 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Text preview */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] text-[var(--txt2)] leading-relaxed whitespace-pre-wrap">
              {pdfText.slice(0, 10000)}
              {pdfText.length > 10000 && (
                <span className="text-[var(--txt3)]">
                  {'\n\n'}[…truncated for display…]
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3 p-10 text-[var(--txt2)]">
                <div className="w-8 h-8 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px]">Reading PDF…</p>
              </div>
            ) : (
              <UploadZone
                onFile={loadFile}
                accept=".pdf"
                icon={<FileText size={32} />}
                title="Drop PDF here"
                sub="Drag & drop or click to browse"
                btnLabel="Choose PDF"
              />
            )}
          </div>
        )
      }
      right={
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Quick action buttons */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--bdr)] flex-wrap">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--txt3)] mr-1">
              Quick
            </span>
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={!pdfText || thinking}
                className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--surf2)] border border-[var(--bdr)] text-[var(--txt2)] hover:bg-[var(--acc-g)] hover:border-[rgba(201,168,108,0.3)] hover:text-[var(--acc)] disabled:opacity-40 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <MessagesList messages={pdfMessages} streamingId={streamingId}>
            {!pdfMessages.length && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--txt3)] py-16">
                <FileText size={36} className="opacity-20" />
                <p className="text-[13px]">
                  Upload a PDF to start asking questions
                </p>
              </div>
            )}
            {thinking &&
              pdfMessages[pdfMessages.length - 1]?.content === '' && (
                <TypingIndicator />
              )}
          </MessagesList>

          {/* Input with provider badge */}
          <ChatInputBar
            placeholder="Ask anything about this PDF…"
            onSend={ask}
            disabled={thinking || !pdfText}
          >
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
          </ChatInputBar>

        </div>
      }
    />
  )
}