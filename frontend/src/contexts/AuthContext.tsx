'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session, AuthApiError } from '@supabase/supabase-js'
import { supabase, User } from '@/lib/supabase'
import { debugSupabaseConfig, testSupabaseConnection } from '@/lib/debug'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isTrialExpired: () => boolean
  checkUserStatus: () => 'active' | 'trial_expired' | 'suspended' | 'cancelled'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Debug: Verificar configuração do Supabase
    debugSupabaseConfig()
    testSupabaseConnection()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Tentar buscar perfil personalizado do usuário
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_uid', supabaseUser.id)
        .single()

      if (error) {
        console.warn('Custom user profile not found or accessible:', error.message)
        // Criar um usuário temporário baseado nos dados do Supabase Auth
        const tempUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          created_at: supabaseUser.created_at || new Date().toISOString(),
          trial_start: supabaseUser.created_at || new Date().toISOString(),
          status: 'active',
          role: 'user',
          organization_id: undefined,
          supabase_uid: supabaseUser.id,
          is_active: true,
          permissions: {},
          preferences: {},
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setUser(tempUser)
      } else {
        setUser(data)
        // Tentar atualizar last_login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('supabase_uid', supabaseUser.id)
          .then(({ error }) => {
            if (error) console.warn('Failed to update last_login:', error.message)
          })
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      // Fallback para usuário básico em caso de erro
      const fallbackUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        created_at: supabaseUser.created_at || new Date().toISOString(),
        trial_start: supabaseUser.created_at || new Date().toISOString(),
        status: 'active',
        role: 'user',
        organization_id: undefined,
        supabase_uid: supabaseUser.id,
        is_active: true,
        permissions: {},
        preferences: {},
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUser(fallbackUser)
    } finally {
      setLoading(false)
    }
  }


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (user) {
      await logAction('logout', 'users', user.id, { email: user.email })
    }
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const isTrialExpired = (): boolean => {
    if (!user || !user.trial_start) return false
    
    const trialStart = new Date(user.trial_start)
    const now = new Date()
    const daysSinceTrialStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysSinceTrialStart > 7
  }

  const checkUserStatus = (): 'active' | 'trial_expired' | 'suspended' | 'cancelled' => {
    if (!user) return 'active'
    
    if (user.status === 'suspended') return 'suspended'
    if (user.status === 'cancelled') return 'cancelled'
    
    // Check if trial is expired
    if (user.status === 'active' && isTrialExpired()) {
      // Update user status to trial_expired
      updateUserStatus('trial_expired')
      return 'trial_expired'
    }
    
    return user.status as 'active' | 'trial_expired' | 'suspended' | 'cancelled'
  }

  const updateUserStatus = async (status: string) => {
    if (!user) return
    
    try {
      await supabase
        .from('users')
        .update({ status })
        .eq('id', user.id)
      
      setUser({ ...user, status } as User)
      
      await logAction('status_updated', 'users', user.id, { 
        old_status: user.status, 
        new_status: status 
      })
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  // Rate limiting functions (simplificado para funcionar sem tabelas customizadas)
  const checkRateLimit = async (email: string): Promise<{ allowed: boolean; attempts: number; waitTime: number }> => {
    try {
      // Usar localStorage temporariamente para rate limiting básico
      const storageKey = `login_attempts_${email}`
      const stored = localStorage.getItem(storageKey)
      const attempts = stored ? JSON.parse(stored) : []
      
      // Limpar tentativas antigas (mais de 1 hora)
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      const recentAttempts = attempts.filter((timestamp: number) => timestamp > oneHourAgo)
      
      const maxAttempts = 10 // Aumentar para testes
      
      if (recentAttempts.length >= maxAttempts) {
        const oldestAttempt = Math.min(...recentAttempts)
        const waitTime = Math.ceil((oldestAttempt + 60 * 60 * 1000 - Date.now()) / (1000 * 60))
        return { allowed: false, attempts: recentAttempts.length, waitTime: Math.max(waitTime, 1) }
      }
      
      return { allowed: true, attempts: recentAttempts.length, waitTime: 0 }
    } catch (error) {
      console.error('Error in checkRateLimit:', error)
      return { allowed: true, attempts: 0, waitTime: 0 }
    }
  }

  const incrementFailedAttempts = async (email: string) => {
    try {
      const storageKey = `login_attempts_${email}`
      const stored = localStorage.getItem(storageKey)
      const attempts = stored ? JSON.parse(stored) : []
      
      attempts.push(Date.now())
      localStorage.setItem(storageKey, JSON.stringify(attempts))
    } catch (error) {
      console.error('Error incrementing failed attempts:', error)
    }
  }

  const clearFailedAttempts = async (email: string) => {
    try {
      const storageKey = `login_attempts_${email}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing failed attempts:', error)
    }
  }

  const logAction = async (action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => {
    try {
      // Log para console no desenvolvimento, em produção seria para audit_logs
      console.log('🔍 Audit Log:', {
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        timestamp: new Date().toISOString()
      })
      
      // Tentar inserir na tabela de auditoria (pode falhar se não existir)
      const logEntry = {
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: 'unknown',
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert([logEntry])
      
      if (error) {
        console.warn('Audit log failed (table may not exist):', error.message)
      }
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isTrialExpired,
    checkUserStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}