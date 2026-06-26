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
      {children}
    </>
  )
}
