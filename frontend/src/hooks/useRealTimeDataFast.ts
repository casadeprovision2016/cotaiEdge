'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

// Interface compatível com o componente DragDropKanban
export interface QuotationFast {
  id: string
  title: string
  status: 'abertas' | 'em_andamento' | 'respondidas' | 'finalizadas' | 'canceladas'
  created_at: string
  estimated_value?: number
  // Campos obrigatórios para compatibilidade
  organization_id: string
  number: string
  priority: 'alta' | 'media' | 'baixa'
  auto_invite: boolean
  require_documents: boolean
  updated_at: string
}

export interface SupplierFast {
  id: string
  name: string
  performance_score: number
  status: string
}

export interface ActivityFast {
  id: string
  type: 'quotation_created' | 'supplier_responded' | 'quotation_finalized' | 'document_processed'
  description: string
  created_at: string
}

export interface DashboardMetricsFast {
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

/**
 * Hook otimizado para carregamento super rápido do dashboard
 * Remove Realtime e foca apenas na velocidade de carregamento inicial
 */
// Função auxiliar para mapear tipos de atividade
function mapActivityType(action: string): ActivityFast['type'] {
  switch (action) {
    case 'INSERT':
    case 'create':
      return 'quotation_created'
    case 'proposal_submitted':
      return 'supplier_responded'
    case 'finalize':
      return 'quotation_finalized'
    default:
      return 'document_processed'
  }
}

export function useRealTimeDataFast() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [quotations, setQuotations] = useState<QuotationFast[]>([])
  const [suppliers, setSuppliers] = useState<SupplierFast[]>([])
  const [activities, setActivities] = useState<ActivityFast[]>([])
  const [metrics, setMetrics] = useState<DashboardMetricsFast>({
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
  const [connectionStatus] = useState<'connected' | 'disconnected'>('connected')

  // Função super otimizada que busca tudo em paralelo
  const fetchAllData = async () => {
    if (!user?.organization_id) {
      setIsLoading(false)
      return
    }

    try {
      // Executar todas as consultas em paralelo
      const [
        quotationsResult,
        suppliersResult,
        metricsResult,
        activitiesResult
      ] = await Promise.all([
        // 1. Cotações básicas com campos obrigatórios
        supabase
          .from('quotations')
          .select('id, title, status, created_at, estimated_value, organization_id, number, priority, auto_invite, require_documents, updated_at')
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20),

        // 2. Fornecedores básicos
        supabase
          .from('suppliers')
          .select('id, name, performance_score, status')
          .eq('organization_id', user.organization_id)
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('performance_score', { ascending: false })
          .limit(10),

        // 3. Métricas usando função otimizada
        supabase.rpc('get_dashboard_metrics', { org_id: user.organization_id }),

        // 4. Atividades recentes básicas
        supabase
          .from('audit_logs')
          .select('id, action, entity_type, created_at')
          .eq('organization_id', user.organization_id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      // Processar resultados
      if (quotationsResult.data) {
        // Garantir que todos os campos obrigatórios estão presentes
        const processedQuotations = quotationsResult.data.map(q => ({
          ...q,
          organization_id: q.organization_id || user.organization_id,
          number: q.number || 'COT-TEMP',
          priority: (q.priority as 'alta' | 'media' | 'baixa') || 'media',
          auto_invite: q.auto_invite ?? false,
          require_documents: q.require_documents ?? true,
          updated_at: q.updated_at || q.created_at
        }))
        setQuotations(processedQuotations)
      }

      if (suppliersResult.data) {
        setSuppliers(suppliersResult.data)
      }

      if (metricsResult.data) {
        setMetrics(metricsResult.data)
      }

      if (activitiesResult.data) {
        const transformedActivities = activitiesResult.data.map(log => ({
          id: log.id,
          type: mapActivityType(log.action),
          description: `${log.action} em ${log.entity_type}`,
          created_at: log.created_at
        }))
        setActivities(transformedActivities)
      }

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Função simples para atualizar status (sem Realtime)
  const updateQuotationStatus = async (quotationId: string, newStatus: QuotationFast['status']) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', quotationId)

      if (!error) {
        // Atualizar estado local
        setQuotations(prev =>
          prev.map(q =>
            q.id === quotationId ? { ...q, status: newStatus } : q
          )
        )
        
        toast({
          title: 'Status atualizado',
          description: `Cotação movida para ${newStatus}`,
        })
        
        return true
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      })
    }
    return false
  }

  // Carregar dados na inicialização
  useEffect(() => {
    fetchAllData()
  }, [user?.organization_id])

  return {
    quotations,
    suppliers,
    activities,
    metrics,
    connectionStatus,
    isLoading,
    updateQuotationStatus,
    refetch: fetchAllData
  }
}