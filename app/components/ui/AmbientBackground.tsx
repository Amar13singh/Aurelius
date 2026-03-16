export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden
    >
      {/* Top right gold orb */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          top: '-150px',
          right: '-100px',
          background:
            'radial-gradient(circle, var(--orb1), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'drift 20s ease-in-out infinite',
        }}
      />
      {/* Bottom center blue orb */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          bottom: '-80px',
          left: '25%',
          background:
            'radial-gradient(circle, var(--orb2), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'drift 20s ease-in-out infinite',
          animationDelay: '-7s',
        }}
      />
      {/* Left purple orb */}
      <div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          top: '45%',
          left: '-80px',
          background:
            'radial-gradient(circle, var(--orb3), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'drift 20s ease-in-out infinite',
          animationDelay: '-14s',
        }}
      />
    </div>
  )
}