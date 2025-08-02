'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { motion, AnimatePresence } from 'framer-motion'
import { usePNCPOpportunities } from '@/hooks/usePNCPOpportunities'
import { formatPNCPValue, formatPNCPDate, getPNCPStatusColor, PNCPOpportunity, PNCPSearchParams } from '@/lib/pncp-api'
import { PermissionGuard } from '@/components/auth/PermissionGuard'

interface SearchFiltersProps {
  onSearch: (params: PNCPSearchParams) => void
  isLoading: boolean
}

function SearchFilters({ onSearch, isLoading }: SearchFiltersProps) {
  const [keywords, setKeywords] = useState('')
  const [state, setState] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')

  const handleSearch = () => {
    onSearch({
      palavraChave: keywords || undefined,
      uf: state || undefined,
      valorMinimo: minValue ? parseInt(minValue) : undefined,
      valorMaximo: maxValue ? parseInt(maxValue) : undefined,
      situacao: 'A', // Apenas oportunidades abertas
      pagina: 1
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔍</span>
          <span>Filtros de Busca PNCP</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Palavras-chave..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">Todos os Estados</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="PR">Paraná</option>
            <option value="SC">Santa Catarina</option>
            <option value="BA">Bahia</option>
            <option value="GO">Goiás</option>
            <option value="PE">Pernambuco</option>
            <option value="CE">Ceará</option>
          </select>

          <Input
            type="number"
            placeholder="Valor mínimo (R$)"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Valor máximo (R$)"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Buscar Oportunidades</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface OpportunityCardProps {
  opportunity: PNCPOpportunity
  onImport: (opportunity: PNCPOpportunity) => void
  isImporting: boolean
}

function OpportunityCard({ opportunity, onImport, isImporting }: OpportunityCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const isExpiringSoon = () => {
    const closingDate = new Date(opportunity.dataEncerramentoProposta)
    const now = new Date()
    const daysUntilClose = Math.ceil((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilClose <= 3 && daysUntilClose > 0
  }

  const isExpired = () => {
    const closingDate = new Date(opportunity.dataEncerramentoProposta)
    const now = new Date()
    return closingDate < now
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border-2 rounded-lg transition-all duration-200 hover:shadow-lg ${
        isExpired() ? 'border-red-200 bg-red-50' :
        isExpiringSoon() ? 'border-yellow-200 bg-yellow-50' :
        'border-gray-200 bg-white'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPNCPStatusColor(opportunity.situacaoEdital)}`}>
                {opportunity.situacaoEdital}
              </span>
              <span className="text-xs text-gray-500">
                {opportunity.modalidadeNome}
              </span>
              {isExpiringSoon() && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  ⏰ Expira em breve
                </span>
              )}
              {isExpired() && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ❌ Expirado
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
              {opportunity.objetoEdital}
            </h3>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Órgão:</strong> {opportunity.unidadeOrgao?.nomeUnidade}</p>
              <p><strong>Local:</strong> {opportunity.unidadeOrgao?.municipioNome} - {opportunity.unidadeOrgao?.ufNome}</p>
              <p><strong>Edital:</strong> {opportunity.numeroControleEdital}</p>
            </div>
          </div>
        </div>

        {/* Valores e Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Valor Estimado</p>
            <p className="font-semibold text-green-600">
              {formatPNCPValue(opportunity.valorTotalEstimado)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data de Encerramento</p>
            <p className="font-semibold text-red-600">
              {formatPNCPDate(opportunity.dataEncerramentoProposta)}
            </p>
          </div>
        </div>

        {/* Detalhes Expansíveis */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Informações Complementares:</p>
                  <p className="text-gray-600">
                    {opportunity.informacaoComplementar || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Data de Abertura:</p>
                  <p className="text-gray-600">
                    {formatPNCPDate(opportunity.dataAberturaProposta)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Data de Publicação:</p>
                  <p className="text-gray-600">
                    {formatPNCPDate(opportunity.dataPublicacaoPncp)}
                  </p>
                </div>
                {opportunity.linkSistemaOrigem && (
                  <div>
                    <p className="font-medium text-gray-700">Link Sistema Origem:</p>
                    <a 
                      href={opportunity.linkSistemaOrigem}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Ver no sistema original ↗
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ações */}
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            {showDetails ? '👆 Menos detalhes' : '👇 Mais detalhes'}
          </Button>
          
          <PermissionGuard permission="quotations_create">
            <Button
              onClick={() => onImport(opportunity)}
              disabled={isImporting || isExpired()}
              size="sm"
              className="flex items-center space-x-1"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Importar</span>
                </>
              )}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </motion.div>
  )
}

export function PNCPOpportunities() {
  const {
    opportunities,
    isLoading,
    error,
    hasNext,
    searchOpportunities,
    loadNextPage,
    importAsQuotation
  } = usePNCPOpportunities()

  const [importingId, setImportingId] = useState<string | null>(null)

  const handleImport = async (opportunity: PNCPOpportunity) => {
    setImportingId(opportunity.numeroControleEdital)
    try {
      await importAsQuotation(opportunity)
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PermissionGuard permission="quotations_view">
        <SearchFilters onSearch={searchOpportunities} isLoading={isLoading} />

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>🏛️</span>
                <span>Oportunidades PNCP</span>
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">
                  {opportunities.length} oportunidades
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {opportunities.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma oportunidade encontrada
                </h3>
                <p className="text-gray-500">
                  Ajuste os filtros de busca para encontrar oportunidades relevantes
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.numeroControleEdital}
                    opportunity={opportunity}
                    onImport={handleImport}
                    isImporting={importingId === opportunity.numeroControleEdital}
                  />
                ))}
              </AnimatePresence>
            </div>

            {hasNext && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={loadNextPage}
                  disabled={isLoading}
                  variant="secondary"
                >
                  {isLoading ? 'Carregando...' : 'Carregar mais oportunidades'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  )
}