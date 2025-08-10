/**
 * Realtime Status Indicator
 * Shows connection status and real-time updates
 */

'use client';

import React from 'react';
import { useRealtime } from '../../providers/RealtimeProvider';
import { Badge } from '../ui/Badge';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatusIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

export const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({
  showLabel = true,
  className = ''
}) => {
  const { isConnected } = useRealtime();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isConnected ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      
      {showLabel && (
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {isConnected ? 'Tempo Real Ativo' : 'Desconectado'}
        </Badge>
      )}
    </div>
  );
};