/**
 * Custom hook for AI Service integration
 * Handles document processing and quality monitoring
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import { useRealtime } from '../providers/RealtimeProvider';

// Types
interface ProcessingStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_stage: number;
  total_stages: number;
  stage_name: string;
  progress_percentage: number;
  created_at: string;
  completed_at?: string;
  error?: string;
}

interface QualityScores {
  overall_score: number;
  quality_grade: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  component_scores: {
    layout_score: number;
    ocr_score: number;
    parse_score: number;
    table_score: number;
  };
  processing_stages: Array<{
    stage_id: number;
    stage_name: string;
    duration_seconds: number;
    confidence: number;
    status: string;
    errors: string[];
    warnings: string[];
  }>;
  total_processing_time: number;
}

interface ProcessingResult {
  task_id: string;
  file_path: string;
  structured_data: {
    numero_pregao?: string;
    uasg?: string;
    orgao?: string;
    objeto?: string;
    valor_estimado?: number;
    data_abertura?: string;
    modalidade?: string;
  };
  risks: Array<{
    risk_id: string;
    description: string;
    risk_type: string;
    probability: number;
    impact: number;
    criticality_score: number;
    mitigation_suggestions: string[];
  }>;
  opportunities: Array<{
    opportunity_id: string;
    description: string;
    opportunity_type: string;
    potential_value?: number;
    likelihood: number;
    strategic_importance: string;
    recommended_actions: string[];
  }>;
  quality_score: number;
  quality_grade: string;
}

interface UseAIServiceReturn {
  // Processing state
  isProcessing: boolean;
  processingStatus: ProcessingStatus | null;
  qualityScores: QualityScores | null;
  processingResult: ProcessingResult | null;
  error: string | null;
  
  // Actions
  uploadDocument: (file: File, metadata?: {
    ano?: number;
    uasg?: string;
    numero_pregao?: string;
    callback_url?: string;
  }) => Promise<string | null>;
  
  getProcessingStatus: (taskId: string) => Promise<void>;
  getQualityScores: (taskId: string) => Promise<void>;
  getProcessingResult: (taskId: string) => Promise<void>;
  
  // Utilities
  startStatusPolling: (taskId: string, interval?: number) => void;
  stopStatusPolling: () => void;
  reset: () => void;
}

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

export const useAIService = (): UseAIServiceReturn => {
  const { toast } = useToast();
  const { subscribe, unsubscribe } = useRealtime();
  
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [qualityScores, setQualityScores] = useState<QualityScores | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Upload document
  const uploadDocument = useCallback(async (
    file: File,
    metadata?: {
      ano?: number;
      uasg?: string;
      numero_pregao?: string;
      callback_url?: string;
    }
  ): Promise<string | null> => {
    try {
      setIsProcessing(true);
      setError(null);

      // Validate file
      if (!file.type.includes('pdf') && !file.type.includes('document')) {
        throw new Error('Apenas arquivos PDF e documentos são suportados');
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB
        throw new Error('Arquivo muito grande. Máximo 50MB');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata?.ano) formData.append('ano', metadata.ano.toString());
      if (metadata?.uasg) formData.append('uasg', metadata.uasg);
      if (metadata?.numero_pregao) formData.append('numero_pregao', metadata.numero_pregao);
      if (metadata?.callback_url) formData.append('callback_url', metadata.callback_url);

      // Upload to AI service
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/process/document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      const taskId = data.task_id;

      if (!taskId) {
        throw new Error('ID da tarefa não recebido');
      }

      toast({
        title: "📤 Upload Realizado",
        description: "Documento enviado para processamento com IA",
      });

      // Subscribe to real-time updates
      const unsubscribeRealtime = subscribe(taskId, (update) => {
        setProcessingStatus({
          task_id: update.task_id,
          status: update.status as ProcessingStatus['status'] || 'processing',
          current_stage: update.current_stage || 1,
          total_stages: 9,
          stage_name: update.stage_name || 'Processando',
          progress_percentage: update.progress_percentage || 0,
          created_at: new Date().toISOString(),
        });

        if (update.status === 'completed') {
          setIsProcessing(false);
          // Fetch final results
          setTimeout(() => {
            getQualityScores(taskId);
            getProcessingResult(taskId);
          }, 1000);
        } else if (update.status === 'failed') {
          setIsProcessing(false);
          setError('Processamento falhou');
        }
      });

      // Store unsubscribe function for cleanup
      setPollingInterval(() => unsubscribeRealtime as unknown as NodeJS.Timeout);

      // Start status polling as fallback
      startStatusPolling(taskId);

      return taskId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setIsProcessing(false);
      
      toast({
        title: "❌ Erro no Upload",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [toast]);

  // Get processing status
  const getProcessingStatus = useCallback(async (taskId: string): Promise<void> => {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/process/${taskId}/status`);
      
      if (!response.ok) {
        throw new Error(`Erro ao obter status: ${response.status}`);
      }

      const status: ProcessingStatus = await response.json();
      setProcessingStatus(status);

      // Update processing state
      if (status.status === 'completed') {
        setIsProcessing(false);
        stopStatusPolling();
        
        // Automatically fetch results
        await getQualityScores(taskId);
        await getProcessingResult(taskId);

        toast({
          title: "✅ Processamento Concluído",
          description: `Documento processado com sucesso (${status.stage_name})`,
        });

      } else if (status.status === 'failed') {
        setIsProcessing(false);
        stopStatusPolling();
        setError(status.error || 'Processamento falhou');

        toast({
          title: "❌ Processamento Falhou",
          description: status.error || 'Erro desconhecido durante processamento',
          variant: "destructive",
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter status';
      setError(errorMessage);
      console.error('Error getting processing status:', err);
    }
  }, [toast]);

  // Get quality scores
  const getQualityScores = useCallback(async (taskId: string): Promise<void> => {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/process/${taskId}/quality`);
      
      if (!response.ok) {
        throw new Error(`Erro ao obter qualidade: ${response.status}`);
      }

      const quality: QualityScores = await response.json();
      setQualityScores(quality);

    } catch (err) {
      console.error('Error getting quality scores:', err);
      // Don't set error state for quality scores as it's not critical
    }
  }, []);

  // Get processing result
  const getProcessingResult = useCallback(async (taskId: string): Promise<void> => {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/process/${taskId}/result`);
      
      if (!response.ok) {
        throw new Error(`Erro ao obter resultado: ${response.status}`);
      }

      const result: ProcessingResult = await response.json();
      setProcessingResult(result);

    } catch (err) {
      console.error('Error getting processing result:', err);
      // Don't set error state for results as it's not critical
    }
  }, []);

  // Start status polling
  const startStatusPolling = useCallback((taskId: string, interval: number = 3000): void => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Start new polling
    const newInterval = setInterval(async () => {
      await getProcessingStatus(taskId);
    }, interval);

    setPollingInterval(newInterval);
    
    // Get initial status
    getProcessingStatus(taskId);
  }, [pollingInterval, getProcessingStatus]);

  // Stop status polling
  const stopStatusPolling = useCallback((): void => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Reset state
  const reset = useCallback((): void => {
    stopStatusPolling();
    setIsProcessing(false);
    setProcessingStatus(null);
    setQualityScores(null);
    setProcessingResult(null);
    setError(null);
  }, [stopStatusPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  return {
    // State
    isProcessing,
    processingStatus,
    qualityScores,
    processingResult,
    error,
    
    // Actions
    uploadDocument,
    getProcessingStatus,
    getQualityScores,
    getProcessingResult,
    
    // Utilities
    startStatusPolling,
    stopStatusPolling,
    reset,
  };
};