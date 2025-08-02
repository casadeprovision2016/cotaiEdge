'use client'

import React, { createContext, useContext } from 'react'
import { useSupabaseRealtime, RealtimeStatus } from '@/hooks/useSupabaseRealtime'

interface RealtimeContextType {
  status: RealtimeStatus
  isConnected: boolean
  reconnect: () => void
  disconnect: () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const realtime = useSupabaseRealtime()

  return (
    <RealtimeContext.Provider value={realtime}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}