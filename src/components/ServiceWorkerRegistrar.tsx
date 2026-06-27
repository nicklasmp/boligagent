'use client'

import { useEffect, useState } from 'react'

const BUNDLE_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? '0'
const CHECK_INTERVAL = 60_000

export function ServiceWorkerRegistrar() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [versionUpdate, setVersionUpdate] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const wire = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting)
        return
      }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(sw)
          }
        })
      })
    }

    navigator.serviceWorker.register('/sw.js').then(reg => {
      wire(reg)
      const intervalId = setInterval(() => reg.update(), CHECK_INTERVAL)
      const onVisible = () => { if (document.visibilityState === 'visible') reg.update() }
      document.addEventListener('visibilitychange', onVisible)
      return () => {
        clearInterval(intervalId)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }).catch(() => {})

    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading) { reloading = true; window.location.reload() }
    })
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const { v } = await res.json()
        if (v && v !== BUNDLE_BUILD_ID) setVersionUpdate(true)
      } catch {}
    }

    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)
    const id = setInterval(check, CHECK_INTERVAL)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(id)
    }
  }, [])

  const showBanner = !!waitingWorker || versionUpdate

  function handleUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  if (!showBanner) return null

  return (
    <div
      role="status"
      className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none"
    >
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#FFFFFF',
        border: '1px solid #DCE5E1',
        borderRadius: '999px',
        padding: '10px 10px 10px 18px',
        boxShadow: '0 4px 24px rgba(14,21,18,0.12)',
        whiteSpace: 'nowrap',
        animation: 'card-in 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <span style={{ fontSize: '13px', color: '#0E1512' }}>
        Ny version tilgængelig
      </span>
      <button
        onClick={handleUpdate}
        style={{
          background: '#0F4F3C',
          color: '#ffffff',
          border: 'none',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Opdater nu
      </button>
    </div>
    </div>
  )
}
