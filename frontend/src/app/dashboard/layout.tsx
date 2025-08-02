'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePWA } from '@/hooks/usePWA'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const { status: pwaStatus, installPWA } = usePWA()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', current: pathname === '/dashboard' },
    { name: 'Pesquisa nLic', href: '/dashboard/quotations', icon: '🔍', current: pathname === '/dashboard/quotations' },
    { name: 'CotAi Kanban', href: '/dashboard/cotai', icon: '📋', current: pathname === '/dashboard/cotai' },
    { name: 'PNCP Oportunidades', href: '/dashboard/pncp', icon: '🏛️', current: pathname === '/dashboard/pncp' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: '📈', current: pathname === '/dashboard/analytics' },
    { name: 'Mensagem', href: '/dashboard/mensagem', icon: '💬', current: pathname === '/dashboard/mensagem' },
    { name: 'Agenda', href: '/dashboard/agenda', icon: '📅', current: pathname === '/dashboard/agenda' },
    { name: 'Gestão FT', href: '/dashboard/provedor', icon: '🏢', current: pathname === '/dashboard/provedor' },
    { name: 'Relatórios', href: '/dashboard/reports', icon: '📈', current: pathname === '/dashboard/reports' },
  ]

  const handleProfileMenuClick = () => {
    setShowProfileMenu(!showProfileMenu)
  }

  const handleInstitucionalRedirect = () => {
    router.push('/')
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && !(event.target as Element).closest('.profile-menu')) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CotAi Edge
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${item.current 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-gray-600"
              onClick={handleSignOut}
            >
              <span className="mr-2">🚪</span>
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CotAi Edge
            </h1>
            <div className="flex items-center space-x-2">
              {/* Mobile Notifications */}
              <div className="relative">
                <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  🔔
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>
              {/* Mobile Profile */}
              <button
                onClick={handleProfileMenuClick}
                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm"
              >
                {user?.email?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Logo + Sidebar Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CotAi Edge
              </h1>
            </div>

            {/* Right: PWA Install + Notifications + Welcome + Profile */}
            <div className="flex items-center space-x-4">
              {/* PWA Install Button */}
              {pwaStatus.isInstallable && (
                <button
                  onClick={installPWA}
                  className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  <span>📱</span>
                  <span>Instalar App</span>
                </button>
              )}
              
              {/* Network Status */}
              <div className={`w-2 h-2 rounded-full ${
                pwaStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} title={pwaStatus.isOnline ? 'Online' : 'Offline'}></div>
              
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative">
                  🔔
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Welcome Message */}
              <div className="text-sm text-gray-600">
                Bem-vindo, {user?.email?.split('@')[0]}
              </div>

              {/* License Usage */}
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Licença: 20/200
              </div>

              {/* Profile Menu */}
              <div className="relative profile-menu">
                <button
                  onClick={handleProfileMenuClick}
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm hover:bg-blue-200 transition-colors"
                >
                  {user?.email?.charAt(0).toUpperCase()}
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <span className="mr-3">⚙️</span>
                      Configurações
                    </Link>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        handleInstitucionalRedirect()
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-3">🏠</span>
                      Página Institucional
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        handleSignOut()
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <span className="mr-3">🚪</span>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}