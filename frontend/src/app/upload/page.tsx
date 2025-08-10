/**
 * Document Upload Page
 * Main page for AI-powered document upload and processing
 */

'use client';

import React from 'react';
import { Header } from '../../components/layout/Header';
import { DocumentUpload } from '../../components/ai/DocumentUpload';
import { QualityDashboard } from '../../components/ai/QualityDashboard';
import { RealtimeStatusIndicator } from '../../components/ai/RealtimeStatusIndicator';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Upload, Cpu, Zap, Shield } from 'lucide-react';

export default function UploadPage() {
  const [currentTaskId, setCurrentTaskId] = React.useState<string | null>(null);
  const [processingFile, setProcessingFile] = React.useState<File | null>(null);

  const handleUploadComplete = (taskId: string, file: File) => {
    setCurrentTaskId(taskId);
    setProcessingFile(file);
  };

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-blue-500" />,
      title: "Processamento com IA",
      description: "9 estágios de extração automática com IBM Docling"
    },
    {
      icon: <Zap className="w-6 h-6 text-green-500" />,
      title: "Tempo Real",
      description: "Atualizações instantâneas durante processamento"
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      title: "Análise de Qualidade",
      description: "Pontuação e auditoria completa de documentos"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Upload de Documentos
              </h1>
              <p className="text-gray-600">
                Envie seus documentos para processamento automático com inteligência artificial
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealtimeStatusIndicator />
              <Badge variant="secondary" className="px-3 py-1">
                <Upload className="w-4 h-4 mr-1" />
                Sistema AI Ativo
              </Badge>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <DocumentUpload 
              onUploadComplete={handleUploadComplete}
              className="mb-8"
            />
          </div>

          {/* Quality Dashboard */}
          <div>
            {currentTaskId && processingFile ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Monitoramento de Qualidade
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Acompanhamento em tempo real: <strong>{processingFile.name}</strong>
                  </p>
                </div>
                
                <QualityDashboard 
                  taskId={currentTaskId} 
                  fileName={processingFile.name}
                />
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Cpu className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Dashboard de Qualidade
                </h3>
                <p className="text-gray-600">
                  Faça upload de um documento para ver o monitoramento de qualidade em tempo real
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ✅ Sistema de IA operacional | 
            🔄 Processamento em tempo real ativo | 
            📊 Auditoria completa habilitada
          </p>
        </div>
      </div>
    </div>
  );
}