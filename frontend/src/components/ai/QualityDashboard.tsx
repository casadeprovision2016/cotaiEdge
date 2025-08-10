/**
 * Quality Dashboard Component
 * Real-time quality monitoring for document processing
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react';

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

interface QualityDashboardProps {
  taskId: string;
  fileName: string;
  qualityScores?: QualityScores | null;
  isLoading?: boolean;
  className?: string;
}

// Quality score to percentage conversion
const scoreToPercentage = (score: number): number => Math.round(score * 100);

// Quality grade colors and icons
const getQualityGradeStyle = (grade: string) => {
  switch (grade) {
    case 'EXCELLENT':
      return { 
        color: 'bg-green-500 text-white', 
        textColor: 'text-green-600',
        icon: '🏆',
        description: 'Excelente'
      };
    case 'GOOD':
      return { 
        color: 'bg-blue-500 text-white', 
        textColor: 'text-blue-600',
        icon: '✅',
        description: 'Bom'
      };
    case 'FAIR':
      return { 
        color: 'bg-yellow-500 text-white', 
        textColor: 'text-yellow-600',
        icon: '⚠️',
        description: 'Satisfatório'
      };
    case 'POOR':
      return { 
        color: 'bg-red-500 text-white', 
        textColor: 'text-red-600',
        icon: '❌',
        description: 'Insatisfatório'
      };
    default:
      return { 
        color: 'bg-gray-500 text-white', 
        textColor: 'text-gray-600',
        icon: '❓',
        description: 'Desconhecido'
      };
  }
};

// Component score labels in Portuguese
const getComponentLabel = (component: string): string => {
  const labels: Record<string, string> = {
    layout_score: 'Layout do Documento',
    ocr_score: 'Reconhecimento OCR',
    parse_score: 'Análise de Conteúdo',
    table_score: 'Extração de Tabelas'
  };
  return labels[component] || component;
};

// Progress ring component for overall score
const QualityMeter: React.FC<{ score: number; grade: string }> = ({ score, grade }) => {
  const percentage = scoreToPercentage(score);
  const gradeStyle = getQualityGradeStyle(grade);
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke={gradeStyle.textColor.replace('text-', '#')}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${2.51 * percentage} 251.2`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900">
          {percentage}%
        </div>
        <div className={`text-sm font-medium ${gradeStyle.textColor}`}>
          {gradeStyle.description}
        </div>
        <div className="text-lg">
          {gradeStyle.icon}
        </div>
      </div>
    </div>
  );
};

// Component score bar
const ComponentScore: React.FC<{ 
  label: string; 
  score: number; 
  className?: string;
}> = ({ label, score, className = '' }) => {
  const percentage = scoreToPercentage(score);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
      />
    </div>
  );
};

// Processing stage timeline
const ProcessingStages: React.FC<{ stages: QualityScores['processing_stages'] }> = ({ stages }) => {
  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.stage_id} className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {stage.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : stage.errors.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-900">
                Estágio {stage.stage_id}: {stage.stage_name}
              </p>
              <span className="text-xs text-gray-500">
                {stage.duration_seconds.toFixed(1)}s
              </span>
            </div>
            
            {/* Confidence bar */}
            <div className="mt-1">
              <Progress 
                value={scoreToPercentage(stage.confidence)} 
                className="h-1"
              />
            </div>
            
            {/* Errors and warnings */}
            {stage.errors.length > 0 && (
              <div className="mt-1">
                {stage.errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-600">
                    ❌ {error}
                  </p>
                ))}
              </div>
            )}
            
            {stage.warnings.length > 0 && (
              <div className="mt-1">
                {stage.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-yellow-600">
                    ⚠️ {warning}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const QualityDashboard: React.FC<QualityDashboardProps> = ({
  taskId,
  fileName,
  qualityScores,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!qualityScores) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Qualidade dos Documentos</h3>
          <p>Faça upload de um documento para ver a análise de qualidade.</p>
        </div>
      </Card>
    );
  }

  const gradeStyle = getQualityGradeStyle(qualityScores.quality_grade);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Quality Score */}
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Qualidade Geral do Documento
          </h3>
          
          <QualityMeter 
            score={qualityScores.overall_score} 
            grade={qualityScores.quality_grade}
          />
          
          <div className="mt-4">
            <Badge className={gradeStyle.color}>
              {gradeStyle.icon} {gradeStyle.description}
            </Badge>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Processamento concluído em {qualityScores.total_processing_time.toFixed(1)}s
          </div>
        </div>
      </Card>

      {/* Component Scores */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Pontuação por Componente
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(qualityScores.component_scores).map(([component, score]) => (
            <ComponentScore
              key={component}
              label={getComponentLabel(component)}
              score={score}
            />
          ))}
        </div>
      </Card>

      {/* Processing Stages Timeline */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Timeline de Processamento
        </h4>
        
        <ProcessingStages stages={qualityScores.processing_stages} />
      </Card>
    </div>
  );
};