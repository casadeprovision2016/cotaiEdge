'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Supplier } from '@/hooks/useRealTimeData'

interface PerformanceChartsProps {
  suppliers: Supplier[]
}

export function PerformanceCharts({ suppliers }: PerformanceChartsProps) {
  const getPerformanceColor = (score: number) => {
    if (score >= 9) return 'bg-green-500'
    if (score >= 7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPerformanceText = (score: number) => {
    if (score >= 9) return 'Excelente'
    if (score >= 7) return 'Bom'
    return 'Regular'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance dos Fornecedores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {supplier.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {supplier.performance_score.toFixed(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${getPerformanceColor(supplier.performance_score)}`}>
                      {getPerformanceText(supplier.performance_score)}
                    </span>
                  </div>
                </div>
                
                {/* Barra de Performance */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPerformanceColor(supplier.performance_score)}`}
                    style={{ width: `${(supplier.performance_score / 10) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tempo médio: {supplier.response_time_avg}h</span>
                  <span className={`${supplier.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhum fornecedor encontrado</p>
              <p className="text-sm">Os dados aparecerão após as primeiras cotações</p>
            </div>
          )}
          
          {suppliers.length > 0 && (
            <>
              <hr className="my-4" />
              
              {/* Resumo Estatístico */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {suppliers.filter(s => s.status === 'active').length}
                  </div>
                  <div className="text-xs text-blue-800">Ativos</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {suppliers.length > 0 ? 
                      (suppliers.reduce((acc, s) => acc + s.performance_score, 0) / suppliers.length).toFixed(1) : 
                      '0.0'
                    }
                  </div>
                  <div className="text-xs text-green-800">Média Geral</div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}