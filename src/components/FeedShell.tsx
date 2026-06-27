'use client'

import { useRouter } from 'next/navigation'
import { usePullToRefresh } from '@/lib/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator'

export default function FeedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { pullDistance, isPtrRefreshing } = usePullToRefresh(() => router.refresh())

  return (
    <>
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={isPtrRefreshing} />
      <div
        style={{
          transform: `translateY(${Math.round(pullDistance * 0.38)}px)`,
          transition: pullDistance === 0
            ? 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)'
            : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </>
  )
}
