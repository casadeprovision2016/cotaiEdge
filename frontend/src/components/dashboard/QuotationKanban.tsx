'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Quotation } from '@/lib/supabase'
import { PermissionGuard, PinIndicator } from '@/components/auth/PermissionGuard'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { PinValidation } from '@/components/auth/PinValidation'

interface QuotationKanbanProps {
  quotations: Quotation[]
}

interface KanbanColumnProps {
  title: string
  status: Quotation['status']
  quotations: Quotation[]
  onStatusChange: (quotationId: string, newStatus: Quotation['status']) => void
}

function KanbanColumn({ title, status, quotations, onStatusChange }: KanbanColumnProps) {
  const columnQuotations = quotations.filter(q => q.status === status)
  
  const getStatusColor = (status: Quotation['status']) => {
    switch (status) {
      case 'abertas': return 'border-blue-200 bg-blue-50'
      case 'em_andamento': return 'border-yellow-200 bg-yellow-50'
      case 'respondidas': return 'border-green-200 bg-green-50'
      case 'finalizadas': return 'border-purple-200 bg-purple-50'
      case 'canceladas': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getNextStatus = (currentStatus: Quotation['status']): Quotation['status'] | null => {
    switch (currentStatus) {
      case 'abertas': return 'em_andamento'
      case 'em_andamento': return 'respondidas'
      case 'respondidas': return 'finalizadas'
      default: return null
    }
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
          {columnQuotations.length}
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {columnQuotations.map((quotation) => {
          const nextStatus = getNextStatus(quotation.status)
          
          return (
            <Card key={quotation.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2 line-clamp-2">
                  {quotation.title}
                </h4>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{quotation.number}</span>
                  {quotation.response_deadline && (
                    <span>Até {new Date(quotation.response_deadline).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
                
                {quotation.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {quotation.description}
                  </p>
                )}
                
                <PermissionGuard permission="quotations_manage_status">
                  {nextStatus && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => onStatusChange(quotation.id, nextStatus)}
                      >
                        Mover para {nextStatus === 'em_andamento' ? 'Em Andamento' : 
                                    nextStatus === 'respondidas' ? 'Respondidas' : 'Finalizadas'}
                      </Button>
                    </div>
                  )}
                </PermissionGuard>
                
                <div className="mt-2 text-xs text-gray-400">
                  Atualizada {new Date(quotation.updated_at).toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {columnQuotations.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            Nenhuma cotação neste status
          </div>
        )}
      </div>
    </div>
  )
}

export function QuotationKanban({ quotations }: QuotationKanbanProps) {
  const [updatingQuotation, setUpdatingQuotation] = useState<string | null>(null)
  const {
    executeWithPermission,
    canPerform,
    needsPin,
    showPinModal,
    handlePinValidated,
    handlePinCancelled
  } = usePermissionAction()

  const handleStatusChange = async (quotationId: string, newStatus: Quotation['status']) => {
    executeWithPermission(
      'quotations_manage_status',
      () => {
        setUpdatingQuotation(quotationId)
        
        // Simular atualização (em produção chamaria a função do hook)
        setTimeout(() => {
          setUpdatingQuotation(null)
          // updateQuotationStatus seria chamada aqui
        }, 500)
      },
      {
        unauthorizedMessage: 'Você não tem permissão para alterar status de cotações',
        successMessage: 'Status da cotação atualizado com sucesso'
      }
    )
  }

  const columns = [
    { title: 'Abertas', status: 'abertas' as const },
    { title: 'Em Andamento', status: 'em_andamento' as const },
    { title: 'Respondidas', status: 'respondidas' as const },
    { title: 'Finalizadas', status: 'finalizadas' as const }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Kanban de Cotações</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Tempo real</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              quotations={quotations}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
        
        {updatingQuotation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Atualizando cotação...</span>
            </div>
          </div>
        )}
        
        {showPinModal && (
          <PinValidation
            onValidated={handlePinValidated}
            onCancel={handlePinCancelled}
            title="Confirmar Alteração de Status"
            description="Digite seu PIN para alterar o status da cotação"
          />
        )}
      </CardContent>
    </Card>
  )
}