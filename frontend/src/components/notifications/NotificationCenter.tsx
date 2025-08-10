/**
 * Notification Center Component
 * Displays real-time notifications and processing updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useRealtime } from '../../providers/RealtimeProvider';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  taskId?: string;
}

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { subscribeToChannel } = useRealtime();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to processing notifications
  useEffect(() => {
    const unsubscribe = subscribeToChannel('document-processing', (payload) => {
      const { event, payload: data } = payload as { event: string; payload: Record<string, unknown> };
      
      let notification: Notification | null = null;

      switch (event) {
        case 'status_update':
          notification = {
            id: `${(data as any).task_id}-${Date.now()}`,
            type: 'info',
            title: 'Processamento em Andamento',
            message: `${(data as any).stage_name} (${(data as any).progress_percentage}%)`,
            timestamp: new Date(),
            read: false,
            taskId: (data as any).task_id,
          };
          break;

        case 'processing_complete':
          notification = {
            id: `${(data as any).task_id}-complete-${Date.now()}`,
            type: 'success',
            title: 'Processamento Concluído!',
            message: `Qualidade: ${(data as any).quality_grade} (${(data as any).quality_score}/100). ${(data as any).risks_count} riscos e ${(data as any).opportunities_count} oportunidades identificadas.`,
            timestamp: new Date(),
            read: false,
            taskId: (data as any).task_id,
          };
          break;

        case 'processing_failed':
          notification = {
            id: `${(data as any).task_id}-failed-${Date.now()}`,
            type: 'error',
            title: 'Processamento Falhou',
            message: (data as any).error || 'Erro durante o processamento do documento',
            timestamp: new Date(),
            read: false,
            taskId: (data as any).task_id,
          };
          break;

        case 'quality_alert':
          notification = {
            id: `${(data as any).task_id}-quality-${Date.now()}`,
            type: 'warning',
            title: 'Alerta de Qualidade',
            message: `Documento com qualidade ${(data as any).quality_grade}. Revisão manual recomendada.`,
            timestamp: new Date(),
            read: false,
            taskId: (data as any).task_id,
          };
          break;
      }

      if (notification) {
        setNotifications(prev => [notification!, ...prev]);
      }
    });

    return () => unsubscribe();
  }, [subscribeToChannel]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 h-auto"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">
                          {notification.message}
                        </p>

                        {notification.taskId && (
                          <p className="text-xs text-gray-400 font-mono">
                            Task: {notification.taskId.substring(0, 8)}...
                          </p>
                        )}

                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs mt-1"
                          >
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="w-full text-xs"
              >
                Limpar todas
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};