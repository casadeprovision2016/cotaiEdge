'use client'

import React from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if already logged in (simplificado)
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-lg text-gray-600">
            Sistema inteligente de gestão de cotações
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Features Preview */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                IA Integrada
              </h3>
              <p className="text-sm text-gray-600">
                Extração automática de documentos com 95% de precisão
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-3">🏛️</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Integração PNCP
              </h3>
              <p className="text-sm text-gray-600">
                Monitoramento automático de editais públicos
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Processamento Rápido
              </h3>
              <p className="text-sm text-gray-600">
                Análise de cotações em menos de 3 segundos
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            © 2025 CotAi Edge. Sistema seguro com criptografia AES-256 e compliance LGPD.
          </p>
        </footer>
      </div>
    </div>
  )
}