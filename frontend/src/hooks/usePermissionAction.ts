'use client'

import { useState } from 'react'
import { useRBAC, Permissions } from '@/hooks/useRBAC'
import { useToast } from '@/hooks/use-toast'

export function usePermissionAction() {
  const { hasPermission, canExecuteAction, requiresPinValidation } = useRBAC()
  const { toast } = useToast()
  
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [currentPermission, setCurrentPermission] = useState<keyof Permissions | null>(null)

  // Executar ação com verificação de permissão e PIN
  const executeWithPermission = (
    permission: keyof Permissions,
    action: () => void,
    options?: {
      unauthorizedMessage?: string
      successMessage?: string
    }
  ) => {
    // Verificar se tem a permissão
    if (!hasPermission(permission)) {
      toast({
        title: 'Acesso Negado',
        description: options?.unauthorizedMessage || 'Você não tem permissão para executar esta ação',
        variant: 'destructive'
      })
      return
    }

    // Se pode executar diretamente (sem PIN)
    if (canExecuteAction(permission)) {
      action()
      
      if (options?.successMessage) {
        toast({
          title: 'Sucesso',
          description: options.successMessage,
          variant: 'default'
        })
      }
      return
    }

    // Se requer PIN, mostrar modal
    if (requiresPinValidation(permission)) {
      setPendingAction(() => action)
      setCurrentPermission(permission)
      setShowPinModal(true)
    }
  }

  // Callback quando PIN é validado
  const handlePinValidated = () => {
    setShowPinModal(false)
    
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    
    setCurrentPermission(null)
  }

  // Callback quando PIN é cancelado
  const handlePinCancelled = () => {
    setShowPinModal(false)
    setPendingAction(null)
    setCurrentPermission(null)
    
    toast({
      title: 'Ação Cancelada',
      description: 'A validação de segurança foi cancelada',
      variant: 'default'
    })
  }

  // Verificar se pode executar uma ação (para mostrar/esconder botões)
  const canPerform = (permission: keyof Permissions): boolean => {
    return hasPermission(permission)
  }

  // Verificar se uma ação requer PIN (para mostrar indicador visual)
  const needsPin = (permission: keyof Permissions): boolean => {
    return hasPermission(permission) && requiresPinValidation(permission)
  }

  return {
    executeWithPermission,
    canPerform,
    needsPin,
    showPinModal,
    currentPermission,
    handlePinValidated,
    handlePinCancelled
  }
}