'use client'

const PTR_THRESHOLD = 65
const CIRCUMFERENCE = 2 * Math.PI * 7.5

interface Props {
  pullDistance: number
  refreshing: boolean
}

export function PullToRefreshIndicator({ pullDistance, refreshing }: Props) {
  const visible = pullDistance > 4 || refreshing
  const translateY = refreshing ? 72 : Math.max(24, pullDistance + 24)
  const progress = Math.min(pullDistance / PTR_THRESHOLD, 1)
  const overThreshold = pullDistance >= PTR_THRESHOLD
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px) scale(${overThreshold && !refreshing ? 1.07 : 1})`,
        transition: pullDistance === 0 || refreshing
          ? 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s'
          : 'transform 0s, scale 0.15s, background 0.2s, border-color 0.2s',
        opacity: visible ? 1 : 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        background: overThreshold || refreshing ? '#ECFAF3' : '#FFFFFF',
        border: `1.5px solid ${overThreshold || refreshing ? '#52E3A0' : '#DCE5E1'}`,
        borderRadius: '999px',
        padding: '8px 16px 8px 10px',
        fontSize: '12px',
        fontWeight: 500,
        color: overThreshold || refreshing ? '#0F4F3C' : '#6B7A74',
        pointerEvents: 'none',
        boxShadow: overThreshold || refreshing
          ? '0 4px 20px rgba(82,227,160,0.25)'
          : '0 2px 12px rgba(14,21,18,0.08)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {refreshing ? (
        /* Spinning arc during refresh */
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="#C5F4DE" strokeWidth="2.5" />
          <circle
            cx="10" cy="10" r="7.5"
            fill="none"
            stroke="#0F4F3C"
            strokeWidth="2.5"
            strokeDasharray="12 35"
            strokeLinecap="round"
            style={{ animation: 'ptr-spin 0.65s linear infinite', transformOrigin: '10px 10px' }}
          />
        </svg>
      ) : (
        /* Circular progress arc while pulling */
        <svg
          width="20" height="20" viewBox="0 0 20 20"
          style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}
        >
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="#EDF2F0" strokeWidth="2.5" />
          <circle
            cx="10" cy="10" r="7.5"
            fill="none"
            stroke={overThreshold ? '#0F4F3C' : '#B9C6C0'}
            strokeWidth="2.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.15s ease, stroke-dashoffset 0.04s linear' }}
          />
        </svg>
      )}
      {refreshing ? 'Opdaterer…' : overThreshold ? 'Slip for at opdatere' : 'Træk for at opdatere'}
    </div>
  )
}
