'use client'

// Versão desabilitada dos hooks de Realtime para melhor performance
// Este arquivo substitui temporariamente os hooks problemáticos

import { useState } from 'react'

export function useRealtimeNotifications() {
  return {
    notifications: [],
    unreadCount: 0,
    connectionStatus: 'disconnected' as const,
    isLoading: false,
    markAsRead: async () => false,
    markAllAsRead: async () => false,
    refetch: async () => {}
  }
}

export function useSupabaseRealtime() {
  return {
    status: {
      quotations: 'disconnected' as const,
      notifications: 'disconnected' as const,
      auditLogs: 'disconnected' as const,
      overall: 'disconnected' as const
    },
    isConnected: false,
    reconnect: () => {},
    disconnect: () => {}
  }
}

// Hook vazio para substituir o useRealTimeData original
export function useRealTimeDataOriginal() {
  return {
    quotations: [],
    suppliers: [],
    activities: [],
    metrics: {
      totalQuotations: 0,
      activeQuotations: 0,
      finalizedQuotations: 0,
      totalSuppliers: 0,
      avgResponseTime: 0,
      economyGenerated: 0,
      pncpOpportunities: 0,
      responseRate: 0,
      pendingProposals: 0
    },
    connectionStatus: 'disconnected' as const,
    isLoading: false,
    updateQuotationStatus: async () => false,
    refetch: async () => {}
  }
}