'use client'

// Integração com Portal Nacional de Contratações Públicas (PNCP)
// Documentação: https://pncp.gov.br/api/consulta-edital

export interface PNCPOpportunity {
  id: string
  numeroControleEdital: string
  linkSistemaOrigem: string
  nomeRazaoSocialFornecedor: string
  numeroDocumento: string
  tipoPessoa: string
  porte: string
  situacaoEdital: string
  modalidadeId: number
  modalidadeNome: string
  unidadeOrgao: {
    codigoUnidade: string
    nomeUnidade: string
    ufNome: string
    municipioNome: string
    codigoIbge: string
  }
  objetoEdital: string
  informacaoComplementar?: string
  valorTotalEstimado?: number
  dataAberturaProposta: string
  dataEncerramentoProposta: string
  dataPublicacaoPncp: string
  valorTotalHomologado?: number
  itensEdital?: PNCPItem[]
}

export interface PNCPItem {
  numeroItem: string
  materialOuServico: string
  descricaoSumaria: string
  descricaoDetalhada: string
  quantidade: number
  unidadeMedida: string
  valorUnitarioEstimado?: number
  valorTotalEstimado?: number
  situacaoItem: string
  criterioJulgamento: string
  indicadorSubmetidoSrp: boolean
}

export interface PNCPSearchParams {
  dataInicial?: string
  dataFinal?: string
  modalidade?: string
  uf?: string
  municipio?: string
  palavraChave?: string
  valorMinimo?: number
  valorMaximo?: number
  situacao?: 'A' | 'P' | 'H' // Aberto, Publicado, Homologado
  cnpjOrgao?: string
  pagina?: number
  tamanhoPagina?: number
}

export interface PNCPResponse<T> {
  data: T[]
  totalPages: number
  totalElements: number
  currentPage: number
  hasNext: boolean
  hasPrevious: boolean
}

class PNCPApi {
  private baseUrl = 'https://pncp.gov.br/api/pncp/v1'
  private timeout = 30000 // 30s timeout para API externa

  // Buscar oportunidades/editais
  async searchOpportunities(params: PNCPSearchParams = {}): Promise<PNCPResponse<PNCPOpportunity>> {
    try {
      const queryParams = new URLSearchParams()
      
      // Data padrão: últimos 30 dias
      if (!params.dataInicial) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        params.dataInicial = thirtyDaysAgo.toISOString().split('T')[0]
      }
      
      if (!params.dataFinal) {
        params.dataFinal = new Date().toISOString().split('T')[0]
      }

      // Adicionar parâmetros
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })

      // Configurações padrão
      queryParams.append('pagina', (params.pagina || 1).toString())
      queryParams.append('tamanhoPagina', (params.tamanhoPagina || 20).toString())

      const url = `${this.baseUrl}/editais?${queryParams.toString()}`
      
      console.log('🔍 Buscando PNCP:', url)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`PNCP API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      
      // Transformar resposta para nosso formato
      return {
        data: result.data || [],
        totalPages: result.totalPages || 1,
        totalElements: result.totalElements || 0,
        currentPage: result.pageable?.pageNumber + 1 || 1,
        hasNext: !result.last,
        hasPrevious: !result.first
      }

    } catch (error) {
      console.error('Erro na busca PNCP:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout na consulta PNCP. Tente novamente.')
        }
        throw new Error(`Erro na consulta PNCP: ${error.message}`)
      }
      
      throw new Error('Erro desconhecido na consulta PNCP')
    }
  }

  // Buscar detalhes de um edital específico
  async getOpportunityDetails(numeroControleEdital: string): Promise<PNCPOpportunity> {
    try {
      const url = `${this.baseUrl}/editais/${numeroControleEdital}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`PNCP API Error: ${response.status} - ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Erro ao buscar detalhes PNCP:', error)
      throw error
    }
  }

  // Buscar itens de um edital
  async getOpportunityItems(numeroControleEdital: string): Promise<PNCPItem[]> {
    try {
      const url = `${this.baseUrl}/editais/${numeroControleEdital}/itens`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`PNCP API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || []

    } catch (error) {
      console.error('Erro ao buscar itens PNCP:', error)
      throw error
    }
  }

  // Filtros predefinidos para facilitar busca
  static getCommonFilters() {
    return {
      modalidades: [
        { id: 1, nome: 'Concorrência' },
        { id: 2, nome: 'Tomada de Preços' },
        { id: 3, nome: 'Convite' },
        { id: 4, nome: 'Concurso' },
        { id: 5, nome: 'Leilão' },
        { id: 6, nome: 'Pregão' },
        { id: 7, nome: 'Consulta' },
        { id: 8, nome: 'Regime Diferenciado de Contratações' }
      ],
      situacoes: [
        { id: 'A', nome: 'Aberto' },
        { id: 'P', nome: 'Publicado' },
        { id: 'H', nome: 'Homologado' }
      ],
      estados: [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ]
    }
  }
}

// Instância singleton
export const pncpApi = new PNCPApi()

// Utilidades para formatação
export const formatPNCPValue = (value?: number): string => {
  if (!value) return 'Não informado'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export const formatPNCPDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

export const getPNCPStatusColor = (situacao: string): string => {
  switch (situacao?.toUpperCase()) {
    case 'A':
    case 'ABERTO':
      return 'bg-green-100 text-green-800'
    case 'P':
    case 'PUBLICADO':
      return 'bg-blue-100 text-blue-800'
    case 'H':
    case 'HOMOLOGADO':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}