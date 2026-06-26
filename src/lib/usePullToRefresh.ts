'use client'

import { useEffect, useRef, useState } from 'react'

const PTR_THRESHOLD = 65
const PTR_MAX = 82

export function usePullToRefresh(onRefresh: () => void | Promise<void>, enabled = true) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPtrRefreshing, setIsPtrRefreshing] = useState(false)

  const touchStartY = useRef(0)
  const pullYRef = useRef(0)
  const pullActive = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    if (!enabled) return

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return
      touchStartY.current = e.touches[0].clientY
      pullActive.current = true
    }

    const onMove = (e: TouchEvent) => {
      if (!pullActive.current) return
      if (window.scrollY > 0) { pullActive.current = false; return }
      const delta = e.touches[0].clientY - touchStartY.current
      if (delta <= 0) { pullYRef.current = 0; setPullDistance(0); return }
      e.preventDefault()
      const y = Math.min(delta / 2.2, PTR_MAX)
      pullYRef.current = y
      setPullDistance(y)
    }

    const onEnd = () => {
      if (!pullActive.current) return
      pullActive.current = false
      const y = pullYRef.current
      pullYRef.current = 0
      if (y >= PTR_THRESHOLD) {
        setIsPtrRefreshing(true)
        setPullDistance(PTR_THRESHOLD)
        Promise.resolve(onRefreshRef.current()).finally(() => {
          setIsPtrRefreshing(false)
          setPullDistance(0)
        })
      } else {
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [enabled])

  return { pullDistance, isPtrRefreshing }
}
