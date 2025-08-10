/**
 * Document Upload Component
 * Handles document upload with AI processing integration
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { useToast } from '../../hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface DocumentMetadata {
  ano?: number;
  uasg?: string;
  numero_pregao?: string;
}

interface ProcessingStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_stage: number;
  total_stages: number;
  stage_name: string;
  progress_percentage: number;
}

interface DocumentUploadProps {
  onUploadComplete?: (taskId: string, file: File) => void;
  onProcessingUpdate?: (status: ProcessingStatus) => void;
  className?: string;
  disabled?: boolean;
}

// Processing status component
const ProcessingStatusCard: React.FC<{ 
  status: ProcessingStatus; 
  fileName: string;
}> = ({ status, fileName }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
      case 'pending':
      default:
        return 'text-blue-600';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'completed':
        return 'Processamento Concluído';
      case 'failed':
        return 'Processamento Falhou';
      case 'processing':
        return `Processando: ${status.stage_name}`;
      case 'pending':
      default:
        return 'Aguardando Processamento';
    }
  };

  return (
    <Card className="p-4 border-l-4 border-l-blue-500">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileName}
            </p>
            <Badge variant={status.status === 'failed' ? 'destructive' : 'default'}>
              {getStatusText()}
            </Badge>
          </div>
          
          {status.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Estágio {status.current_stage} de {status.total_stages}</span>
                <span>{Math.round(status.progress_percentage)}%</span>
              </div>
              <Progress value={status.progress_percentage} className="h-2" />
              <p className="text-xs text-gray-600">
                {status.stage_name}
              </p>
            </div>
          )}
          
          {status.status === 'completed' && (
            <div className="mt-2">
              <Progress value={100} className="h-2" />
              <p className="text-xs text-green-600 mt-1">
                ✅ Documento processado com sucesso! Clique para ver resultados.
              </p>
            </div>
          )}
          
          {status.status === 'failed' && (
            <div className="mt-2">
              <p className="text-xs text-red-600">
                ❌ Falha no processamento. Tente novamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onProcessingUpdate,
  className = '',
  disabled = false
}) => {
  const { toast } = useToast();
  
  // State
  const [metadata, setMetadata] = useState<DocumentMetadata>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    taskId: string;
    status: ProcessingStatus;
  }>>([]);

  // File upload handler
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        // Validate file
        if (!file.type.includes('pdf') && !file.type.includes('document')) {
          toast({
            title: "❌ Formato Inválido",
            description: `${file.name}: Apenas PDF e documentos Word são suportados`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB
          toast({
            title: "❌ Arquivo Muito Grande",
            description: `${file.name}: Máximo 50MB permitido`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to AI service
        const formData = new FormData();
        formData.append('file', file);
        
        if (metadata.ano) formData.append('ano', metadata.ano.toString());
        if (metadata.uasg) formData.append('uasg', metadata.uasg);
        if (metadata.numero_pregao) formData.append('numero_pregao', metadata.numero_pregao);

        const response = await fetch('/api/ai/process-document', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const taskId = data.task_id;

        if (!taskId) {
          throw new Error('ID da tarefa não recebido');
        }

        // Add to uploaded files list
        const initialStatus: ProcessingStatus = {
          task_id: taskId,
          status: 'pending',
          current_stage: 1,
          total_stages: 9,
          stage_name: 'Inicializando',
          progress_percentage: 0
        };

        setUploadedFiles(prev => [...prev, {
          file,
          taskId,
          status: initialStatus
        }]);

        // Notify parent component
        onUploadComplete?.(taskId, file);

        toast({
          title: "📤 Upload Realizado",
          description: `${file.name} enviado para processamento com IA`,
        });

        // Start status polling for this file
        pollProcessingStatus(taskId, file);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      toast({
        title: "❌ Erro no Upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [disabled, metadata, onUploadComplete, toast]);

  // Status polling
  const pollProcessingStatus = useCallback(async (taskId: string, file: File) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/process-status/${taskId}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao obter status: ${response.status}`);
        }

        const status: ProcessingStatus = await response.json();

        // Update file status
        setUploadedFiles(prev => prev.map(item => 
          item.taskId === taskId 
            ? { ...item, status }
            : item
        ));

        // Notify parent
        onProcessingUpdate?.(status);

        // Stop polling when complete or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
          
          if (status.status === 'completed') {
            toast({
              title: "✅ Processamento Concluído",
              description: `${file.name} processado com sucesso!`,
            });
          } else {
            toast({
              title: "❌ Processamento Falhou",
              description: `Erro ao processar ${file.name}`,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
      }
    }, 3000);

    // Cleanup after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 30 * 60 * 1000);
  }, [onProcessingUpdate, toast]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: disabled || isUploading
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metadata Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informações do Documento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ano
            </label>
            <Input
              type="number"
              min="2020"
              max="2030"
              value={metadata.ano || ''}
              onChange={(e) => setMetadata(prev => ({
                ...prev,
                ano: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              placeholder="2024"
              disabled={disabled || isUploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UASG
            </label>
            <Input
              type="text"
              maxLength={6}
              value={metadata.uasg || ''}
              onChange={(e) => setMetadata(prev => ({
                ...prev,
                uasg: e.target.value
              }))}
              placeholder="986531"
              disabled={disabled || isUploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Pregão
            </label>
            <Input
              type="text"
              value={metadata.numero_pregao || ''}
              onChange={(e) => setMetadata(prev => ({
                ...prev,
                numero_pregao: e.target.value
              }))}
              placeholder="PE-001-2024"
              disabled={disabled || isUploading}
            />
          </div>
        </div>
      </Card>

      {/* Upload Area */}
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">
              Solte os arquivos aqui...
            </p>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Arraste arquivos ou clique para selecionar
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Suportados: PDF, DOC, DOCX (máximo 50MB cada)
              </p>
              <Button disabled={disabled || isUploading}>
                {isUploading ? 'Enviando...' : 'Selecionar Arquivos'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Processing Status */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Status do Processamento
          </h3>
          
          {uploadedFiles.map((item, index) => (
            <ProcessingStatusCard
              key={index}
              status={item.status}
              fileName={item.file.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};