'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Redirecionar para dashboard quando voltar online
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1)
    
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.log('Ainda offline, tentativa:', retryCount + 1)
    }
  }

  const cachedFeatures = [
    {
      icon: '📊',
      title: 'Dashboard Básico',
      description: 'Visualize dados em cache do dashboard'
    },
    {
      icon: '📱',
      title: 'Dados Locais',
      description: 'Acesse cotações salvas localmente'
    },
    {
      icon: '🔄',
      title: 'Sincronização Automática',
      description: 'Dados serão sincronizados quando voltar online'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Status Card */}
        <Card className={`border-2 ${isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">
              {isOnline ? '🌐' : '📱'}
            </div>
            <CardTitle className={isOnline ? 'text-green-800' : 'text-orange-800'}>
              {isOnline ? 'Conexão Restaurada!' : 'Modo Offline'}
            </CardTitle>
            <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
              {isOnline 
                ? 'Redirecionando para o dashboard...'
                : 'Você está navegando no modo offline'
              }
            </p>
          </CardHeader>
        </Card>

        {/* CotAi Edge Logo/Info */}
        <Card>
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <CardTitle className="text-gray-800">CotAi Edge</CardTitle>
            <p className="text-sm text-gray-600">
              Sistema Inteligente de Gestão de Cotações
            </p>
          </CardHeader>
        </Card>

        {/* Recursos Offline */}
        {!isOnline && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-gray-800">
                Recursos Disponíveis Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cachedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-2xl">{feature.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-800">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            disabled={isOnline}
            className="w-full"
          >
            {isOnline ? 'Conectado ✓' : `Tentar Reconectar ${retryCount > 0 ? `(${retryCount})` : ''}`}
          </Button>

          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="secondary"
            className="w-full"
          >
            Ir para Dashboard (Cache)
          </Button>
        </div>

        {/* Informações Técnicas */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Status da Rede:</span>
                <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Worker:</span>
                <span className="text-blue-600">Ativo</span>
              </div>
              <div className="flex justify-between">
                <span>Cache:</span>
                <span className="text-green-600">Disponível</span>
              </div>
              <div className="flex justify-between">
                <span>PWA:</span>
                <span className="text-purple-600">Instalado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>CotAi Edge v1.0.0 • PWA Mode</p>
          <p>Funciona mesmo sem internet!</p>
        </div>
      </div>
    </div>
  )
}