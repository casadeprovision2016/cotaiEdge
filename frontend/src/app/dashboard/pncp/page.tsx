'use client'

import React from 'react'
import { PNCPOpportunities } from '@/components/pncp/PNCPOpportunities'

export default function PNCPPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            🏛️ Oportunidades PNCP
          </h1>
          <p className="text-gray-600 mt-1">
            Portal Nacional de Contratações Públicas - Busque e importe oportunidades de licitação
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">API PNCP Integrada</span>
          </div>
        </div>
      </div>

      {/* PNCP Component */}
      <PNCPOpportunities />
    </div>
  )
}