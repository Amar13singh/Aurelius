'use client'
import { forwardRef, TextareaHTMLAttributes, ButtonHTMLAttributes, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/* ── Button ──────────────────────────────────────────── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'accent' | 'accent2' | 'danger'
  size?: 'sm' | 'md' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-1.5 rounded-md font-body font-medium transition-all duration-200 select-none disabled:opacity-30 disabled:cursor-not-allowed'

    const variants = {
      ghost:   'hover:bg-[var(--surf2)] hover:border-[var(--bdr2)] text-[var(--txt2)] hover:text-[var(--txt)] border border-transparent',
      outline: 'bg-[var(--surf2)] border border-[var(--bdr)] text-[var(--txt2)] hover:border-[var(--bdr2)] hover:text-[var(--txt)]',
      accent:  'bg-gradient-to-br from-[var(--acc)] to-[#e8c97a] text-[#2a1a00] shadow-[0_4px_14px_rgba(201,168,108,0.3)] hover:opacity-90 hover:-translate-y-px active:scale-95',
      accent2: 'bg-[var(--acc-g)] border border-[rgba(201,168,108,0.3)] text-[var(--acc)] hover:bg-[rgba(201,168,108,0.2)]',
      danger:  'bg-[var(--surf2)] border border-[var(--bdr)] text-[var(--txt2)] hover:border-red-500/50 hover:text-red-400',
    }

    const sizes = {
      sm:   'px-2.5 py-1.5 text-[11px]',
      md:   'px-3.5 py-2 text-[12.5px]',
      icon: 'w-8 h-8 text-xs',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

/* ── Badge ───────────────────────────────────────────── */
export function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider border',
        className
      )}
    >
      {children}
    </span>
  )
}

/* ── Select ──────────────────────────────────────────── */
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'bg-[var(--surf2)] border border-[var(--bdr)] rounded-md text-[var(--txt)] font-body text-[11.5px] px-2.5 py-1.5 outline-none cursor-pointer transition-colors hover:border-[var(--bdr2)]',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

/* ── OrDivider ───────────────────────────────────────── */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5">
      <div className="flex-1 h-px bg-[var(--bdr)]" />
      <span className="text-[11px] text-[var(--txt3)]">or</span>
      <div className="flex-1 h-px bg-[var(--bdr)]" />
    </div>
  )
}

/* ── Modal ───────────────────────────────────────────── */
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-slide-up"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'w-full bg-[var(--bg2)] border border-[var(--bdr2)] rounded-2xl shadow-2xl',
          maxWidth
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--bdr)]">
          <h3 className="font-display text-xl font-normal text-[var(--txt)]">
            {title}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Toast ───────────────────────────────────────────── */
export function Toast() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const el = ref.current
      if (!el) return
      el.textContent = e.detail
      el.classList.add('opacity-100', 'translate-y-0')
      el.classList.remove('opacity-0', 'translate-y-4')
      setTimeout(() => {
        el.classList.remove('opacity-100', 'translate-y-0')
        el.classList.add('opacity-0', 'translate-y-4')
      }, 2500)
    }
    window.addEventListener('toast' as never, handler as EventListener)
    return () =>
      window.removeEventListener('toast' as never, handler as EventListener)
  }, [])

  return (
    <div
      ref={ref}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 transition-all duration-300 pointer-events-none z-[100] whitespace-nowrap bg-[var(--bg2)] border border-[var(--bdr2)] text-[var(--txt)] text-[13px] px-4 py-2.5 rounded-full shadow-xl"
    />
  )
}

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: msg }))
}