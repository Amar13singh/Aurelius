import type { Message, Model } from '@/types'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    puter: any
  }
}

interface CallOptions {
  messages: Pick<Message, 'role' | 'content'>[]
  systemPrompt?: string
  model: Model
  stream?: boolean
  onToken?: (full: string) => void
  onDone: (full: string) => void
  onError: (err: string) => void
}

export async function callClaude({
  messages,
  systemPrompt,
  model,
  stream = true,
  onToken,
  onDone,
  onError,
}: CallOptions) {
  const puter = window.puter
  if (!puter) {
    onError('Puter.js not loaded. Make sure you are online.')
    return
  }

  const msgs: { role: string; content: string }[] = []
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
  msgs.push(...messages.map((m) => ({ role: m.role, content: m.content })))

  try {
    if (stream) {
      const iter = await puter.ai.chat(msgs, { model, stream: true })
      let full = ''
      for await (const chunk of iter) {
        const token: string = chunk?.text ?? chunk?.delta?.text ?? ''
        if (token) {
          full += token
          onToken?.(full)
        }
      }
      onDone(full)
    } else {
      const res = await puter.ai.chat(msgs, { model })
      const text: string =
        res?.message?.content?.[0]?.text ?? res?.text ?? String(res)
      onDone(text)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    onError(
      `**Error:** ${message}. Make sure you are signed into [puter.com](https://puter.com).`
    )
  }
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}