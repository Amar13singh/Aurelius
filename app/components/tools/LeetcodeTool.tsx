'use client'
import { useState } from 'react'
import { GitBranch } from 'lucide-react'
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

type LcLang = 'python' | 'javascript' | 'typescript' | 'java' | 'c++' | 'go' | 'rust'
type Difficulty = 'any' | 'easy' | 'medium' | 'hard'

function buildPrompt(
  mode: string,
  lang: string,
  difficulty: string,
  problem: string
): string {
  const diff = difficulty !== 'any' ? ` (${difficulty} difficulty)` : ''
  const prompts: Record<string, string> = {
    solve: `Solve this LeetCode problem in ${lang}${diff}.\n\n1. **Approach** — strategy and key observations\n2. **Solution** — clean, commented ${lang} code\n3. **Time Complexity** — with explanation\n4. **Space Complexity** — with explanation\n5. **Edge Cases** — what to watch out for`,
    approach: `Explain the optimal approach for this problem WITHOUT writing the full code${diff}. Cover: key observations, algorithm strategy, data structures, and why this approach is optimal.`,
    hint: `Give 3 progressive hints for this problem${diff}. Start very subtle, get more specific. Do NOT reveal the full solution.`,
    complexity: `Analyze the time and space complexity of all reasonable approaches for this problem${diff}. Show the trade-offs between them.`,
    similar: `List 6 similar LeetCode problems that use the same technique/pattern${diff}. For each: problem name, difficulty, why it's similar, and the key pattern.`,
  }
  return `${prompts[mode] ?? prompts.solve}\n\n---\n**Problem:**\n${problem}`
}

export function LeetcodeTool() {
  const {
    model, thinking, setThinking, addTokens,
    lcMessages, addLcMessage, updateLastMessage, clearLcMessages,
  } = useStore()

  const [problem, setProblem] = useState('')
  const [lang, setLang] = useState<LcLang>('python')
  const [difficulty, setDifficulty] = useState<Difficulty>('any')
  const [streamingId, setStreamingId] = useState<string | undefined>()
 const [lcHistory, setLcHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  async function solve(mode: string) {
    if (!problem.trim()) { toast('Paste a LeetCode problem first'); return }
    if (thinking) return

    clearLcMessages()
    const prompt = buildPrompt(mode, lang, difficulty, problem)
    const history: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: prompt },
    ]
    setLcHistory(history)

    addLcMessage('user', `**${mode.charAt(0).toUpperCase() + mode.slice(1)}** in ${lang}`)
    setThinking(true)
    const placeholder = addLcMessage('assistant', '')
    setStreamingId(placeholder.id)

    await callClaude({
      messages: history,
      systemPrompt: `You are a competitive programming expert and LeetCode master. You explain algorithms clearly with clean, production-quality ${lang} code. Always include time and space complexity analysis.`,
      model,
      stream: true,
      onToken: (full) => {
        updateLastMessage('lc', full)
        addTokens(full.slice(-30))
      },
      onDone: (full) => {
        updateLastMessage('lc', full)
        setLcHistory((h) => [...h, { role: 'assistant', content: full }])
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('lc', err)
        setStreamingId(undefined)
        setThinking(false)
      },
    })
  }

  async function followup(q: string) {
    if (!lcHistory.length) { toast('Solve a problem first'); return }
    if (thinking) return

    const next: { role: 'user' | 'assistant'; content: string }[] = [
      ...lcHistory,
      { role: 'user', content: q },
    ]
    setLcHistory(next)
    addLcMessage('user', q)
    setThinking(true)
    const placeholder = addLcMessage('assistant', '')
    setStreamingId(placeholder.id)

    await callClaude({
      messages: next,
      systemPrompt: `You are a competitive programming expert. Answer follow-up questions about the solution concisely.`,
      model,
      stream: true,
      onToken: (full) => { updateLastMessage('lc', full) },
      onDone: (full) => {
        updateLastMessage('lc', full)
        setLcHistory((h) => [...h, { role: 'assistant', content: full }])
        setStreamingId(undefined)
        setThinking(false)
      },
      onError: (err) => {
        updateLastMessage('lc', err)
        setStreamingId(undefined)
        setThinking(false)
      },
    })
  }

  return (
    <ToolLayout
      left={
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Controls */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--bdr)] flex-shrink-0 flex-wrap">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--txt3)] mr-1">
              Problem
            </span>
            <Select
              value={lang}
              onChange={(e) => setLang(e.target.value as LcLang)}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="c++">C++</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </Select>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="any">Any difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>

          {/* Problem input */}
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder={`Paste the LeetCode problem here…\n\nExample:\nGiven an array of integers nums and an\ninteger target, return indices of the two\nnumbers that add up to target.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\nConstraints:\n2 <= nums.length <= 10^4`}
            className="flex-1 bg-[var(--bg3)] border-none outline-none resize-none p-4 font-mono text-[12.5px] text-[var(--txt)] leading-relaxed placeholder:text-[var(--txt3)]"
            spellCheck={false}
          />

          {/* Action buttons */}
          <ActionBar
            actions={[
              { label: 'Solve It',         onClick: () => solve('solve'),      primary: true },
              { label: 'Approach Only',    onClick: () => solve('approach') },
              { label: 'Hint Only',        onClick: () => solve('hint') },
              { label: 'Complexity',       onClick: () => solve('complexity') },
              { label: 'Similar Problems', onClick: () => solve('similar') },
            ]}
          />
        </div>
      }
      right={
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--bdr)] flex-shrink-0">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--txt3)]">
              Solution & Explanation
            </span>
          </div>

          <MessagesList messages={lcMessages} streamingId={streamingId}>
            {!lcMessages.length && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--txt3)] py-16">
                <GitBranch size={36} className="opacity-20" />
                <p className="text-[13px]">
                  Paste a problem and click Solve It
                </p>
              </div>
            )}
            {thinking &&
              lcMessages[lcMessages.length - 1]?.content === '' && (
                <TypingIndicator />
              )}
          </MessagesList>

          <ChatInputBar
            placeholder="Ask a follow-up about the solution…"
            onSend={followup}
            disabled={thinking}
          />
        </div>
      }
    />
  )
}