'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface Quotation {
  id: string
  number: string
  title: string
  orgao: string
  modalidade: string
  objeto: string
  prazoInicial: string
  prazoFinal: string
  status: 'abertas' | 'em_andamento' | 'respondidas' | 'finalizadas' | 'canceladas'
  valor?: number
  fornecedoresCount: number
  priority: 'alta' | 'media' | 'baixa'
  createdAt: string
  updatedAt: string
  tags: string[]
  anexos: number
  responsavel?: string
  history?: HistoryEntry[]
}

interface HistoryEntry {
  id: string
  action: string
  user: string
  timestamp: string
  fromStatus?: string
  toStatus?: string
}

interface KanbanColumnProps {
  title: string
  status: Quotation['status']
  quotations: Quotation[]
  onMoveQuotation: (quotationId: string, newStatus: Quotation['status']) => void
  onEditQuotation: (quotation: Quotation) => void
  onDeleteQuotation: (quotationId: string) => void
}

export default function CotAiPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('todos')
  const [selectedPriority, setSelectedPriority] = useState('todas')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{quotationId: string, newStatus: Quotation['status']} | null>(null)
  const [password, setPassword] = useState('')
  const { toast } = useToast()

  // Mock data
  const mockQuotations: Quotation[] = [
    {
      id: '1',
      number: 'COT-2025-001',
      title: 'Compra de Material de Escritório',
      orgao: 'Prefeitura Municipal de São Paulo',
      modalidade: 'Pregão Eletrônico',
      objeto: 'Aquisição de materiais de escritório diversos para atender às necessidades administrativas.',
      prazoInicial: '2025-01-10',
      prazoFinal: '2025-01-25',
      status: 'abertas',
      valor: 25000,
      fornecedoresCount: 8,
      priority: 'media',
      createdAt: '2025-01-08',
      updatedAt: '2025-01-08',
      tags: ['escritório', 'administrativo'],
      anexos: 3,
      responsavel: 'João Silva',
      history: [
        {
          id: '1',
          action: 'Cotação criada',
          user: 'Sistema',
          timestamp: '2025-01-08T10:00:00Z'
        }
      ]
    },
    {
      id: '2',
      number: 'COT-2025-002',
      title: 'Serviços de Manutenção Predial',
      orgao: 'Secretaria de Obras',
      modalidade: 'Tomada de Preços',
      objeto: 'Contratação de empresa para prestação de serviços de manutenção predial preventiva e corretiva.',
      prazoInicial: '2025-01-12',
      prazoFinal: '2025-01-30',
      status: 'em_andamento',
      valor: 120000,
      fornecedoresCount: 5,
      priority: 'alta',
      createdAt: '2025-01-07',
      updatedAt: '2025-01-09',
      tags: ['manutenção', 'predial'],
      anexos: 7,
      responsavel: 'Maria Santos',
      history: [
        {
          id: '1',
          action: 'Cotação criada',
          user: 'Sistema',
          timestamp: '2025-01-07T09:00:00Z'
        },
        {
          id: '2',
          action: 'Status alterado',
          user: 'Maria Santos',
          timestamp: '2025-01-09T14:30:00Z',
          fromStatus: 'abertas',
          toStatus: 'em_andamento'
        }
      ]
    },
    {
      id: '3',
      number: 'COT-2025-003',
      title: 'Equipamentos de Informática',
      orgao: 'Secretaria de Tecnologia',
      modalidade: 'Pregão Eletrônico',
      objeto: 'Aquisição de equipamentos de informática incluindo notebooks, desktops e periféricos.',
      prazoInicial: '2025-01-05',
      prazoFinal: '2025-01-20',
      status: 'respondidas',
      valor: 180000,
      fornecedoresCount: 12,
      priority: 'alta',
      createdAt: '2025-01-05',
      updatedAt: '2025-01-10',
      tags: ['tecnologia', 'informática'],
      anexos: 5,
      responsavel: 'Carlos Lima'
    },
    {
      id: '4',
      number: 'COT-2025-004',
      title: 'Medicamentos Básicos',
      orgao: 'Secretaria de Saúde',
      modalidade: 'Dispensa',
      objeto: 'Aquisição de medicamentos básicos para atendimento na rede municipal de saúde.',
      prazoInicial: '2025-01-03',
      prazoFinal: '2025-01-15',
      status: 'finalizadas',
      valor: 95000,
      fornecedoresCount: 6,
      priority: 'alta',
      createdAt: '2025-01-03',
      updatedAt: '2025-01-15',
      tags: ['saúde', 'medicamentos'],
      anexos: 4,
      responsavel: 'Ana Costa'
    }
  ]

  useEffect(() => {
    setQuotations(mockQuotations)
  }, [])

  // Filtrar cotações
  useEffect(() => {
    let filtered = quotations

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.orgao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.objeto.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedFilter !== 'todos') {
      filtered = filtered.filter(q => q.status === selectedFilter)
    }

    if (selectedPriority !== 'todas') {
      filtered = filtered.filter(q => q.priority === selectedPriority)
    }

    setFilteredQuotations(filtered)
  }, [quotations, searchTerm, selectedFilter, selectedPriority])

  const handleMoveQuotation = (quotationId: string, newStatus: Quotation['status']) => {
    setPendingAction({ quotationId, newStatus })
    setShowPasswordModal(true)
  }

  const confirmMoveQuotation = () => {
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      toast({
        title: 'Erro',
        description: 'Digite um PIN de 4 números',
        variant: 'destructive'
      })
      return
    }
    
    if (password !== '1234') { // PIN de exemplo
      toast({
        title: 'Erro',
        description: 'PIN incorreto',
        variant: 'destructive'
      })
      return
    }

    if (pendingAction) {
      const currentQuotation = quotations.find(q => q.id === pendingAction.quotationId)
      const newHistoryEntry: HistoryEntry = {
        id: Date.now().toString(),
        action: 'Status alterado',
        user: user?.email?.split('@')[0] || 'Usuário',
        timestamp: new Date().toISOString(),
        fromStatus: currentQuotation?.status,
        toStatus: pendingAction.newStatus
      }

      setQuotations(prev => 
        prev.map(q => 
          q.id === pendingAction.quotationId 
            ? { 
                ...q, 
                status: pendingAction.newStatus, 
                updatedAt: new Date().toISOString().split('T')[0],
                history: [...(q.history || []), newHistoryEntry]
              }
            : q
        )
      )
      
      toast({
        title: 'Status atualizado',
        description: `Cotação movida para ${getStatusLabel(pendingAction.newStatus)} por ${newHistoryEntry.user}`
      })
    }

    setShowPasswordModal(false)
    setPendingAction(null)
    setPassword('')
  }

  const handleEditQuotation = (quotation: Quotation) => {
    toast({
      title: 'Editar cotação',
      description: `Editando ${quotation.number}...`
    })
  }

  const handleDeleteQuotation = (quotationId: string) => {
    setQuotations(prev => prev.filter(q => q.id !== quotationId))
    toast({
      title: 'Cotação excluída',
      description: 'A cotação foi removida com sucesso',
      variant: 'destructive'
    })
  }

  const getStatusLabel = (status: Quotation['status']) => {
    const labels = {
      abertas: 'Abertas',
      em_andamento: 'Em Andamento',
      respondidas: 'Respondidas', 
      finalizadas: 'Finalizadas',
      canceladas: 'Canceladas'
    }
    return labels[status]
  }

  const getPriorityColor = (priority: Quotation['priority']) => {
    switch (priority) {
      case 'alta': return 'border-l-red-500 bg-red-50'
      case 'media': return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const columns: { status: Quotation['status']; title: string; color: string }[] = [
    { status: 'abertas', title: 'Abertas', color: 'bg-blue-50 border-blue-200' },
    { status: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-50 border-yellow-200' },
    { status: 'respondidas', title: 'Respondidas', color: 'bg-purple-50 border-purple-200' },
    { status: 'finalizadas', title: 'Finalizadas', color: 'bg-green-50 border-green-200' },
    { status: 'canceladas', title: 'Canceladas', color: 'bg-red-50 border-red-200' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            CotAi Kanban
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão Visual e Inteligente de Cotações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <span className="mr-2">➕</span>
            Nova Cotação
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <Input
                placeholder="Buscar cotações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="abertas">Abertas</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="respondidas">Respondidas</option>
                <option value="finalizadas">Finalizadas</option>
                <option value="canceladas">Canceladas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedFilter('todos')
                  setSelectedPriority('todas')
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            quotations={filteredQuotations.filter(q => q.status === column.status)}
            onMoveQuotation={handleMoveQuotation}
            onEditQuotation={handleEditQuotation}
            onDeleteQuotation={handleDeleteQuotation}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {columns.map((column) => {
          const count = filteredQuotations.filter(q => q.status === column.status).length
          return (
            <Card key={`stats-${column.status}`}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{column.title}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de Confirmação de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmação Necessária
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Digite seu PIN de 4 números para confirmar a mudança de status
              </p>
            </div>
            
            <div className="mb-4">
              <Input
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setPassword(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmMoveQuotation()
                  }
                }}
                className="w-full text-center text-lg tracking-widest"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                (PIN de exemplo: 1234)
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPendingAction(null)
                  setPassword('')
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmMoveQuotation}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ title, status, quotations, onMoveQuotation, onEditQuotation, onDeleteQuotation }: KanbanColumnProps) {
  const getColumnColor = () => {
    switch (status) {
      case 'abertas': return 'bg-blue-50 border-blue-200'
      case 'em_andamento': return 'bg-yellow-50 border-yellow-200'
      case 'respondidas': return 'bg-purple-50 border-purple-200'
      case 'finalizadas': return 'bg-green-50 border-green-200'
      case 'canceladas': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getPreviousStatus = (currentStatus: Quotation['status']): Quotation['status'] | null => {
    switch (currentStatus) {
      case 'em_andamento': return 'abertas'
      case 'respondidas': return 'em_andamento'
      case 'finalizadas': return 'respondidas'
      default: return null
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
    <div className={`min-h-96 p-4 rounded-lg border-2 ${getColumnColor()}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
          {quotations.length}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {quotations.map((quotation) => {
          const previousStatus = getPreviousStatus(quotation.status)
          const nextStatus = getNextStatus(quotation.status)
          
          return (
            <Card 
              key={quotation.id} 
              className="hover:shadow-md transition-all bg-white border border-gray-200"
            >
              <CardContent className="p-3">
                {/* Novo Layout Simplificado */}
                <div className="space-y-2">
                  {/* Linha 1: ID PNCP + Prioridade */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-blue-600">
                      PE-{quotation.number.replace('COT-', '')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      quotation.priority === 'alta' ? 'bg-red-100 text-red-800' :
                      quotation.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {quotation.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Linha 2: Título */}
                  <h4 className="font-medium text-sm line-clamp-1">
                    {quotation.title}
                  </h4>

                  {/* Linha 3: Órgão */}
                  <div className="text-xs text-gray-600">
                    <strong>Órgão:</strong> {quotation.orgao}
                  </div>

                  {/* Linha 4: Prazo */}
                  <div className="text-xs text-gray-600">
                    <strong>Prazo:</strong> {quotation.prazoInicial} - {quotation.prazoFinal}
                  </div>

                  {/* Linha 5: Responsável */}
                  {quotation.responsavel && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="mr-1">👤</span>
                      {quotation.responsavel}
                    </div>
                  )}

                  {/* Linha 6: Botões de Navegação */}
                  <div className="flex justify-center items-center space-x-2 pt-2">
                    {previousStatus && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs px-2 py-1"
                        onClick={() => onMoveQuotation(quotation.id, previousStatus)}
                      >
                        ⬅
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs px-2 py-1"
                      onClick={() => onEditQuotation(quotation)}
                    >
                      👁️
                    </Button>
                    
                    {nextStatus && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs px-2 py-1"
                        onClick={() => onMoveQuotation(quotation.id, nextStatus)}
                      >
                        ➡️
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {quotations.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">📭</div>
            <p className="text-sm">Nenhuma cotação</p>
          </div>
        )}
      </div>
    </div>
  )
}