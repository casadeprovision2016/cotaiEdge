'use client'

import React from 'react'
import { useRBAC, Permissions } from '@/hooks/useRBAC'

interface PermissionGuardProps {
  children: React.ReactNode
  permission: keyof Permissions
  fallback?: React.ReactNode
  requireAll?: boolean // Se true, precisa de todas as permissões em 'permission'
}

// Para uma única permissão
export function PermissionGuard({ 
  children, 
  permission, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useRBAC()

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
    )
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Para múltiplas permissões
interface MultiPermissionGuardProps {
  children: React.ReactNode
  permissions: (keyof Permissions)[]
  fallback?: React.ReactNode
  requireAll?: boolean // Se true, precisa de todas; se false, precisa de pelo menos uma
}

export function MultiPermissionGuard({ 
  children, 
  permissions, 
  fallback = null,
  requireAll = false
}: MultiPermissionGuardProps) {
  const { hasAllPermissions, hasAnyPermission, isLoading } = useRBAC()

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
    )
  }

  const hasPermissions = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)

  if (!hasPermissions) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Para verificar role específico
interface RoleGuardProps {
  children: React.ReactNode
  roles: ('admin' | 'user' | 'viewer')[]
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  roles, 
  fallback = null 
}: RoleGuardProps) {
  const { userRole, isLoading } = useRBAC()

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
    )
  }

  if (!roles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Para mostrar indicador de PIN necessário
interface PinIndicatorProps {
  permission: keyof Permissions
  className?: string
}

export function PinIndicator({ permission, className = '' }: PinIndicatorProps) {
  const { requiresPinValidation, hasPermission } = useRBAC()

  if (!hasPermission(permission) || !requiresPinValidation(permission)) {
    return null
  }

  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ${className}`}
      title="Esta ação requer validação de PIN"
    >
      🔐 PIN
    </span>
  )
}