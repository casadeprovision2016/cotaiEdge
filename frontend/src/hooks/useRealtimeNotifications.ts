'use client'

import { useState, useEffect } from 'react'
import { supabase, Notification } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useRealtimeNotifications() {
  const { user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connectionStatus] = useState<'connected' | 'disconnected'>('connected') // Status gerenciado pelo useSupabaseRealtime
  const [isLoading, setIsLoading] = useState(true)

  // Buscar notificações iniciais
  const fetchNotifications = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao buscar notificações:', error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
      
    } catch (err) {
      console.error('Erro inesperado ao buscar notificações:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Erro ao marcar como lida:', error)
        return false
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount(prev => Math.max(0, prev - 1))
      return true
      
    } catch (err) {
      console.error('Erro inesperado ao marcar como lida:', err)
      return false
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user?.id) return false

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error)
        return false
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      )

      setUnreadCount(0)
      return true
      
    } catch (err) {
      console.error('Erro inesperado ao marcar todas como lidas:', err)
      return false
    }
  }

  // Escutar eventos realtime
  useEffect(() => {
    if (!user?.id) return

    const handleNotificationReceived = (event: CustomEvent) => {
      const { notification } = event.detail
      
      // Adicionar à lista
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Não mostrar toast aqui pois já é mostrado no useSupabaseRealtime
    }

    const handleNotificationUpdated = (event: CustomEvent) => {
      const { notification, old } = event.detail
      
      // Atualizar na lista
      setNotifications(prev =>
        prev.map(n => 
          n.id === notification.id ? notification : n
        )
      )
      
      // Atualizar contador se mudou status de leitura
      if (old.is_read !== notification.is_read) {
        setUnreadCount(prev => 
          notification.is_read ? Math.max(0, prev - 1) : prev + 1
        )
      }
    }

    // Buscar notificações iniciais
    fetchNotifications()
    
    window.addEventListener('notification:received', handleNotificationReceived as EventListener)
    window.addEventListener('notification:updated', handleNotificationUpdated as EventListener)

    return () => {
      window.removeEventListener('notification:received', handleNotificationReceived as EventListener)
      window.removeEventListener('notification:updated', handleNotificationUpdated as EventListener)
    }
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    connectionStatus,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  }
}