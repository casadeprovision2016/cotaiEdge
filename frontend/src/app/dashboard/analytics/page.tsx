'use client'

import React from 'react'
import { DashboardAnalytics } from '@/components/analytics/DashboardAnalytics'
import { PermissionGuard } from '@/components/auth/PermissionGuard'

export default function AnalyticsPage() {
  return (
    <PermissionGuard permission="reports_view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              📊 Analytics Avançado
            </h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada de performance, tendências e insights do sistema
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Dados em tempo real</span>
            </div>
          </div>
        </div>

        {/* Analytics Component */}
        <DashboardAnalytics />
      </div>
    </PermissionGuard>
  )
}