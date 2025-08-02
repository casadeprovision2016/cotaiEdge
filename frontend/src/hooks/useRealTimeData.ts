'use client'

import { useState, useEffect } from 'react'
import { supabase, AuditLog } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useQuotations } from './useQuotations'
import { useSuppliers } from './useSuppliers'
import { useDashboardMetrics } from './useDashboardMetrics'
import { useRealtimeNotifications } from './useRealtimeNotifications'
import { useSupabaseRealtime } from './useSupabaseRealtime'

// Re-export interfaces for backward compatibility
export interface Quotation {
  id: string
  title: string
  status: 'abertas' | 'em_andamento' | 'respondidas' | 'finalizadas' | 'canceladas'
  description?: string
  deadline?: string
  suppliers_count: number
  created_at: string
  updated_at: string
  organization_id?: string
}

export interface Supplier {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  performance_score: number
  response_time_avg: number
}

export interface Activity {
  id: string
  type: 'quotation_created' | 'supplier_responded' | 'quotation_finalized' | 'document_processed'
  description: string
  user_id?: string
  quotation_id?: string
  created_at: string
}

export interface DashboardMetrics {
  totalQuotations: number
  activeQuotations: number
  finalizedQuotations: number
  totalSuppliers: number
  avgResponseTime: number
  economyGenerated: number
  pncpOpportunities: number
}

export function useRealTimeData() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Usar hooks especializados para dados reais
  const { 
    quotations, 
    isLoading: quotationsLoading, 
    updateQuotationStatus,
    refetch: refetchQuotations
  } = useQuotations()
  
  const { 
    suppliers, 
    isLoading: suppliersLoading,
    refetch: refetchSuppliers
  } = useSuppliers()
  
  const { 
    metrics, 
    isLoading: metricsLoading,
    refetch: refetchMetrics
  } = useDashboardMetrics()
  
  const { 
    connectionStatus: notificationStatus 
  } = useRealtimeNotifications()
  
  const { 
    status: realtimeStatus,
    isConnected
  } = useSupabaseRealtime()
  
  // Status de conexão consolidado
  const connectionStatus = isConnected ? 'connected' : 'disconnected'
  
  // Estado para atividades (audit logs)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  
  // Loading consolidado
  const isLoading = quotationsLoading || suppliersLoading || metricsLoading || activitiesLoading

  // Buscar atividades recentes (audit logs)
  const fetchActivities = async () => {
    if (!user?.organization_id) {
      setActivitiesLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Erro ao buscar atividades:', error)
        setActivitiesLoading(false)
        return
      }

      // Transformar audit logs em activities
      const transformedActivities: Activity[] = data?.map(log => ({
        id: log.id,
        type: mapAuditActionToActivityType(log.action),
        description: generateActivityDescription(log),
        user_id: log.user_id,
        quotation_id: log.entity_type === 'quotations' ? log.entity_id : undefined,
        created_at: log.created_at
      })) || []

      setActivities(transformedActivities)
      
    } catch (err) {
      console.error('Erro inesperado ao buscar atividades:', err)
    } finally {
      setActivitiesLoading(false)
    }
  }

  // Mapear ações de auditoria para tipos de atividade
  const mapAuditActionToActivityType = (action: string): Activity['type'] => {
    switch (action) {
      case 'create':
      case 'quotation_created':
        return 'quotation_created'
      case 'proposal_submitted':
      case 'supplier_responded':
        return 'supplier_responded'
      case 'quotation_finalized':
      case 'finalize':
        return 'quotation_finalized'
      case 'document_processed':
        return 'document_processed'
      default:
        return 'document_processed'
    }
  }

  // Gerar descrição da atividade
  const generateActivityDescription = (log: AuditLog): string => {
    if (log.details?.description && typeof log.details.description === 'string') {
      return log.details.description
    }
    
    switch (log.action) {
      case 'create':
        return `Nova ${log.entity_type.slice(0, -1)} foi criada`
      case 'update':
        return `${log.entity_type.slice(0, -1)} foi atualizada`
      case 'status_change':
        return `Status da ${log.entity_type.slice(0, -1)} foi alterado`
      default:
        return `Ação ${log.action} executada em ${log.entity_type}`
    }
  }

  // Escutar eventos realtime de audit logs
  useEffect(() => {
    if (!user?.organization_id) return

    const handleAuditLogged = (event: CustomEvent) => {
      const { auditLog } = event.detail
      
      const newActivity: Activity = {
        id: auditLog.id,
        type: mapAuditActionToActivityType(auditLog.action),
        description: generateActivityDescription(auditLog),
        user_id: auditLog.user_id,
        quotation_id: auditLog.entity_type === 'quotations' ? auditLog.entity_id : undefined,
        created_at: auditLog.created_at
      }
      
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]) // Manter últimas 10
    }

    // Buscar atividades iniciais
    fetchActivities()
    
    window.addEventListener('audit:logged', handleAuditLogged as EventListener)

    return () => {
      window.removeEventListener('audit:logged', handleAuditLogged as EventListener)
    }
  }, [user?.organization_id])

  // Polling de backup se realtime falhar
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      const interval = setInterval(() => {
        refetchQuotations()
        refetchSuppliers()
        refetchMetrics()
        fetchActivities()
      }, 30000) // A cada 30s
      return () => clearInterval(interval)
    }
  }, [connectionStatus])

  // Função para refetch de todos os dados
  const refetch = async () => {
    await Promise.all([
      refetchQuotations(),
      refetchSuppliers(), 
      refetchMetrics(),
      fetchActivities()
    ])
  }

  return {
    quotations,
    suppliers,
    activities,
    metrics,
    connectionStatus,
    isLoading,
    updateQuotationStatus,
    refetch
  }
}