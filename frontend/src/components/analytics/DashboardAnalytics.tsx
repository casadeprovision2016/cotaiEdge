'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useQuotations } from '@/hooks/useQuotations'
import { useSuppliers } from '@/hooks/useSuppliers'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Cores para gráficos
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
}

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger, COLORS.purple]

interface AnalyticsData {
  quotationsByStatus: Array<{ name: string; value: number; color: string }>
  quotationsByMonth: Array<{ month: string; cotacoes: number; valor: number }>
  supplierPerformance: Array<{ name: string; score: number; responses: number }>
  dailyActivity: Array<{ date: string; cotacoes: number; propostas: number }>
  valueDistribution: Array<{ range: string; count: number; percentage: number }>
  topCategories: Array<{ category: string; count: number; value: number }>
}

export function DashboardAnalytics() {
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { quotations, isLoading: quotationsLoading } = useQuotations()
  const { suppliers, isLoading: suppliersLoading } = useSuppliers()
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [isExporting, setIsExporting] = useState(false)

  // Processar dados para analytics
  useEffect(() => {
    if (quotationsLoading || suppliersLoading || metricsLoading) return

    const processAnalyticsData = () => {
      // 1. Cotações por Status
      const statusData = [
        { name: 'Abertas', value: quotations.filter(q => q.status === 'abertas').length, color: COLORS.primary },
        { name: 'Em Andamento', value: quotations.filter(q => q.status === 'em_andamento').length, color: COLORS.accent },
        { name: 'Respondidas', value: quotations.filter(q => q.status === 'respondidas').length, color: COLORS.secondary },
        { name: 'Finalizadas', value: quotations.filter(q => q.status === 'finalizadas').length, color: COLORS.purple },
        { name: 'Canceladas', value: quotations.filter(q => q.status === 'canceladas').length, color: COLORS.danger }
      ].filter(item => item.value > 0)

      // 2. Cotações por Mês (últimos 6 meses)
      const monthlyData = []
      for (let i = 5; i >= 0; i--) {
        const date = subDays(new Date(), i * 30)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthQuotations = quotations.filter(q => {
          const createdAt = new Date(q.created_at)
          return createdAt >= monthStart && createdAt <= monthEnd
        })

        const totalValue = monthQuotations.reduce((sum, q) => sum + (q.estimated_value || 0), 0)

        monthlyData.push({
          month: format(date, 'MMM', { locale: ptBR }),
          cotacoes: monthQuotations.length,
          valor: Math.round(totalValue / 1000) // Em milhares
        })
      }

      // 3. Performance dos Fornecedores
      const supplierData = suppliers
        .slice(0, 10)
        .map(s => ({
          name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
          score: Math.round(s.performance_score * 10) / 10,
          responses: s.total_quotations || 0
        }))
        .sort((a, b) => b.score - a.score)

      // 4. Atividade Diária (últimos 14 dias)
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 14 : 30
      const dailyData = eachDayOfInterval({
        start: subDays(new Date(), days - 1),
        end: new Date()
      }).map(date => {
        const dayQuotations = quotations.filter(q => {
          const createdAt = new Date(q.created_at)
          return format(createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        })

        return {
          date: format(date, 'dd/MM'),
          cotacoes: dayQuotations.length,
          propostas: Math.floor(Math.random() * 5) // Simulado - em produção viria do banco
        }
      })

      // 5. Distribuição de Valores
      const valueRanges = [
        { range: '< R$ 10k', min: 0, max: 10000 },
        { range: 'R$ 10k - 50k', min: 10000, max: 50000 },
        { range: 'R$ 50k - 100k', min: 50000, max: 100000 },
        { range: 'R$ 100k - 500k', min: 100000, max: 500000 },
        { range: '> R$ 500k', min: 500000, max: Infinity }
      ]

      const valueDistribution = valueRanges.map(range => {
        const count = quotations.filter(q => {
          const value = q.estimated_value || 0
          return value >= range.min && value < range.max
        }).length
        
        return {
          range: range.range,
          count,
          percentage: quotations.length > 0 ? Math.round((count / quotations.length) * 100) : 0
        }
      }).filter(item => item.count > 0)

      // 6. Top Categorias (simulado)
      const categories = ['Material de Escritório', 'Serviços de TI', 'Limpeza', 'Segurança', 'Consultoria']
      const topCategories = categories.map(category => ({
        category,
        count: Math.floor(Math.random() * 20) + 1,
        value: Math.floor(Math.random() * 500000) + 10000
      })).sort((a, b) => b.value - a.value)

      setAnalyticsData({
        quotationsByStatus: statusData,
        quotationsByMonth: monthlyData,
        supplierPerformance: supplierData,
        dailyActivity: dailyData,
        valueDistribution,
        topCategories
      })
    }

    processAnalyticsData()
  }, [quotations, suppliers, selectedPeriod, quotationsLoading, suppliersLoading, metricsLoading])

  // Exportar relatório
  const exportReport = async () => {
    setIsExporting(true)
    
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Em produção, geraria PDF ou Excel real
      const reportData = {
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        metrics,
        analytics: analyticsData
      }
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotai-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } finally {
      setIsExporting(false)
    }
  }

  if (quotationsLoading || suppliersLoading || !analyticsData) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Analytics Avançado</span>
            </CardTitle>
            
            <div className="flex items-center space-x-4">
              {/* Seletor de Período */}
              <div className="flex space-x-1">
                {(['7d', '30d', '90d'] as const).map(period => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
                  </Button>
                ))}
              </div>
              
              {/* Botão Exportar */}
              <Button
                onClick={exportReport}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exportando...</span>
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    <span>Exportar Relatório</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cotações por Status - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Cotações por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.quotationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.quotationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance dos Fornecedores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.supplierPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill={COLORS.secondary} name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos de Linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cotações por Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.quotationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="cotacoes" 
                    stackId="1"
                    stroke={COLORS.primary} 
                    fill={COLORS.primary}
                    fillOpacity={0.6}
                    name="Cotações"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="valor" 
                    stroke={COLORS.secondary} 
                    strokeWidth={3}
                    name="Valor (k)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Atividade Diária */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Atividade Diária</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cotacoes" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    name="Cotações"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="propostas" 
                    stroke={COLORS.accent} 
                    strokeWidth={2}
                    name="Propostas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabelas de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Valores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.valueDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.range}</span>
                      <div className="text-sm text-gray-500">{item.count} cotações</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{item.percentage}%</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Categorias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topCategories.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.category}</span>
                      <div className="text-sm text-gray-500">{item.count} cotações</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        R$ {(item.value / 1000).toFixed(0)}k
                      </div>
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}