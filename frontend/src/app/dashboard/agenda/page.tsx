'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'

interface Event {
  id: string
  title: string
  description?: string
  date: string
  time: string
  type: 'meeting' | 'deadline' | 'reminder' | 'cotacao'
  priority: 'alta' | 'media' | 'baixa'
  related?: {
    type: 'cotacao' | 'fornecedor' | 'pncp'
    id: string
    name: string
  }
  completed?: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: 'alta' | 'media' | 'baixa'
  status: 'pendente' | 'em_andamento' | 'concluida'
  category: 'cotacao' | 'fornecedor' | 'administrativo' | 'pncp'
  assignee?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: string
  read: boolean
  action?: {
    label: string
    href: string
  }
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [events, setEvents] = useState<Event[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', type: 'meeting' as Event['type'] })
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'media' as Task['priority'] })
  const { toast } = useToast()

  // Mock data
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Reunião de Avaliação - COT-2025-001',
      description: 'Análise final das propostas recebidas',
      date: '2025-08-02',
      time: '14:00',
      type: 'meeting',
      priority: 'alta',
      related: {
        type: 'cotacao',
        id: 'COT-2025-001',
        name: 'Material de Escritório'
      }
    },
    {
      id: '2',
      title: 'Prazo Final - Pregão Eletrônico',
      description: 'Encerramento das propostas',
      date: '2025-08-03',
      time: '17:00',
      type: 'deadline',
      priority: 'alta',
      related: {
        type: 'cotacao',
        id: 'COT-2025-002',
        name: 'Equipamentos de TI'
      }
    },
    {
      id: '3',
      title: 'Visita Técnica - Fornecedor ABC',
      date: '2025-08-05',
      time: '10:00',
      type: 'meeting',
      priority: 'media'
    },
    {
      id: '4',
      title: 'Atualização PNCP',
      description: 'Verificar novas oportunidades',
      date: '2025-08-02',
      time: '09:00',
      type: 'reminder',
      priority: 'baixa'
    }
  ]

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Revisar documentação COT-2025-001',
      description: 'Verificar se todos os anexos estão completos',
      dueDate: '2025-08-03',
      priority: 'alta',
      status: 'em_andamento',
      category: 'cotacao',
      assignee: 'João Silva'
    },
    {
      id: '2',
      title: 'Contatar fornecedor para esclarecimentos',
      dueDate: '2025-08-02',
      priority: 'media',
      status: 'pendente',
      category: 'fornecedor',
      assignee: 'Maria Santos'
    },
    {
      id: '3',
      title: 'Publicar resultado no PNCP',
      dueDate: '2025-08-05',
      priority: 'alta',
      status: 'pendente',
      category: 'pncp'
    },
    {
      id: '4',
      title: 'Preparar relatório mensal',
      dueDate: '2025-08-10',
      priority: 'baixa',
      status: 'pendente',
      category: 'administrativo'
    }
  ]

  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Nova proposta recebida',
      message: 'Fornecedor XYZ enviou proposta para COT-2025-001',
      type: 'info',
      timestamp: '2025-08-02T10:30:00Z',
      read: false,
      action: {
        label: 'Visualizar',
        href: '/dashboard/cotai'
      }
    },
    {
      id: '2',
      title: 'Prazo se aproximando',
      message: 'COT-2025-002 encerra em 24 horas',
      type: 'warning',
      timestamp: '2025-08-02T08:00:00Z',
      read: false
    },
    {
      id: '3',
      title: 'Cotação finalizada',
      message: 'COT-2025-003 foi concluída com sucesso',
      type: 'success',
      timestamp: '2025-08-01T16:45:00Z',
      read: true
    }
  ]

  useEffect(() => {
    setEvents(mockEvents)
    setTasks(mockTasks)
    setNotifications(mockNotifications)
  }, [])

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      priority: 'media'
    }

    setEvents(prev => [...prev, event])
    setNewEvent({ title: '', date: '', time: '', type: 'meeting' })
    
    toast({
      title: 'Evento criado',
      description: 'Novo evento adicionado à agenda'
    })
  }

  const addTask = () => {
    if (!newTask.title) {
      toast({
        title: 'Erro',
        description: 'Digite um título para a tarefa',
        variant: 'destructive'
      })
      return
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      status: 'pendente',
      category: 'administrativo'
    }

    setTasks(prev => [...prev, task])
    setNewTask({ title: '', dueDate: '', priority: 'media' })
    
    toast({
      title: 'Tarefa criada',
      description: 'Nova tarefa adicionada à lista'
    })
  }

  const toggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: task.status === 'concluida' ? 'pendente' : 'concluida' }
          : task
      )
    )
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'deadline': return 'bg-red-100 text-red-800 border-red-200'
      case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cotacao': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: Event['type'] | Task['category']) => {
    switch (type) {
      case 'meeting': return '👥'
      case 'deadline': return '⏰'
      case 'reminder': return '🔔'
      case 'cotacao': return '📋'
      case 'fornecedor': return '🏢'
      case 'administrativo': return '📝'
      case 'pncp': return '🏛️'
      default: return '📅'
    }
  }

  const getPriorityColor = (priority: 'alta' | 'media' | 'baixa') => {
    switch (priority) {
      case 'alta': return 'border-l-red-500'
      case 'media': return 'border-l-yellow-500'
      case 'baixa': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const getNotificationTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'border-l-blue-500 bg-blue-50'
      case 'warning': return 'border-l-yellow-500 bg-yellow-50'
      case 'success': return 'border-l-green-500 bg-green-50'
      case 'error': return 'border-l-red-500 bg-red-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'concluida': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const todayEvents = events.filter(event => event.date === selectedDate.toISOString().split('T')[0])
  const pendingTasks = tasks.filter(task => task.status !== 'concluida')
  const unreadNotifications = notifications.filter(notif => !notif.read)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Agenda
          </h1>
          <p className="text-gray-600 mt-1">
            Organize tarefas, eventos e notificações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <span className="mr-2">➕</span>
            Novo Evento
          </Button>
          <Button variant="secondary">
            <span className="mr-2">📤</span>
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todayEvents.length}</div>
            <div className="text-sm text-gray-600">Eventos Hoje</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
            <div className="text-sm text-gray-600">Tarefas Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{unreadNotifications.length}</div>
            <div className="text-sm text-gray-600">Notificações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'concluida').length}</div>
            <div className="text-sm text-gray-600">Concluídas</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mini Calendário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📅 {formatDate(selectedDate)}</span>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'day' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('day')}
                  >
                    Dia
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'week' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('week')}
                  >
                    Semana
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'month' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('month')}
                  >
                    Mês
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - 6)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isSelected = date.toDateString() === selectedDate.toDateString()
                  const hasEvents = events.some(event => event.date === date.toISOString().split('T')[0])
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 rounded-lg text-sm transition-colors relative ${
                        isSelected ? 'bg-blue-600 text-white' :
                        isToday ? 'bg-blue-100 text-blue-700' :
                        date.getMonth() !== selectedDate.getMonth() ? 'text-gray-400' :
                        'hover:bg-gray-100'
                      }`}
                    >
                      {date.getDate()}
                      {hasEvents && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Tarefas e Notificações */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle>Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border border-gray-200 ${
                      task.status === 'concluida' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'concluida'}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm">{getTypeIcon(task.category)}</span>
                          <span className={`text-sm font-medium ${
                            task.status === 'concluida' ? 'line-through text-gray-500' : ''
                          }`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className={`px-1 rounded ${
                            task.priority === 'alta' ? 'bg-red-100 text-red-800' :
                            task.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {task.assignee && (
                          <div className="text-xs text-gray-500">
                            👤 {task.assignee}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar Nova Tarefa */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Input
                    placeholder="Nova tarefa"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="text-sm"
                  />
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="text-sm flex-1"
                    />
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as Task['priority']})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <Button onClick={addTask} size="sm" className="w-full">
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Notificações</span>
                {unreadNotifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 cursor-pointer transition-opacity ${
                      getNotificationTypeColor(notification.type)
                    } ${notification.read ? 'opacity-60' : ''}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    {notification.action && (
                      <Button size="sm" variant="secondary" className="text-xs">
                        {notification.action.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}