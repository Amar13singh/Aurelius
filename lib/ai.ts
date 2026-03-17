// import type { Message, Model } from '@/types'

// declare global {
//   interface Window {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     puter: any
//   }
// }

// interface CallOptions {
//   messages: Pick<Message, 'role' | 'content'>[]
//   systemPrompt?: string
//   model: Model
//   stream?: boolean
//   onToken?: (full: string) => void
//   onDone: (full: string) => void
//   onError: (err: string) => void
// }

// export async function callClaude({
//   messages,
//   systemPrompt,
//   model,
//   stream = true,
//   onToken,
//   onDone,
//   onError,
// }: CallOptions) {
//   const puter = window.puter
//   if (!puter) {
//     onError('Puter.js not loaded. Make sure you are online.')
//     return
//   }

//   const msgs: { role: string; content: string }[] = []
//   if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
//   msgs.push(...messages.map((m) => ({ role: m.role, content: m.content })))

//   try {
//     if (stream) {
//       const iter = await puter.ai.chat(msgs, { model, stream: true })
//       let full = ''
//       for await (const chunk of iter) {
//         const token: string = chunk?.text ?? chunk?.delta?.text ?? ''
//         if (token) {
//           full += token
//           onToken?.(full)
//         }
//       }
//       onDone(full)
//     } else {
//       const res = await puter.ai.chat(msgs, { model })
//       const text: string =
//         res?.message?.content?.[0]?.text ?? res?.text ?? String(res)
//       onDone(text)
//     }
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : 'Unknown error'
//     onError(
//       `**Error:** ${message}. Make sure you are signed into [puter.com](https://puter.com).`
//     )
//   }
// }

// export function estimateTokens(text: string) {
//   return Math.ceil(text.length / 4)
// }




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
  onProvider?: (name: string) => void // tells UI which provider is active
}

// ─────────────────────────────────────────────
// Removes Puter popup from DOM instantly
// Called as soon as Puter fails & we switch provider
// ─────────────────────────────────────────────
function dismissPuterPopup() {
  const selectors = [
    '.puter-dialog',
    '.puter-modal',
    '.puter-overlay',
    '#puter-dialog',
    '#puter-modal',
    '[class*="puter-"]',
  ]
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove())
  })
  // Restore body scroll/pointer in case Puter locked it
  document.body.style.overflow = ''
  document.body.style.pointerEvents = ''
}

// ─────────────────────────────────────────────
// Provider 1 — Groq (primary, 500K tokens/day free)
// Get free API key: https://console.groq.com
// Add to .env.local: NEXT_PUBLIC_GROQ_API_KEY=xxx
// ─────────────────────────────────────────────
async function callViaGroq(
  msgs: { role: string; content: string }[],
  onToken?: (full: string) => void
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key not set')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: msgs,
      stream: !!onToken,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? `Groq error ${res.status}`)
  }

  // Streaming
  if (onToken && res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(Boolean)
      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
        try {
          const json = JSON.parse(line.replace('data: ', ''))
          const token = json.choices?.[0]?.delta?.content ?? ''
          if (token) { full += token; onToken(full) }
        } catch { /* skip malformed chunks */ }
      }
    }
    return full
  }

  // Non-streaming
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ─────────────────────────────────────────────
// Provider 2 — OpenRouter (1000 req/day free w/ $10 deposit)
// Get free API key: https://openrouter.ai
// Add to .env.local: NEXT_PUBLIC_OPENROUTER_API_KEY=xxx
// ─────────────────────────────────────────────
async function callViaOpenRouter(
  msgs: { role: string; content: string }[],
  onToken?: (full: string) => void
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not set')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aurelius.app',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: msgs,
      stream: !!onToken,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? `OpenRouter error ${res.status}`)
  }

  // Streaming
  if (onToken && res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(Boolean)
      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
        try {
          const json = JSON.parse(line.replace('data: ', ''))
          const token = json.choices?.[0]?.delta?.content ?? ''
          if (token) { full += token; onToken(full) }
        } catch { /* skip malformed chunks */ }
      }
    }
    return full
  }

  // Non-streaming
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ─────────────────────────────────────────────
// Provider 3 — Google Gemini (250 req/day free)
// Get free API key: https://aistudio.google.com
// Add to .env.local: NEXT_PUBLIC_GEMINI_API_KEY=xxx
// ─────────────────────────────────────────────
async function callViaGemini(
  msgs: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not set')

  const contents = msgs
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemMsg = msgs.find((m) => m.role === 'system')?.content

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemMsg && {
          systemInstruction: { parts: [{ text: systemMsg }] },
        }),
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`)
  }

  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ─────────────────────────────────────────────
// Provider 4 — Puter.js (last resort only)
// Wrapped in 5s timeout so popup never lingers long
// ─────────────────────────────────────────────
async function callViaPuter(
  msgs: { role: string; content: string }[],
  model: Model,
  stream: boolean,
  onToken?: (full: string) => void
): Promise<string> {
  const puter = window.puter
  if (!puter) throw new Error('Puter.js not loaded')

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Puter timeout')), 5000)
  )

  const puterCall = async (): Promise<string> => {
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
      return full
    } else {
      const res = await puter.ai.chat(msgs, { model })
      return res?.message?.content?.[0]?.text ?? res?.text ?? String(res)
    }
  }

  return Promise.race([puterCall(), timeout])
}

// ─────────────────────────────────────────────
// MAIN FUNCTION — Auto-fallback across all providers
// Order: Groq → OpenRouter → Gemini → Puter (last)
// Puter popup auto-dismissed on failure
// onProvider tells UI which provider is responding
// ─────────────────────────────────────────────
export async function callClaude({
  messages,
  systemPrompt,
  model,
  stream = true,
  onToken,
  onDone,
  onError,
  onProvider,
}: CallOptions) {
  const msgs: { role: string; content: string }[] = []
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
  msgs.push(...messages.map((m) => ({ role: m.role, content: m.content })))

  const providers = [
    {
      name: 'Groq',
      call: () => callViaGroq(msgs, stream ? onToken : undefined),
    },
    {
      name: 'OpenRouter',
      call: () => callViaOpenRouter(msgs, stream ? onToken : undefined),
    },
    {
      name: 'Gemini',
      call: () => callViaGemini(msgs),
    },
    {
      name: 'Puter',
      call: () => callViaPuter(msgs, model, stream, onToken),
    },
  ]

  const errors: string[] = []

  for (const provider of providers) {
    try {
      console.log(`[AI] Trying ${provider.name}...`)
      const result = await provider.call()
      if (result) {
        console.log(`[AI] Success via ${provider.name}`)
        onProvider?.(provider.name)  // tell UI which provider responded
        onDone(result)
        return
      }
      throw new Error('Empty response')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.warn(`[AI] ${provider.name} failed: ${msg}`)
      errors.push(`**${provider.name}:** ${msg}`)

      // Dismiss Puter popup immediately + safety sweeps for late renders
      if (provider.name === 'Puter') {
        dismissPuterPopup()
        setTimeout(dismissPuterPopup, 100)
        setTimeout(dismissPuterPopup, 500)
      }

      // Clear any partial streamed tokens before trying next provider
      onToken?.('')
    }
  }

  // All providers failed
  onError(
    `All AI providers failed. Errors:\n\n${errors.join('\n\n')}\n\nCheck your API keys in \`.env.local\`.`
  )
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}