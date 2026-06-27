'use client'

const PTR_THRESHOLD = 65

interface Props {
  pullDistance: number
  refreshing: boolean
}

export function PullToRefreshIndicator({ pullDistance, refreshing }: Props) {
  const visible = pullDistance > 4 || refreshing
  const translateY = refreshing ? 70 : Math.max(22, pullDistance + 22)
  const arrowRotation = Math.min((pullDistance / PTR_THRESHOLD) * 180, 180)
  const overThreshold = pullDistance >= PTR_THRESHOLD

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px)`,
        transition: pullDistance === 0 || refreshing
          ? 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s'
          : 'none',
        opacity: visible ? 1 : 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#FFFFFF',
        border: '1px solid #DCE5E1',
        borderRadius: '999px',
        padding: '7px 16px 7px 12px',
        fontSize: '12px',
        color: overThreshold || refreshing ? '#0F4F3C' : '#6B7A74',
        pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(14,21,18,0.1)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {refreshing ? (
        <span className="ptr-spinner" />
      ) : (
        <span style={{
          display: 'inline-block',
          transform: `rotate(${arrowRotation}deg)`,
          transition: 'transform 0.1s',
          fontSize: '14px',
          lineHeight: 1,
        }}>↓</span>
      )}
      {refreshing ? 'Opdaterer…' : overThreshold ? 'Slip for at opdatere' : 'Træk for at opdatere'}
    </div>
  )
}
