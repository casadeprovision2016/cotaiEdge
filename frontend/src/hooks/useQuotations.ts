'use client'

import { useState, useEffect } from 'react'
import { supabase, Quotation } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export function useQuotations() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar cotações do banco
  const fetchQuotations = async () => {
    if (!user?.organization_id) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          id,
          number,
          title,
          description,
          status,
          priority,
          closing_date,
          response_deadline,
          estimated_value,
          max_value,
          responsible_user_id,
          created_at,
          updated_at,
          organization_id
        `)
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100) // Limitar a 100 cotações mais recentes para melhor performance

      if (error) {
        console.error('Erro ao buscar cotações:', error)
        setError(error.message)
        return
      }

      // Transformar dados para compatibilidade com interface atual
      const transformedQuotations: Quotation[] = data?.map(q => ({
        ...q,
        // Mapeamento de status do banco para interface
        status: mapDatabaseStatus(q.status),
        // Campos obrigatórios com valores padrão
        auto_invite: false,
        require_documents: false
      })) || []

      setQuotations(transformedQuotations)
      setError(null)
      
    } catch (err) {
      console.error('Erro inesperado ao buscar cotações:', err)
      setError('Erro ao carregar cotações')
    } finally {
      setIsLoading(false)
    }
  }

  // Mapear status do banco para interface
  const mapDatabaseStatus = (dbStatus: string): Quotation['status'] => {
    switch (dbStatus) {
      case 'abertas': return 'abertas'
      case 'em_andamento': return 'em_andamento'
      case 'respondidas': return 'respondidas'
      case 'finalizadas': return 'finalizadas'
      case 'canceladas': return 'canceladas'
      default: return 'abertas'
    }
  }

  // Atualizar status de cotação
  const updateQuotationStatus = async (quotationId: string, newStatus: Quotation['status']) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', quotationId)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o status da cotação',
          variant: 'destructive'
        })
        return false
      }

      // Atualizar estado local
      setQuotations(prev => 
        prev.map(q => 
          q.id === quotationId 
            ? { ...q, status: newStatus, updated_at: new Date().toISOString() }
            : q
        )
      )

      toast({
        title: 'Status Atualizado',
        description: `Cotação movida para ${getStatusLabel(newStatus)}`
      })

      return true
      
    } catch (err) {
      console.error('Erro inesperado ao atualizar status:', err)
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar cotação',
        variant: 'destructive'
      })
      return false
    }
  }

  // Criar nova cotação
  const createQuotation = async (quotationData: Partial<Quotation>) => {
    if (!user?.organization_id) return null

    try {
      // Gerar número da cotação
      const { data: numberResult, error: numberError } = await supabase
        .rpc('generate_quotation_number', { org_id: user.organization_id })

      if (numberError) {
        console.error('Erro ao gerar número:', numberError)
        throw new Error('Erro ao gerar número da cotação')
      }

      const { data, error } = await supabase
        .from('quotations')
        .insert([{
          ...quotationData,
          number: numberResult,
          organization_id: user.organization_id,
          created_by: user.id,
          status: 'abertas',
          priority: quotationData.priority || 'media'
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar cotação:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a cotação',
          variant: 'destructive'
        })
        return null
      }

      // Adicionar ao estado local
      const transformedQuotation = {
        ...data,
        status: mapDatabaseStatus(data.status)
      }
      
      setQuotations(prev => [transformedQuotation, ...prev])

      toast({
        title: 'Cotação Criada',
        description: `Cotação ${data.number} criada com sucesso`
      })

      return transformedQuotation
      
    } catch (err) {
      console.error('Erro inesperado ao criar cotação:', err)
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar cotação',
        variant: 'destructive'
      })
      return null
    }
  }

  // Label para status
  const getStatusLabel = (status: Quotation['status']): string => {
    switch (status) {
      case 'abertas': return 'Abertas'
      case 'em_andamento': return 'Em Andamento'
      case 'respondidas': return 'Respondidas'
      case 'finalizadas': return 'Finalizadas'
      case 'canceladas': return 'Canceladas'
      default: return status
    }
  }

  // Buscar dados na inicialização
  useEffect(() => {
    fetchQuotations()
  }, [user?.organization_id])

  // Escutar eventos realtime
  useEffect(() => {
    const handleQuotationCreated = (event: CustomEvent) => {
      const { quotation } = event.detail
      const transformedQuotation = {
        ...quotation,
        status: mapDatabaseStatus(quotation.status)
      }
      setQuotations(prev => [transformedQuotation, ...prev])
    }

    const handleQuotationUpdated = (event: CustomEvent) => {
      const { quotation } = event.detail
      const transformedQuotation = {
        ...quotation,
        status: mapDatabaseStatus(quotation.status)
      }
      setQuotations(prev => 
        prev.map(q => q.id === quotation.id ? transformedQuotation : q)
      )
    }

    const handleQuotationDeleted = (event: CustomEvent) => {
      const { quotationId } = event.detail
      setQuotations(prev => prev.filter(q => q.id !== quotationId))
    }

    window.addEventListener('quotation:created', handleQuotationCreated as EventListener)
    window.addEventListener('quotation:updated', handleQuotationUpdated as EventListener)
    window.addEventListener('quotation:deleted', handleQuotationDeleted as EventListener)

    return () => {
      window.removeEventListener('quotation:created', handleQuotationCreated as EventListener)
      window.removeEventListener('quotation:updated', handleQuotationUpdated as EventListener)
      window.removeEventListener('quotation:deleted', handleQuotationDeleted as EventListener)
    }
  }, [])

  return {
    quotations,
    isLoading,
    error,
    updateQuotationStatus,
    createQuotation,
    refetch: fetchQuotations,
    getStatusLabel
  }
}