'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ReportData {
  totalCotacoes: number
  cotacoesAbertas: number
  cotacoesFinalizadas: number
  valorTotalProcessado: number
  fornecedoresAtivos: number
  tempoMedioProcessamento: number
  economiaGerada: number
  eficienciaProcessos: number
}

interface QuotationReport {
  id: string
  number: string
  title: string
  status: string
  valor: number
  createdAt: string
  finalizedAt?: string
  responsavel: string
  orgao: string
  economia?: number
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [quotationReports, setQuotationReports] = useState<QuotationReport[]>([])
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [selectedReport, setSelectedReport] = useState('geral')

  // Mock data
  const mockReportData: ReportData = {
    totalCotacoes: 127,
    cotacoesAbertas: 23,
    cotacoesFinalizadas: 89,
    valorTotalProcessado: 2450000,
    fornecedoresAtivos: 45,
    tempoMedioProcessamento: 12.5,
    economiaGerada: 367500,
    eficienciaProcessos: 87.3
  }

  const mockQuotationReports: QuotationReport[] = [
    {
      id: '1',
      number: 'COT-2025-001',
      title: 'Material de Escritório',
      status: 'Finalizada',
      valor: 25000,
      createdAt: '2025-01-08',
      finalizedAt: '2025-01-20',
      responsavel: 'João Silva',
      orgao: 'Prefeitura Municipal de São Paulo',
      economia: 3750
    },
    {
      id: '2',
      number: 'COT-2025-002',
      title: 'Equipamentos de TI',
      status: 'Em Andamento',
      valor: 180000,
      createdAt: '2025-01-10',
      responsavel: 'Maria Santos',
      orgao: 'Secretaria de Tecnologia'
    },
    {
      id: '3',
      number: 'COT-2025-003',
      title: 'Serviços de Manutenção',
      status: 'Finalizada',
      valor: 120000,
      createdAt: '2025-01-05',
      finalizedAt: '2025-01-18',
      responsavel: 'Carlos Lima',
      orgao: 'Secretaria de Obras',
      economia: 18000
    }
  ]

  useEffect(() => {
    setReportData(mockReportData)
    setQuotationReports(mockQuotationReports)
  }, [])

  const exportReport = (format: 'pdf' | 'excel') => {
    // Simular exportação
    const fileName = `relatorio_cotacoes_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    alert(`Exportando relatório: ${fileName}`)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'finalizada': return 'bg-green-100 text-green-800'
      case 'em andamento': return 'bg-yellow-100 text-yellow-800'
      case 'abertas': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Relatórios e Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Visão analítica completa do sistema de cotações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => exportReport('excel')}>
            <span className="mr-2">📊</span>
            Excel
          </Button>
          <Button onClick={() => exportReport('pdf')}>
            <span className="mr-2">📄</span>
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="geral">Relatório Geral</option>
                <option value="financeiro">Relatório Financeiro</option>
                <option value="performance">Performance</option>
                <option value="fornecedores">Fornecedores</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <span className="mr-2">🔍</span>
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Cotações</p>
                <p className="text-2xl font-bold text-gray-900">{reportData?.totalCotacoes}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">📋</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">↗️ +12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Processado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData && formatCurrency(reportData.valorTotalProcessado)}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">💰</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">↗️ +8.5% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Economia Gerada</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData && formatCurrency(reportData.economiaGerada)}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📈</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">↗️ +15% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eficiência</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData && formatPercentage(reportData.eficienciaProcessos)}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⚡</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">↗️ +3.2% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Cotações */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Finalizadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{reportData?.cotacoesFinalizadas}</span>
                  <span className="text-sm text-gray-500">
                    ({reportData && ((reportData.cotacoesFinalizadas / reportData.totalCotacoes) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Abertas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{reportData?.cotacoesAbertas}</span>
                  <span className="text-sm text-gray-500">
                    ({reportData && ((reportData.cotacoesAbertas / reportData.totalCotacoes) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Em Andamento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">15</span>
                  <span className="text-sm text-gray-500">(11.8%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData?.tempoMedioProcessamento}
                  </p>
                  <p className="text-sm text-gray-600">Dias médios</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {reportData?.fornecedoresAtivos}
                  </p>
                  <p className="text-sm text-gray-600">Fornecedores ativos</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Meta de eficiência</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{width: `${reportData?.eficienciaProcessos}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Cotações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Número</th>
                  <th className="text-left py-3 px-4">Título</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">Responsável</th>
                  <th className="text-left py-3 px-4">Economia</th>
                  <th className="text-left py-3 px-4">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {quotationReports.map((quotation) => (
                  <tr key={quotation.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{quotation.number}</td>
                    <td className="py-3 px-4">{quotation.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatCurrency(quotation.valor)}</td>
                    <td className="py-3 px-4">{quotation.responsavel}</td>
                    <td className="py-3 px-4">
                      {quotation.economia ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(quotation.economia)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(quotation.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}