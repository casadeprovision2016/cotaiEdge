'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { pncpApi, PNCPOpportunity, PNCPSearchParams, PNCPResponse } from '@/lib/pncp-api'
import { supabase } from '@/lib/supabase'

export function usePNCPOpportunities() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [opportunities, setOpportunities] = useState<PNCPOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [searchParams, setSearchParams] = useState<PNCPSearchParams>({})

  // Buscar oportunidades na API PNCP
  const searchOpportunities = useCallback(async (params: PNCPSearchParams = {}, append = false) => {
    if (!user?.organization_id) return

    setIsLoading(true)
    setError(null)

    try {
      const response: PNCPResponse<PNCPOpportunity> = await pncpApi.searchOpportunities({
        ...searchParams,
        ...params
      })

      if (append) {
        setOpportunities(prev => [...prev, ...response.data])
      } else {
        setOpportunities(response.data)
      }

      setTotalPages(response.totalPages)
      setCurrentPage(response.currentPage)
      setHasNext(response.hasNext)
      setSearchParams({ ...searchParams, ...params })

      // Salvar no banco local para cache
      await saveOpportunitiesToDatabase(response.data)

      toast({
        title: 'Busca Concluída',
        description: `Encontradas ${response.totalElements} oportunidades`,
        variant: 'default'
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar oportunidades'
      setError(errorMessage)
      
      toast({
        title: 'Erro na Busca PNCP',
        description: errorMessage,
        variant: 'destructive'
      })

      // Carregar cache local em caso de erro
      await loadCachedOpportunities()
      
    } finally {
      setIsLoading(false)
    }
  }, [user, searchParams, toast])

  // Carregar próxima página
  const loadNextPage = useCallback(async () => {
    if (!hasNext || isLoading) return
    
    await searchOpportunities({
      ...searchParams,
      pagina: currentPage + 1
    }, true)
  }, [searchParams, currentPage, hasNext, isLoading, searchOpportunities])

  // Salvar oportunidades no banco local
  const saveOpportunitiesToDatabase = async (opportunities: PNCPOpportunity[]) => {
    if (!user?.organization_id || opportunities.length === 0) return

    try {
      const opportunitiesData = opportunities.map(opp => ({
        pncp_contracting_id: opp.numeroControleEdital,
        notice_number: opp.numeroControleEdital,
        notice_type: opp.modalidadeNome,
        title: opp.objetoEdital?.substring(0, 500) || 'Sem título',
        description: opp.informacaoComplementar,
        modality: opp.modalidadeNome,
        status: opp.situacaoEdital,
        organ_name: opp.unidadeOrgao?.nomeUnidade,
        organ_cnpj: opp.numeroDocumento,
        organ_city: opp.unidadeOrgao?.municipioNome,
        organ_state: opp.unidadeOrgao?.ufNome,
        estimated_value: opp.valorTotalEstimado,
        opening_date: opp.dataAberturaProposta,
        closing_date: opp.dataEncerramentoProposta,
        raw_data: opp,
        last_sync: new Date().toISOString(),
        is_active: opp.situacaoEdital === 'A' || opp.situacaoEdital === 'ABERTO'
      }))

      const { error } = await supabase
        .from('pncp_opportunities')
        .upsert(opportunitiesData, {
          onConflict: 'pncp_contracting_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Erro ao salvar oportunidades:', error)
      } else {
        console.log(`✅ ${opportunitiesData.length} oportunidades salvas no banco`)
      }

    } catch (err) {
      console.error('Erro ao salvar no banco:', err)
    }
  }

  // Carregar oportunidades do cache local
  const loadCachedOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('pncp_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('closing_date', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Erro ao carregar cache:', error)
        return
      }

      if (data && data.length > 0) {
        const cachedOpportunities = data.map(item => item.raw_data as PNCPOpportunity)
        setOpportunities(cachedOpportunities)
        
        toast({
          title: 'Cache Carregado',
          description: `${data.length} oportunidades do cache local`,
          variant: 'default'
        })
      }

    } catch (err) {
      console.error('Erro ao carregar cache:', err)
    }
  }

  // Importar oportunidade como cotação
  const importAsQuotation = async (opportunity: PNCPOpportunity) => {
    if (!user?.organization_id) return null

    try {
      setIsLoading(true)

      // Gerar número da cotação
      const { data: numberResult, error: numberError } = await supabase
        .rpc('generate_quotation_number', { org_id: user.organization_id })

      if (numberError) {
        throw new Error('Erro ao gerar número da cotação')
      }

      // Criar cotação baseada na oportunidade PNCP
      const { data, error } = await supabase
        .from('quotations')
        .insert([{
          number: numberResult,
          title: opportunity.objetoEdital?.substring(0, 255) || 'Importado do PNCP',
          description: opportunity.informacaoComplementar,
          pncp_id: opportunity.numeroControleEdital,
          pncp_data: opportunity,
          orgao: opportunity.unidadeOrgao?.nomeUnidade,
          modalidade: opportunity.modalidadeNome,
          local: `${opportunity.unidadeOrgao?.municipioNome} - ${opportunity.unidadeOrgao?.ufNome}`,
          opening_date: opportunity.dataAberturaProposta,
          closing_date: opportunity.dataEncerramentoProposta,
          response_deadline: opportunity.dataEncerramentoProposta,
          estimated_value: opportunity.valorTotalEstimado,
          max_value: opportunity.valorTotalHomologado,
          organization_id: user.organization_id,
          created_by: user.id,
          status: 'abertas',
          priority: opportunity.valorTotalEstimado && opportunity.valorTotalEstimado > 100000 ? 'alta' : 'media'
        }])
        .select()
        .single()

      if (error) {
        throw new Error('Erro ao criar cotação')
      }

      toast({
        title: 'Oportunidade Importada',
        description: `Cotação ${data.number} criada com sucesso`,
        variant: 'default'
      })

      return data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar oportunidade'
      toast({
        title: 'Erro na Importação',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Busca inicial
  useEffect(() => {
    if (user?.organization_id) {
      // Carregar cache primeiro
      loadCachedOpportunities()
      
      // Depois buscar dados atualizados
      setTimeout(() => {
        searchOpportunities({
          dataInicial: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias atrás
          situacao: 'A' // Apenas abertos
        })
      }, 1000)
    }
  }, [user?.organization_id])

  return {
    opportunities,
    isLoading,
    error,
    totalPages,
    currentPage,
    hasNext,
    searchParams,
    searchOpportunities,
    loadNextPage,
    importAsQuotation,
    refreshCache: loadCachedOpportunities
  }
}