'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Fornecedores
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua rede de fornecedores e avalie performance
          </p>
        </div>
        <Button>
          <span className="mr-2">➕</span>
          Adicionar Fornecedor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">127</div>
            <p className="text-sm text-gray-600">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">98</div>
            <p className="text-sm text-gray-600">Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">8.7</div>
            <p className="text-sm text-gray-600">De 0 a 10</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium mb-2">Carregando fornecedores...</h3>
            <p className="text-sm">A lista de fornecedores será exibida aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}