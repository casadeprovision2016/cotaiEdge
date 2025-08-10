/**
 * Header Component
 * Application header with navigation and real-time status
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RealtimeStatusIndicator } from '../ai/RealtimeStatusIndicator';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileText, Home, Settings, Upload, BarChart3 } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Cotações', href: '/quotations', icon: FileText },
  { name: 'Qualidade', href: '/quality', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const pathname = usePathname();

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CotAi Edge</h1>
                <p className="text-xs text-gray-500 -mt-1">Gestão Inteligente</p>
              </div>
            </Link>
            
            <Badge variant="secondary" className="ml-3 text-xs">
              v2.0.0 Beta
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Status and Notifications */}
          <div className="flex items-center space-x-4">
            {/* Real-time Status */}
            <RealtimeStatusIndicator showLabel={false} />
            
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* User Menu */}
            <Button variant="ghost" size="sm" className="ml-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">U</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};