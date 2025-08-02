'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'

interface SearchResult {
  id: string
  pncpId: string
  title: string
  modalidade: string
  lastUpdate: string
  orgao: string
  local: string
  objeto: string
  status: string
}

export default function QuotationsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [selectedModalidade, setSelectedModalidade] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showCotarModal, setShowCotarModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [cotarForm, setCotarForm] = useState({
    title: '',
    description: '',
    modalidade: '',
    orgao: '',
    local: '',
    prazoInicial: '',
    prazoFinal: '',
    valorEstimado: '',
    responsavel: '',
    priority: 'media' as 'alta' | 'media' | 'baixa',
    categoria: '',
    observacoes: ''
  })

  // Dados de exemplo
  const mockResults: SearchResult[] = [
    {
      id: '1',
      pncpId: '01612566000137-1-000054/2025',
      title: 'Contratação Direta nº 014/2025',
      modalidade: 'Dispensa',
      lastUpdate: '02/08/2025',
      orgao: 'Município de Boqueirão do Piauí',
      local: 'Boqueirão do Piauí/PI',
      objeto: 'Portal de Compras Públicas — contratação de empresa especializada na prestação de serviços de seguro automotivo, com cobertura total, para ambulância pertencente à frota da Secretaria Municipal de Saúde do Município de Boqueirão do Piauí – PI.',
      status: 'A Receber'
    },
    {
      id: '2',
      pncpId: '01612566000137-1-000055/2025',
      title: 'Pregão Eletrônico nº 008/2025',
      modalidade: 'Pregão Eletrônico',
      lastUpdate: '01/08/2025',
      orgao: 'Prefeitura Municipal de São João',
      local: 'São João/PI',
      objeto: 'Aquisição de equipamentos de informática para modernização do parque tecnológico da administração municipal.',
      status: 'Em Julgamento'
    },
    {
      id: '3',
      pncpId: '01612566000137-1-000056/2025',
      title: 'Tomada de Preços nº 003/2025',
      modalidade: 'Tomada de Preços',
      lastUpdate: '31/07/2025',
      orgao: 'Secretaria de Obras Públicas',
      local: 'Teresina/PI',
      objeto: 'Contratação de empresa para execução de obras de pavimentação asfáltica em vias urbanas.',
      status: 'Encerradas'
    }
  ]

  const [results, setResults] = useState<SearchResult[]>([])

  const handleSearch = async () => {
    setIsSearching(true)
    
    // Simular busca
    setTimeout(() => {
      let filteredResults = mockResults
      
      if (searchTerm) {
        filteredResults = filteredResults.filter(result => 
          result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.orgao.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (selectedStatus !== 'todos') {
        filteredResults = filteredResults.filter(result => result.status === selectedStatus)
      }
      
      if (selectedModalidade) {
        filteredResults = filteredResults.filter(result => result.modalidade === selectedModalidade)
      }
      
      setResults(filteredResults)
      setIsSearching(false)
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A Receber': return 'bg-blue-100 text-blue-800'
      case 'Em Julgamento': return 'bg-yellow-100 text-yellow-800'
      case 'Encerradas': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCotar = (result: SearchResult) => {
    setSelectedResult(result)
    setCotarForm({
      title: result.title,
      description: result.objeto,
      modalidade: result.modalidade,
      orgao: result.orgao,
      local: result.local,
      prazoInicial: '',
      prazoFinal: '',
      valorEstimado: '',
      responsavel: '',
      priority: 'media',
      categoria: '',
      observacoes: ''
    })
    setShowCotarModal(true)
  }

  const handleSaveCotacao = () => {
    if (!cotarForm.title || !cotarForm.prazoInicial || !cotarForm.prazoFinal) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    // Simular salvamento na base CotAi
    toast({
      title: 'Cotação criada com sucesso!',
      description: `${cotarForm.title} foi adicionada ao CotAi Kanban`
    })

    setShowCotarModal(false)
    setCotarForm({
      title: '',
      description: '',
      modalidade: '',
      orgao: '',
      local: '',
      prazoInicial: '',
      prazoFinal: '',
      valorEstimado: '',
      responsavel: '',
      priority: 'media',
      categoria: '',
      observacoes: ''
    })
    setSelectedResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Pesquisa nLic
        </h1>
        <p className="text-gray-600 mt-1">
          Busque oportunidades de licitação no Portal Nacional de Contratações Públicas
        </p>
      </div>

      {/* Filtros de Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Palavra-chave */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Palavra-chave
              </label>
              <Input
                placeholder="Digite um termo para pesquisar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="A Receber">A Receber / Recebendo Proposta</option>
                <option value="Em Julgamento">Em Julgamento / Propostas Encerradas</option>
                <option value="Encerradas">Encerradas</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade da Contratação
              </label>
              <select
                value={selectedModalidade}
                onChange={(e) => setSelectedModalidade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                <option value="Dispensa">Dispensa</option>
                <option value="Pregão Eletrônico">Pregão Eletrônico</option>
                <option value="Tomada de Preços">Tomada de Preços</option>
                <option value="Concorrência">Concorrência</option>
                <option value="Convite">Convite</option>
              </select>
            </div>
          </div>

          {/* Botão de Busca */}
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Pesquisando...
                </>
              ) : (
                <>
                  <span className="mr-2">🔍</span>
                  Pesquisar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Pesquisa ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-blue-600">
                          Id contratação PNCP: {result.pncpId}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Aviso: {result.title}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <div><strong>Modalidade:</strong> {result.modalidade}</div>
                        <div><strong>Última atualização:</strong> {result.lastUpdate}</div>
                        <div><strong>Local:</strong> {result.local}</div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Órgão:</strong> {result.orgao}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Objeto:</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.objeto}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleCotar(result)}
                    >
                      <span className="mr-1">📋</span>
                      Cotar
                    </Button>
                    <Button variant="secondary" size="sm">
                      <span className="mr-1">👁️</span>
                      Ver no PNCP
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-1">
                <Button variant="secondary" size="sm" disabled>Anterior</Button>
                <Button variant="secondary" size="sm" className="bg-blue-600 text-white">1</Button>
                <Button variant="secondary" size="sm">2</Button>
                <Button variant="secondary" size="sm">3</Button>
                <Button variant="secondary" size="sm">Próximo</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado inicial ou sem resultados */}
      {results.length === 0 && !isSearching && (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">Pesquise por oportunidades</h3>
              <p className="text-sm">Use os filtros acima para encontrar licitações no PNCP</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Cotar */}
      {showCotarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Criar Nova Cotação
              </h2>
              <button
                onClick={() => setShowCotarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Informações do PNCP */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Origem: PNCP</h3>
                <p className="text-sm text-blue-700">
                  ID: {selectedResult?.pncpId}
                </p>
                <p className="text-sm text-blue-700">
                  Órgão: {selectedResult?.orgao}
                </p>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Cotação *
                  </label>
                  <Input
                    value={cotarForm.title}
                    onChange={(e) => setCotarForm({...cotarForm, title: e.target.value})}
                    placeholder="Digite o título da cotação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidade
                  </label>
                  <Input
                    value={cotarForm.modalidade}
                    onChange={(e) => setCotarForm({...cotarForm, modalidade: e.target.value})}
                    placeholder="Ex: Pregão Eletrônico"
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={cotarForm.categoria}
                    onChange={(e) => setCotarForm({...cotarForm, categoria: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="material_escritorio">Material de Escritório</option>
                    <option value="equipamentos_ti">Equipamentos de TI</option>
                    <option value="servicos_manutencao">Serviços de Manutenção</option>
                    <option value="medicamentos">Medicamentos</option>
                    <option value="mobiliario">Mobiliário</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Órgão
                  </label>
                  <Input
                    value={cotarForm.orgao}
                    onChange={(e) => setCotarForm({...cotarForm, orgao: e.target.value})}
                    placeholder="Nome do órgão"
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local
                  </label>
                  <Input
                    value={cotarForm.local}
                    onChange={(e) => setCotarForm({...cotarForm, local: e.target.value})}
                    placeholder="Localização"
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição/Objeto
                  </label>
                  <textarea
                    value={cotarForm.description}
                    onChange={(e) => setCotarForm({...cotarForm, description: e.target.value})}
                    placeholder="Descreva o objeto da cotação"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo Inicial *
                  </label>
                  <Input
                    type="date"
                    value={cotarForm.prazoInicial}
                    onChange={(e) => setCotarForm({...cotarForm, prazoInicial: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo Final *
                  </label>
                  <Input
                    type="date"
                    value={cotarForm.prazoFinal}
                    onChange={(e) => setCotarForm({...cotarForm, prazoFinal: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Estimado
                  </label>
                  <Input
                    type="number"
                    value={cotarForm.valorEstimado}
                    onChange={(e) => setCotarForm({...cotarForm, valorEstimado: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={cotarForm.priority}
                    onChange={(e) => setCotarForm({...cotarForm, priority: e.target.value as 'alta' | 'media' | 'baixa'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <Input
                    value={cotarForm.responsavel}
                    onChange={(e) => setCotarForm({...cotarForm, responsavel: e.target.value})}
                    placeholder="Nome do responsável pela cotação"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={cotarForm.observacoes}
                    onChange={(e) => setCotarForm({...cotarForm, observacoes: e.target.value})}
                    placeholder="Observações adicionais, requisitos especiais, etc."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowCotarModal(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveCotacao}>
                  <span className="mr-2">💾</span>
                  Salvar no CotAi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}