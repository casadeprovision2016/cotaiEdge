'use client'

import { useState, useEffect } from 'react'
import { supabase, Supplier } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useSuppliers() {
  const { user } = useAuth()
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = async () => {
    if (!user?.organization_id) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          cnpj,
          cpf,
          type,
          email,
          phone,
          whatsapp,
          performance_score,
          total_quotations,
          response_rate,
          avg_response_time_hours,
          last_interaction,
          categories,
          status,
          created_at,
          updated_at
        `)
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('performance_score', { ascending: false })
        .limit(50) // Limitar a 50 fornecedores para melhor performance

      if (error) {
        console.error('Erro ao buscar fornecedores:', error)
        setError(error.message)
        return
      }

      // Transformar dados para compatibilidade com interface atual
      const transformedSuppliers = data?.map(s => ({
        ...s,
        // Campos obrigatórios com valores padrão
        organization_id: '',
        documents: {},
        certifications: []
      })) || []
      
      setSuppliers(transformedSuppliers)
      setError(null)
      
    } catch (err) {
      console.error('Erro inesperado ao buscar fornecedores:', err)
      setError('Erro ao carregar fornecedores')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [user?.organization_id])

  return {
    suppliers,
    isLoading,
    error,
    refetch: fetchSuppliers
  }
}