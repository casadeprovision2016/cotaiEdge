'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAStatus {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isServiceWorkerSupported: boolean
  isNotificationSupported: boolean
  notificationPermission: NotificationPermission | null
}

export function usePWA() {
  const { toast } = useToast()
  
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [status, setStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isServiceWorkerSupported: false,
    isNotificationSupported: false,
    notificationPermission: null
  })

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker não suportado')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('✅ Service Worker registrado:', registration.scope)

      // Escutar atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast({
                title: 'Atualização Disponível',
                description: 'Uma nova versão do app está disponível. Reinicie para aplicar.',
                variant: 'default'
              })
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error)
      return false
    }
  }, [toast])

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notificações não suportadas')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      toast({
        title: 'Notificações Bloqueadas',
        description: 'Para receber notificações, habilite nas configurações do navegador',
        variant: 'destructive'
      })
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        toast({
          title: 'Notificações Habilitadas',
          description: 'Você receberá notificações sobre cotações e atualizações',
          variant: 'default'
        })
      }
      
      setStatus(prev => ({ ...prev, notificationPermission: permission }))
      return permission
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error)
      return 'denied'
    }
  }, [toast])

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) {
      toast({
        title: 'Instalação não disponível',
        description: 'O app já está instalado ou a instalação não é suportada',
        variant: 'destructive'
      })
      return false
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        setInstallPrompt(null)
        setStatus(prev => ({ ...prev, isInstallable: false, isInstalled: true }))
        
        toast({
          title: 'App Instalado!',
          description: 'CotAi Edge foi instalado e pode ser acessado da tela inicial',
          variant: 'default'
        })
        
        return true
      } else {
        toast({
          title: 'Instalação Cancelada',
          description: 'Você pode instalar o app a qualquer momento',
          variant: 'default'
        })
        
        return false
      }
    } catch (error) {
      console.error('❌ Erro na instalação PWA:', error)
      toast({
        title: 'Erro na Instalação',
        description: 'Não foi possível instalar o app',
        variant: 'destructive'
      })
      return false
    }
  }, [installPrompt, toast])

  // Enviar notificação local
  const sendLocalNotification = useCallback(async (
    title: string,
    options: NotificationOptions = {}
  ) => {
    if (status.notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') return false
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'cotai-local',
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        
        if (options.data?.url) {
          window.location.href = options.data.url
        }
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error)
      return false
    }
  }, [status.notificationPermission, requestNotificationPermission])

  // Subscrever push notifications
  const subscribeToPushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: 'Push não suportado',
        description: 'Seu navegador não suporta notificações push',
        variant: 'destructive'
      })
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Verificar se já tem subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Criar nova subscription (em produção usaria chave VAPID real)
        const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE' // Substituir por chave real
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        })
      }

      console.log('✅ Push subscription criada')
      
      // Aqui enviaria a subscription para o servidor
      // await sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('❌ Erro na subscription push:', error)
      toast({
        title: 'Erro nas Notificações Push',
        description: 'Não foi possível configurar notificações push',
        variant: 'destructive'
      })
      return null
    }
  }, [toast])

  // Verificar status inicial
  useEffect(() => {
    const checkPWAStatus = () => {
      const isServiceWorkerSupported = 'serviceWorker' in navigator
      const isNotificationSupported = 'Notification' in window
      const isOnline = navigator.onLine
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      
      setStatus({
        isInstallable: false, // Será atualizado pelo event listener
        isInstalled,
        isOnline,
        isServiceWorkerSupported,
        isNotificationSupported,
        notificationPermission: isNotificationSupported ? Notification.permission : null
      })
    }

    checkPWAStatus()
    
    // Event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as PWAInstallPrompt)
      setStatus(prev => ({ ...prev, isInstallable: true }))
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setStatus(prev => ({ ...prev, isInstallable: false, isInstalled: true }))
      
      toast({
        title: 'App Instalado!',
        description: 'CotAi Edge foi adicionado à sua tela inicial',
        variant: 'default'
      })
    }

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      toast({
        title: 'Conexão Restaurada',
        description: 'Você está online novamente',
        variant: 'default'
      })
    }

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
      toast({
        title: 'Modo Offline',
        description: 'Você está navegando offline. Alguns recursos podem estar limitados.',
        variant: 'destructive'
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Registrar Service Worker automaticamente
    registerServiceWorker()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [registerServiceWorker, toast])

  return {
    status,
    installPWA,
    requestNotificationPermission,
    sendLocalNotification,
    subscribeToPushNotifications
  }
}