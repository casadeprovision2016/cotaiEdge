'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface DashboardMetrics {
  totalQuotations: number
  activeQuotations: number
  finalizedQuotations: number
  totalSuppliers: number
  avgResponseTime: number
  economyGenerated: number
  pncpOpportunities: number
  responseRate: number
  pendingProposals: number
}

export function useDashboardMetrics() {
  const { user } = useAuth()
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalQuotations: 0,
    activeQuotations: 0,
    finalizedQuotations: 0,
    totalSuppliers: 0,
    avgResponseTime: 0,
    economyGenerated: 0,
    pncpOpportunities: 0,
    responseRate: 0,
    pendingProposals: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    if (!user?.organization_id) {
      setIsLoading(false)
      return
    }

    try {
      // Usar função otimizada que executa todas as queries em uma única chamada
      const { data, error } = await supabase
        .rpc('get_dashboard_metrics', { org_id: user.organization_id })

      if (error) {
        console.error('Erro ao buscar métricas do dashboard:', error)
        throw error
      }

      // data já é um objeto JSON com todas as métricas
      setMetrics({
        totalQuotations: data.totalQuotations || 0,
        activeQuotations: data.activeQuotations || 0,
        finalizedQuotations: data.finalizedQuotations || 0,
        totalSuppliers: data.totalSuppliers || 0,
        avgResponseTime: data.avgResponseTime || 0,
        economyGenerated: data.economyGenerated || 0,
        pncpOpportunities: data.pncpOpportunities || 0,
        responseRate: data.responseRate || 0,
        pendingProposals: data.pendingProposals || 0
      })
      
      setError(null)
      
    } catch (err) {
      console.error('Erro inesperado ao buscar métricas:', err)
      setError('Erro ao carregar métricas do dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [user?.organization_id])

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics
  }
}