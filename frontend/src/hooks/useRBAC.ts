'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Definir roles disponíveis
export type UserRole = 'admin' | 'user' | 'viewer'

// Definir permissões disponíveis
export interface Permissions {
  // Cotações
  quotations_create: boolean
  quotations_edit: boolean
  quotations_delete: boolean
  quotations_view: boolean
  quotations_manage_status: boolean

  // Fornecedores
  suppliers_create: boolean
  suppliers_edit: boolean
  suppliers_delete: boolean
  suppliers_view: boolean

  // Usuários
  users_create: boolean
  users_edit: boolean
  users_delete: boolean
  users_view: boolean

  // Relatórios
  reports_view: boolean
  reports_export: boolean

  // Configurações
  settings_view: boolean
  settings_edit: boolean

  // Organização
  organization_manage: boolean
}

// Mapeamento de roles para permissões padrão
const rolePermissions: Record<UserRole, Permissions> = {
  admin: {
    quotations_create: true,
    quotations_edit: true,
    quotations_delete: true,
    quotations_view: true,
    quotations_manage_status: true,
    suppliers_create: true,
    suppliers_edit: true,
    suppliers_delete: true,
    suppliers_view: true,
    users_create: true,
    users_edit: true,
    users_delete: true,
    users_view: true,
    reports_view: true,
    reports_export: true,
    settings_view: true,
    settings_edit: true,
    organization_manage: true
  },
  user: {
    quotations_create: true,
    quotations_edit: true,
    quotations_delete: false,
    quotations_view: true,
    quotations_manage_status: true,
    suppliers_create: true,
    suppliers_edit: true,
    suppliers_delete: false,
    suppliers_view: true,
    users_create: false,
    users_edit: false,
    users_delete: false,
    users_view: true,
    reports_view: true,
    reports_export: true,
    settings_view: true,
    settings_edit: false,
    organization_manage: false
  },
  viewer: {
    quotations_create: false,
    quotations_edit: false,
    quotations_delete: false,
    quotations_view: true,
    quotations_manage_status: false,
    suppliers_create: false,
    suppliers_edit: false,
    suppliers_delete: false,
    suppliers_view: true,
    users_create: false,
    users_edit: false,
    users_delete: false,
    users_view: false,
    reports_view: true,
    reports_export: false,
    settings_view: false,
    settings_edit: false,
    organization_manage: false
  }
}

export function useRBAC() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [pinValidated, setPinValidated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar permissões do usuário
  const loadPermissions = () => {
    if (!user) {
      setPermissions(null)
      setIsLoading(false)
      return
    }

    try {
      const userRole = user.role as UserRole || 'viewer'
      const defaultPermissions = rolePermissions[userRole]
      
      // Se o usuário tem permissões customizadas, mesclá-las com as padrão
      let finalPermissions = defaultPermissions
      if (user.permissions && typeof user.permissions === 'object') {
        finalPermissions = {
          ...defaultPermissions,
          ...user.permissions
        }
      }
      
      setPermissions(finalPermissions)
      
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
      // Usar permissões mínimas em caso de erro
      setPermissions(rolePermissions.viewer)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar se tem uma permissão específica
  const hasPermission = (permission: keyof Permissions): boolean => {
    if (!permissions) return false
    return permissions[permission] === true
  }

  // Verificar se tem qualquer uma das permissões
  const hasAnyPermission = (permissionList: (keyof Permissions)[]): boolean => {
    return permissionList.some(permission => hasPermission(permission))
  }

  // Verificar se tem todas as permissões
  const hasAllPermissions = (permissionList: (keyof Permissions)[]): boolean => {
    return permissionList.every(permission => hasPermission(permission))
  }

  // Verificar se é admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin'
  }

  // Verificar se é viewer apenas
  const isViewer = (): boolean => {
    return user?.role === 'viewer'
  }

  // Validar PIN de 4 dígitos para ações sensíveis
  const validatePin = async (pin: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      // Por enquanto, usar validação simples
      // Em produção, isso seria validado contra hash seguro no banco
      const storedPin = localStorage.getItem(`user_pin_${user.id}`)
      
      if (!storedPin) {
        // Se não há PIN, usar PIN padrão baseado nos últimos 4 dígitos do ID
        const defaultPin = user.id.slice(-4)
        if (pin === defaultPin) {
          setPinValidated(true)
          return true
        }
      } else if (pin === storedPin) {
        setPinValidated(true)
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('Erro ao validar PIN:', error)
      return false
    }
  }

  // Definir novo PIN
  const setPin = async (newPin: string): Promise<boolean> => {
    if (!user?.id) return false
    if (!/^\d{4}$/.test(newPin)) return false

    try {
      // Validar PIN atual primeiro (se existir)
      const storedPin = localStorage.getItem(`user_pin_${user.id}`)
      if (storedPin && !pinValidated) {
        return false // PIN atual deve ser validado primeiro
      }

      // Salvar novo PIN (em produção seria hash seguro no banco)
      localStorage.setItem(`user_pin_${user.id}`, newPin)
      
      // Log da ação
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          organization_id: user.organization_id,
          action: 'pin_updated',
          entity_type: 'users',
          entity_id: user.id,
          details: { description: 'PIN de segurança atualizado' },
          ip_address: 'unknown',
          user_agent: navigator.userAgent
        }])
      
      return true
      
    } catch (error) {
      console.error('Erro ao definir PIN:', error)
      return false
    }
  }

  // Verificar se uma ação requer PIN
  const requiresPinValidation = (permission: keyof Permissions): boolean => {
    const sensitivePermissions: (keyof Permissions)[] = [
      'quotations_delete',
      'suppliers_delete', 
      'users_create',
      'users_edit',
      'users_delete',
      'settings_edit',
      'organization_manage'
    ]
    
    return sensitivePermissions.includes(permission)
  }

  // Verificar se pode executar ação (inclui validação de PIN quando necessário)
  const canExecuteAction = (permission: keyof Permissions): boolean => {
    if (!hasPermission(permission)) return false
    
    if (requiresPinValidation(permission) && !pinValidated) {
      return false
    }
    
    return true
  }

  // Limpar validação de PIN
  const clearPinValidation = () => {
    setPinValidated(false)
  }

  // Carregar permissões quando usuário muda
  useEffect(() => {
    loadPermissions()
  }, [user])

  // Limpar PIN quando usuário faz logout
  useEffect(() => {
    if (!user) {
      setPinValidated(false)
    }
  }, [user])

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isViewer,
    canExecuteAction,
    requiresPinValidation,
    validatePin,
    setPin,
    pinValidated,
    clearPinValidation,
    userRole: user?.role as UserRole || 'viewer'
  }
}