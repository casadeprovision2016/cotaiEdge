'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface MetricsOverviewProps {
  metrics: DashboardMetrics
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      title: 'Cotações Ativas',
      value: metrics.activeQuotations,
      icon: '📊',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Finalizadas',
      value: metrics.finalizedQuotations,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Fornecedores',
      value: metrics.totalSuppliers,
      icon: '🏢',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Economia Gerada',
      value: `${metrics.economyGenerated}%`,
      icon: '💰',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`text-3xl mr-4 p-3 rounded-lg ${card.bgColor}`}>
                {card.icon}
              </div>
              <div>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-sm text-gray-500">
                  {card.title}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}