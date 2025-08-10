/**
 * Supabase Realtime Provider
 * Manages real-time subscriptions for document processing updates
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '../hooks/use-toast';

interface ProcessingUpdate {
  task_id: string;
  status?: string;
  current_stage?: number;
  stage_name?: string;
  progress_percentage?: number;
  quality_grade?: string;
  quality_score?: number;
  risks_count?: number;
  opportunities_count?: number;
  timestamp: string;
}

interface RealtimeContextValue {
  isConnected: boolean;
  subscribe: (taskId: string, callback: (update: ProcessingUpdate) => void) => () => void;
  unsubscribe: (taskId: string) => void;
  subscribeToChannel: (channel: string, callback: (payload: unknown) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map());
  const [subscriptions, setSubscriptions] = useState<Map<string, Set<(update: ProcessingUpdate) => void>>>(new Map());
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // Connection status monitoring
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Supabase Realtime connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Supabase Realtime disconnected');
    };

    const handleError = (error: unknown) => {
      console.error('Supabase Realtime error:', error);
      setIsConnected(false);
    };

    // Set up connection listeners
    supabase.realtime.onOpen(handleConnect);
    supabase.realtime.onClose(handleDisconnect);
    supabase.realtime.onError(handleError);

    return () => {
      // Cleanup
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setChannels(new Map());
      setSubscriptions(new Map());
    };
  }, [supabase, channels]);

  // Subscribe to task-specific updates
  const subscribe = useCallback((taskId: string, callback: (update: ProcessingUpdate) => void) => {
    // Add callback to subscriptions
    const taskSubscriptions = subscriptions.get(taskId) || new Set();
    taskSubscriptions.add(callback);
    setSubscriptions(prev => new Map(prev.set(taskId, taskSubscriptions)));

    // Create or get channel for this task
    let channel = channels.get(taskId);
    
    if (!channel) {
      channel = supabase
        .channel(`processing-${taskId}`)
        .on('broadcast', { event: 'status_update' }, (payload) => {
          const update = payload.payload as ProcessingUpdate;
          
          if (update.task_id === taskId) {
            // Notify all subscribers for this task
            const subscribers = subscriptions.get(taskId);
            if (subscribers) {
              subscribers.forEach(cb => cb(update));
            }

            // Show toast notification for status changes
            if (update.status === 'processing') {
              toast({
                title: "🔄 Processamento em Andamento",
                description: `Estágio: ${update.stage_name} (${update.progress_percentage}%)`,
              });
            }
          }
        })
        .on('broadcast', { event: 'processing_complete' }, (payload) => {
          const update = payload.payload as ProcessingUpdate;
          
          if (update.task_id === taskId) {
            // Notify all subscribers
            const subscribers = subscriptions.get(taskId);
            if (subscribers) {
              subscribers.forEach(cb => cb(update));
            }

            // Show completion notification
            toast({
              title: "✅ Processamento Concluído!",
              description: `Qualidade: ${update.quality_grade} (${update.quality_score}/100)`,
            });
          }
        })
        .on('broadcast', { event: 'processing_failed' }, (payload) => {
          const update = payload.payload as ProcessingUpdate;
          
          if (update.task_id === taskId) {
            // Notify all subscribers
            const subscribers = subscriptions.get(taskId);
            if (subscribers) {
              subscribers.forEach(cb => cb(update));
            }

            // Show error notification
            toast({
              title: "❌ Processamento Falhou",
              description: "Ocorreu um erro durante o processamento do documento",
              variant: "destructive",
            });
          }
        })
        .subscribe();

      setChannels(prev => new Map(prev.set(taskId, channel!)));
    }

    // Return unsubscribe function
    return () => {
      const taskSubscriptions = subscriptions.get(taskId);
      if (taskSubscriptions) {
        taskSubscriptions.delete(callback);
        
        if (taskSubscriptions.size === 0) {
          // No more subscribers for this task, remove channel
          const channel = channels.get(taskId);
          if (channel) {
            supabase.removeChannel(channel);
            setChannels(prev => {
              const newChannels = new Map(prev);
              newChannels.delete(taskId);
              return newChannels;
            });
          }
          
          setSubscriptions(prev => {
            const newSubscriptions = new Map(prev);
            newSubscriptions.delete(taskId);
            return newSubscriptions;
          });
        } else {
          setSubscriptions(prev => new Map(prev.set(taskId, taskSubscriptions)));
        }
      }
    };
  }, [subscriptions, channels, supabase, toast]);

  // Unsubscribe from task updates
  const unsubscribe = useCallback((taskId: string) => {
    const channel = channels.get(taskId);
    if (channel) {
      supabase.removeChannel(channel);
      setChannels(prev => {
        const newChannels = new Map(prev);
        newChannels.delete(taskId);
        return newChannels;
      });
    }
    
    setSubscriptions(prev => {
      const newSubscriptions = new Map(prev);
      newSubscriptions.delete(taskId);
      return newSubscriptions;
    });
  }, [channels, supabase]);

  // Subscribe to generic channels
  const subscribeToChannel = useCallback((channelName: string, callback: (payload: unknown) => void) => {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: '*' }, callback)
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const value: RealtimeContextValue = {
    isConnected,
    subscribe,
    unsubscribe,
    subscribeToChannel,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};