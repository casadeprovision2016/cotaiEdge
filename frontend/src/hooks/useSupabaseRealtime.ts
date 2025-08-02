'use client'

import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface RealtimeStatus {
  quotations: 'connected' | 'disconnected' | 'connecting'
  notifications: 'connected' | 'disconnected' | 'connecting'
  auditLogs: 'connected' | 'disconnected' | 'connecting'
  overall: 'connected' | 'disconnected' | 'connecting'
}

export function useSupabaseRealtime() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [status, setStatus] = useState<RealtimeStatus>({
    quotations: 'disconnected',
    notifications: 'disconnected',
    auditLogs: 'disconnected',
    overall: 'disconnected'
  })
  
  const [channels, setChannels] = useState<{
    quotations?: RealtimeChannel
    notifications?: RealtimeChannel
    auditLogs?: RealtimeChannel
  }>({})

  // Atualizar status geral
  const updateOverallStatus = (newStatus: Partial<RealtimeStatus>) => {
    setStatus(prev => {
      const updated = { ...prev, ...newStatus }
      const connectedCount = Object.values(updated).filter(s => s === 'connected').length
      const connectingCount = Object.values(updated).filter(s => s === 'connecting').length
      
      let overall: RealtimeStatus['overall'] = 'disconnected'
      if (connectedCount >= 2) overall = 'connected'
      else if (connectingCount > 0) overall = 'connecting'
      
      return { ...updated, overall }
    })
  }

  // Configurar canal de cotações
  const setupQuotationsChannel = () => {
    if (!user?.organization_id) return

    const channel = supabase
      .channel('quotations-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'quotations',
          filter: `organization_id=eq.${user.organization_id}`
        },
        (payload) => {
          console.log('🔄 Realtime - Cotação:', payload)
          
          // Dispatch eventos customizados para outros hooks escutarem
          switch (payload.eventType) {
            case 'INSERT':
              window.dispatchEvent(new CustomEvent('quotation:created', {
                detail: { quotation: payload.new }
              }))
              
              toast({
                title: 'Nova Cotação',
                description: `"${payload.new.title}" foi criada`,
                variant: 'default'
              })
              break
              
            case 'UPDATE':
              window.dispatchEvent(new CustomEvent('quotation:updated', {
                detail: { quotation: payload.new, old: payload.old }
              }))
              
              if (payload.old.status !== payload.new.status) {
                toast({
                  title: 'Status Atualizado',
                  description: `"${payload.new.title}" movida para ${payload.new.status}`,
                  variant: 'default'
                })
              }
              break
              
            case 'DELETE':
              window.dispatchEvent(new CustomEvent('quotation:deleted', {
                detail: { quotationId: payload.old.id }
              }))
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Canal Cotações:', status)
        updateOverallStatus({ 
          quotations: status === 'SUBSCRIBED' ? 'connected' : 'disconnected' 
        })
      })

    setChannels(prev => ({ ...prev, quotations: channel }))
  }

  // Configurar canal de notificações
  const setupNotificationsChannel = () => {
    if (!user?.id) return

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Realtime - Notificação:', payload)
          
          window.dispatchEvent(new CustomEvent('notification:received', {
            detail: { notification: payload.new }
          }))
          
          // Toast automático para notificações importantes
          if (payload.new.type === 'error' || payload.new.type === 'warning') {
            toast({
              title: payload.new.title,
              description: payload.new.message,
              variant: payload.new.type === 'error' ? 'destructive' : 'default'
            })
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Realtime - Notificação atualizada:', payload)
          
          window.dispatchEvent(new CustomEvent('notification:updated', {
            detail: { notification: payload.new, old: payload.old }
          }))
        }
      )
      .subscribe((status) => {
        console.log('📡 Canal Notificações:', status)
        updateOverallStatus({ 
          notifications: status === 'SUBSCRIBED' ? 'connected' : 'disconnected' 
        })
      })

    setChannels(prev => ({ ...prev, notifications: channel }))
  }

  // Configurar canal de audit logs
  const setupAuditLogsChannel = () => {
    if (!user?.organization_id) return

    const channel = supabase
      .channel('audit-logs-realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'audit_logs',
          filter: `organization_id=eq.${user.organization_id}`
        },
        (payload) => {
          console.log('📋 Realtime - Audit Log:', payload)
          
          window.dispatchEvent(new CustomEvent('audit:logged', {
            detail: { auditLog: payload.new }
          }))
        }
      )
      .subscribe((status) => {
        console.log('📡 Canal Audit Logs:', status)
        updateOverallStatus({ 
          auditLogs: status === 'SUBSCRIBED' ? 'connected' : 'disconnected' 
        })
      })

    setChannels(prev => ({ ...prev, auditLogs: channel }))
  }

  // Configurar todos os canais
  const setupAllChannels = () => {
    if (!user) return

    console.log('🚀 Configurando canais Supabase Realtime...')
    
    updateOverallStatus({ 
      quotations: 'connecting',
      notifications: 'connecting', 
      auditLogs: 'connecting'
    })

    setupQuotationsChannel()
    setupNotificationsChannel()
    setupAuditLogsChannel()
  }

  // Desconectar todos os canais
  const disconnectAllChannels = () => {
    console.log('🔌 Desconectando canais Supabase Realtime...')
    
    Object.values(channels).forEach(channel => {
      if (channel) {
        channel.unsubscribe()
      }
    })
    
    setChannels({})
    setStatus({
      quotations: 'disconnected',
      notifications: 'disconnected',
      auditLogs: 'disconnected',
      overall: 'disconnected'
    })
  }

  // Reconectar em caso de falha
  const reconnect = () => {
    console.log('🔄 Tentando reconectar Supabase Realtime...')
    
    disconnectAllChannels()
    
    setTimeout(() => {
      setupAllChannels()
    }, 2000) // Aguardar 2s antes de reconectar
  }

  // Verificar status da conexão
  const checkConnectionHealth = () => {
    const connectedChannels = Object.values(status).filter(s => s === 'connected').length
    if (connectedChannels < 2) {
      console.warn('⚠️ Conexão Realtime instável, tentando reconectar...')
      reconnect()
    }
  }

  // Configurar na inicialização
  useEffect(() => {
    if (!user) return

    setupAllChannels()

    // Verificar saúde da conexão a cada 30s
    const healthCheck = setInterval(checkConnectionHealth, 30000)

    // Cleanup
    return () => {
      clearInterval(healthCheck)
      disconnectAllChannels()
    }
  }, [user?.id, user?.organization_id])

  // Monitorar mudanças na rede
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada, reconectando Realtime...')
      reconnect()
    }

    const handleOffline = () => {
      console.log('🌐 Conexão perdida')
      updateOverallStatus({
        quotations: 'disconnected',
        notifications: 'disconnected',
        auditLogs: 'disconnected'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    status,
    isConnected: status.overall === 'connected',
    reconnect,
    disconnect: disconnectAllChannels
  }
}