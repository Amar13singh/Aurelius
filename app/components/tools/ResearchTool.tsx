'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '@/store'
import { callClaude } from '@/lib/ai'
import { extractPdfText } from '@/lib/pdf'
import {
  ToolLayout,
  UploadZone,
  MessagesList,
  TypingIndicator,
  ChatInputBar,
  ActionBar,
} from '@/app/components/ui/MessageBubble'
import { OrDivider, toast } from '@/app/components/ui'

const ANALYSIS_PROMPTS: Record<string, string> = {
  summarize:
    'Provide a structured summary with these sections: **Abstract**, **Problem Statement**, **Methodology**, **Key Results**, **Conclusions**, **Limitations**, **Future Work**.',
  methodology:
    'Analyze the research methodology in detail: study design, data collection, sample size, statistical methods, validity, and methodological limitations.',
  findings:
    'Extract and explain all key findings. Highlight what is novel, statistically significant, and practically impactful. Use bullet points.',
  critique:
    'Provide a critical academic review: strengths, weaknesses, methodological concerns, potential biases, how claims are supported by evidence.',
  eli5: 'Explain this paper as if to a curious 15-year-old. Simple language, analogies, no jargon. Focus on why it matters and what was discovered.',
  citation:
    'Generate formatted citations in APA, MLA, and Chicago styles. Also suggest 5 related papers or topics this work connects to.',
}

export function ResearchTool() {
  const {
    model, thinking, setThinking, addTokens,
    researchText, researchFileName,
    researchMessages, setResearchContext,
    addResearchMessage, updateLastMessage,
    clearResearch, clearResearchMessages,
  } = useStore()

  const [pastedText, setPastedText] = useState('')
  const [streamingId, setStreamingId] = useState<string | undefined>()
 const [researchHistory, setResearchHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const activeText = researchText || pastedText

  async function loadFile(file: File) {
    setLoading(true)
    toast('Loading paper…')
    try {
      let text = ''
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const { text: t } = await extractPdfText(file)
        text = t
      } else {
        text = await file.text()
      }
      setResearchContext(text, file.name)
      setPastedText('')
      setResearchHistory([])
      addResearchMessage(
        'assistant',
        `**${file.name}** loaded. Ready for analysis.`
      )
      toast('Paper loaded')
    } catch (e) {
      toast('Error: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function analyze(mode: string) {
    if (!activeText.trim()) {
      toast('Upload a paper or paste text first')
      return
    }
    if (thinking) return

    const prompt = ANALYSIS_PROMPTS[mode]
    const content = `${prompt}\n\n---\n${activeText.slice(0, 60000)}`
    const history: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content },
    ]
    setResearchHistory(history)

    // store pasted text as context if no file loaded
    if (pastedText && !researchText) {
      setResearchContext(pastedText, 'Pasted text')
    }

    clearResearchMessages()
    addResearchMessage(
      'user',
      `**${mode.charAt(0).toUpperCase() + mode.slice(1)}** analysis`
    )
    setThinking(true)
    const placeholder = addResearchMessage('assistant', '')
    setStreamingId(placeholder.id)

    await callClaude({
      messages: history,
      systemPrompt:
        'You are an expert academic researcher and scientific writer. Analyze research papers with rigor, precision, and clarity.',
      model,
      stream: true,
      onToken: (full) => {
        updateLastMessage('research', full)
        addTokens(full.slice(-30))
      },
      onDone: (full) => {
        updateLastMessage('research', full)
        setResearchHistory((h) => [
          ...h,
          { role: 'assistant', content: full },
        ])
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('research', err)
        setStreamingId(undefined)
        setThinking(false)
      },
    })
  }

  async function askQuestion(q: string) {
    if (!activeText.trim()) { toast('Load a paper first'); return }
    if (thinking) return

    const history: { role: 'user' | 'assistant'; content: string }[] =
      researchHistory.length
        ? researchHistory
        : [
            {
              role: 'user',
              content: `Research paper:\n\n${activeText.slice(0, 60000)}`,
            },
            {
              role: 'assistant',
              content:
                'I have read the paper. What would you like to know?',
            },
          ]

    const next: { role: 'user' | 'assistant'; content: string }[] = [
      ...history,
      { role: 'user', content: q },
    ]
    setResearchHistory(next)
    addResearchMessage('user', q)
    setThinking(true)
    const placeholder = addResearchMessage('assistant', '')
    setStreamingId(placeholder.id)

    await callClaude({
      messages: next,
      systemPrompt:
        'You are an expert academic researcher. Answer questions about research papers with precision.',
      model,
      stream: true,
      onToken: (full) => { updateLastMessage('research', full) },
      onDone: (full) => {
        updateLastMessage('research', full)
        setResearchHistory((h) => [
          ...h,
          { role: 'assistant', content: full },
        ])
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('research', err)
        setStreamingId(undefined)
        setThinking(false)
      },
    })
  }

  return (
    <ToolLayout
      left={
        <div className="flex flex-col flex-1 overflow-hidden">
          {researchText ? (
            <>
              {/* File header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--bdr)] flex-shrink-0">
                <Search
                  size={13}
                  className="text-[var(--acc)] flex-shrink-0"
                />
                <span className="flex-1 text-[12.5px] font-semibold text-[var(--txt)] truncate">
                  {researchFileName}
                </span>
                <button
                  onClick={() => {
                    clearResearch()
                    setPastedText('')
                    toast('Paper cleared')
                  }}
                  className="text-[var(--txt3)] hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Text preview */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] text-[var(--txt2)] leading-relaxed whitespace-pre-wrap">
                {researchText.slice(0, 8000)}
                {researchText.length > 8000 && (
                  <span className="text-[var(--txt3)]">
                    {'\n\n'}[…truncated…]
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              {loading ? (
                <div className="flex flex-col items-center gap-3 p-10 text-[var(--txt2)] flex-1 justify-center">
                  <div className="w-8 h-8 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[13px]">Loading paper…</p>
                </div>
              ) : (
                <UploadZone
                  onFile={loadFile}
                  accept=".pdf,.txt"
                  icon={<Search size={28} />}
                  title="Upload Research Paper"
                  sub="PDF or .txt file"
                  btnLabel="Choose File"
                />
              )}

              <OrDivider />

              {/* Paste text area */}
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Or paste abstract / full text here…"
                className="flex-1 bg-[var(--bg3)] border-none outline-none resize-none p-4 font-body text-[13px] text-[var(--txt)] leading-relaxed placeholder:text-[var(--txt3)] min-h-[140px]"
              />
            </>
          )}

          {/* Action buttons */}
          <ActionBar
            actions={[
              { label: 'Summarize',    onClick: () => analyze('summarize'),    primary: true },
              { label: 'Methodology',  onClick: () => analyze('methodology') },
              { label: 'Key Findings', onClick: () => analyze('findings') },
              { label: 'Critique',     onClick: () => analyze('critique') },
              { label: 'ELI5',         onClick: () => analyze('eli5') },
              { label: 'Citation',     onClick: () => analyze('citation') },
            ]}
          />
        </div>
      }
      right={
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--bdr)] flex-shrink-0">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--txt3)]">
              Analysis
            </span>
          </div>

          <MessagesList messages={researchMessages} streamingId={streamingId}>
            {!researchMessages.length && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--txt3)] py-16">
                <Search size={36} className="opacity-20" />
                <p className="text-[13px]">
                  Upload a paper or paste text to begin
                </p>
              </div>
            )}
            {thinking &&
              researchMessages[researchMessages.length - 1]?.content ===
                '' && <TypingIndicator />}
          </MessagesList>

          <ChatInputBar
            placeholder="Ask a specific question about the paper…"
            onSend={askQuestion}
            disabled={thinking}
          />
        </div>
      }
    />
  )
}