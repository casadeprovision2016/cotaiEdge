'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Quotation } from '@/lib/supabase'
import { PermissionGuard, PinIndicator } from '@/components/auth/PermissionGuard'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { PinValidation } from '@/components/auth/PinValidation'

interface DragDropKanbanProps {
  quotations: Quotation[]
  onStatusChange: (quotationId: string, newStatus: Quotation['status']) => void
}

interface KanbanColumn {
  id: Quotation['status']
  title: string
  color: string
}

const columns: KanbanColumn[] = [
  { id: 'abertas', title: 'Abertas', color: 'bg-blue-50 border-blue-200' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'respondidas', title: 'Respondidas', color: 'bg-green-50 border-green-200' },
  { id: 'finalizadas', title: 'Finalizadas', color: 'bg-purple-50 border-purple-200' }
]

interface QuotationCardProps {
  quotation: Quotation
  isOver?: boolean
  isDragging?: boolean
}

function QuotationCard({ quotation, isOver, isDragging }: QuotationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: quotation.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        cursor-grab active:cursor-grabbing
        ${isDragging || isSortableDragging ? 'opacity-50 z-50' : ''}
        ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm line-clamp-2">
              {quotation.title}
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {quotation.number}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Online</span>
            </span>
            {quotation.response_deadline && (
              <span>Até {new Date(quotation.response_deadline).toLocaleDateString('pt-BR')}</span>
            )}
          </div>
          
          {quotation.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {quotation.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                quotation.priority === 'alta' ? 'bg-red-100 text-red-800' :
                quotation.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {quotation.priority?.toUpperCase()}
              </span>
            </div>
            
            <div className="text-xs text-gray-400">
              {new Date(quotation.updated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface DroppableColumnProps {
  column: KanbanColumn
  quotations: Quotation[]
  isOver?: boolean
}

function DroppableColumn({ column, quotations, isOver }: DroppableColumnProps) {
  const columnQuotations = quotations.filter(q => q.status === column.id)

  return (
    <div className={`
      p-4 rounded-lg border-2 transition-all duration-200
      ${column.color}
      ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}
    `}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{column.title}</h3>
        <motion.span 
          className="bg-white px-2 py-1 rounded-full text-sm font-medium"
          key={columnQuotations.length}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {columnQuotations.length}
        </motion.span>
      </div>
      
      <SortableContext items={columnQuotations.map(q => q.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {columnQuotations.map((quotation) => (
              <QuotationCard
                key={quotation.id}
                quotation={quotation}
                isOver={isOver}
              />
            ))}
          </AnimatePresence>
          
          {columnQuotations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 text-sm py-8 border-2 border-dashed border-gray-300 rounded-lg"
            >
              <div className="text-2xl mb-2">📋</div>
              <p>Arraste cotações aqui</p>
            </motion.div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function DragDropKanban({ quotations, onStatusChange }: DragDropKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{
    quotationId: string
    newStatus: Quotation['status']
  } | null>(null)

  const {
    executeWithPermission,
    showPinModal,
    handlePinValidated,
    handlePinCancelled
  } = usePermissionAction()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movimento necessário para iniciar drag
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    
    if (over) {
      // Detectar se está sobre uma coluna
      const overColumn = columns.find(col => 
        over.id === col.id || 
        quotations.find(q => q.id === over.id)?.status === col.id
      )
      
      setDragOverColumn(overColumn?.id || null)
    } else {
      setDragOverColumn(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDragOverColumn(null)

    if (!over) return

    const activeQuotation = quotations.find(q => q.id === active.id)
    if (!activeQuotation) return

    // Determinar nova coluna
    let newStatus: Quotation['status'] | null = null
    
    // Se dropped diretamente numa coluna
    const targetColumn = columns.find(col => col.id === over.id)
    if (targetColumn) {
      newStatus = targetColumn.id
    } else {
      // Se dropped numa cotação, pegar status da cotação
      const targetQuotation = quotations.find(q => q.id === over.id)
      if (targetQuotation) {
        newStatus = targetQuotation.status
      }
    }

    // Se mesmo status, não fazer nada
    if (!newStatus || newStatus === activeQuotation.status) return

    // Executar mudança com validação de permissão
    executeWithPermission(
      'quotations_manage_status',
      () => {
        onStatusChange(activeQuotation.id, newStatus!)
      },
      {
        unauthorizedMessage: 'Você não tem permissão para alterar status de cotações',
        successMessage: `Cotação movida para ${getStatusLabel(newStatus!)}`
      }
    )
  }

  const getStatusLabel = (status: Quotation['status']): string => {
    const column = columns.find(col => col.id === status)
    return column?.title || status
  }

  const activeQuotation = activeId ? quotations.find(q => q.id === activeId) : null

  return (
    <PermissionGuard permission="quotations_view">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>🎯 Kanban Interativo</span>
              <PinIndicator permission="quotations_manage_status" />
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Drag & Drop</span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((column) => (
                <SortableContext key={column.id} items={[column.id]} strategy={verticalListSortingStrategy}>
                  <DroppableColumn
                    column={column}
                    quotations={quotations}
                    isOver={dragOverColumn === column.id}
                  />
                </SortableContext>
              ))}
            </div>

            <DragOverlay>
              {activeQuotation && (
                <div className="rotate-3 scale-105">
                  <QuotationCard quotation={activeQuotation} isDragging />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      {showPinModal && (
        <PinValidation
          onValidated={handlePinValidated}
          onCancel={handlePinCancelled}
          title="Confirmar Alteração de Status"
          description="Digite seu PIN para mover a cotação entre colunas"
        />
      )}
    </PermissionGuard>
  )
}