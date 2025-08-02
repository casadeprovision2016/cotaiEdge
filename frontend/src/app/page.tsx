'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render home page if user is authenticated (will be redirected)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CotAi Edge
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button>Registrar-se</Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Revolucione suas{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Cotações
              </span>{' '}
              com IA
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Sistema integrado de gestão de cotações com inteligência artificial, 
              automatizando todo o ciclo de compras empresariais com integração ao PNCP.
            </p>
            <div className="space-x-4">
              <Link href="/register">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Teste Grátis por 7 Dias
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="px-8 py-4 text-lg">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                IA Integrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Extração automática de documentos com 95% de precisão. 
                Análise semântica e matching inteligente de fornecedores.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Integração PNCP
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitoramento automático de oportunidades no Portal Nacional 
                de Contratações Públicas em tempo real.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Processamento Rápido
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Análise de cotações em menos de 3 segundos. 
                Interface responsiva com Kanban dinâmico.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">5000+</div>
              <div className="text-gray-600 dark:text-gray-400">Cotações Processadas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600 dark:text-gray-400">Precisão OCR</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">&lt;3s</div>
              <div className="text-gray-600 dark:text-gray-400">Tempo de Análise</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-400">Uptime SLA</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Comece seu teste gratuito hoje e transforme seu processo de cotações.
            </p>
            <Link href="/register">
              <Button size="lg" className="px-12 py-4 text-lg">
                Iniciar Teste Gratuito
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
          <p>© 2025 CotAi Edge. Sistema seguro com criptografia AES-256 e compliance LGPD.</p>
        </div>
      </footer>
    </div>
  )
}
