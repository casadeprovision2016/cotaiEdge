'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MetricsOverview } from '@/components/dashboard/MetricsOverview'
import { DragDropKanban } from '@/components/dashboard/DragDropKanban'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { useRealTimeDataFast } from '@/hooks/useRealTimeDataFast'

export default function DashboardPage() {
  const { user } = useAuth()
  const { 
    quotations, 
    suppliers, 
    metrics, 
    activities,
    connectionStatus,
    isLoading,
    updateQuotationStatus
  } = useRealTimeDataFast()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard ⚡
          </h1>
          <p className="text-gray-600 mt-1">
            Visão geral das suas cotações com performance otimizada
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">
              Modo Rápido
            </span>
          </div>
        </div>
      </div>

      {/* Métricas Overview */}
      <MetricsOverview metrics={metrics} />

      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Kanban Board - 3 colunas */}
        <div className="xl:col-span-3">
          <DragDropKanban 
            quotations={quotations} 
            onStatusChange={updateQuotationStatus}
          />
        </div>

        {/* Sidebar - 1 coluna */}
        <div className="space-y-6">
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  )
}