'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'

interface Supplier {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  address: string
  category: 'products' | 'transport' | 'both'
  status: 'active' | 'inactive' | 'pending'
  rating: number
  createdAt: string
  lastContact: string
  totalContracts: number
  totalValue: number
  products?: Product[]
  transportRoutes?: TransportRoute[]
}

interface Product {
  id: string
  name: string
  category: string
  description: string
  unit: string
  price: number
  availability: 'available' | 'limited' | 'unavailable'
  certifications: string[]
  image?: string
  supplierId: string
}

interface TransportRoute {
  id: string
  origin: string
  destination: string
  distance: number
  estimatedTime: string
  pricePerKm: number
  vehicleType: string
  maxCapacity: string
  availability: 'available' | 'busy' | 'unavailable'
  supplierId: string
}

export default function ProvedorPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([])
  const [activeTab, setActiveTab] = useState<'suppliers' | 'products' | 'transport'>('suppliers')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const { toast } = useToast()

  // Mock data
  const mockSuppliers: Supplier[] = [
    {
      id: '1',
      name: 'Distribuidora ABC Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@abcdist.com.br',
      phone: '(11) 3456-7890',
      address: 'Rua das Flores, 123 - São Paulo/SP',
      category: 'products',
      status: 'active',
      rating: 4.8,
      createdAt: '2024-01-15',
      lastContact: '2025-08-01',
      totalContracts: 25,
      totalValue: 350000
    },
    {
      id: '2',
      name: 'Transportes Rápidos S.A.',
      cnpj: '98.765.432/0001-10',
      email: 'comercial@transporterapidos.com.br',
      phone: '(11) 9876-5432',
      address: 'Av. Industrial, 456 - São Paulo/SP',
      category: 'transport',
      status: 'active',
      rating: 4.5,
      createdAt: '2024-03-20',
      lastContact: '2025-07-30',
      totalContracts: 18,
      totalValue: 180000
    },
    {
      id: '3',
      name: 'Mega Fornecimentos e Logística',
      cnpj: '11.222.333/0001-44',
      email: 'vendas@megafl.com.br',
      phone: '(11) 1122-3344',
      address: 'Rod. Anhanguera, km 25 - Osasco/SP',
      category: 'both',
      status: 'active',
      rating: 4.9,
      createdAt: '2023-11-10',
      lastContact: '2025-08-02',
      totalContracts: 42,
      totalValue: 620000
    },
    {
      id: '4',
      name: 'Tech Solutions Produtos',
      cnpj: '55.666.777/0001-88',
      email: 'atendimento@techsolutions.com.br',
      phone: '(11) 5566-7788',
      address: 'Rua da Tecnologia, 789 - São Paulo/SP',
      category: 'products',
      status: 'pending',
      rating: 4.2,
      createdAt: '2025-07-15',
      lastContact: '2025-07-28',
      totalContracts: 3,
      totalValue: 45000
    }
  ]

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Papel A4 75g/m² - Resma 500 folhas',
      category: 'Material de Escritório',
      description: 'Papel branco de alta qualidade para impressão',
      unit: 'Resma',
      price: 25.90,
      availability: 'available',
      certifications: ['FSC', 'ISO 9001'],
      supplierId: '1'
    },
    {
      id: '2',
      name: 'Notebook Dell Inspiron 15',
      category: 'Equipamentos de TI',
      description: 'Notebook Intel Core i5, 8GB RAM, 256GB SSD',
      unit: 'Unidade',
      price: 2899.99,
      availability: 'limited',
      certifications: ['Anatel', 'Inmetro'],
      supplierId: '3'
    },
    {
      id: '3',
      name: 'Caneta Esferográfica Azul',
      category: 'Material de Escritório',
      description: 'Caneta esferográfica ponta 1.0mm, tinta azul',
      unit: 'Caixa com 50 unidades',
      price: 45.50,
      availability: 'available',
      certifications: ['Inmetro'],
      supplierId: '1'
    },
    {
      id: '4',
      name: 'Monitor LED 24 polegadas',
      category: 'Equipamentos de TI',
      description: 'Monitor Full HD, conectores HDMI e VGA',
      unit: 'Unidade',
      price: 650.00,
      availability: 'available',
      certifications: ['Anatel', 'Energy Star'],
      supplierId: '4'
    }
  ]

  const mockTransportRoutes: TransportRoute[] = [
    {
      id: '1',
      origin: 'São Paulo/SP',
      destination: 'Rio de Janeiro/RJ',
      distance: 430,
      estimatedTime: '6-8 horas',
      pricePerKm: 2.80,
      vehicleType: 'Caminhão Truck',
      maxCapacity: '14 toneladas',
      availability: 'available',
      supplierId: '2'
    },
    {
      id: '2',
      origin: 'São Paulo/SP',
      destination: 'Belo Horizonte/MG',
      distance: 586,
      estimatedTime: '8-10 horas',
      pricePerKm: 2.50,
      vehicleType: 'Carreta',
      maxCapacity: '25 toneladas',
      availability: 'available',
      supplierId: '3'
    },
    {
      id: '3',
      origin: 'São Paulo/SP',
      destination: 'Brasília/DF',
      distance: 1015,
      estimatedTime: '12-14 horas',
      pricePerKm: 3.20,
      vehicleType: 'Bitrem',
      maxCapacity: '40 toneladas',
      availability: 'busy',
      supplierId: '2'
    },
    {
      id: '4',
      origin: 'São Paulo/SP',
      destination: 'Salvador/BA',
      distance: 1962,
      estimatedTime: '20-24 horas',
      pricePerKm: 3.50,
      vehicleType: 'Carreta',
      maxCapacity: '25 toneladas',
      availability: 'available',
      supplierId: '3'
    }
  ]

  useEffect(() => {
    setSuppliers(mockSuppliers)
    setProducts(mockProducts)
    setTransportRoutes(mockTransportRoutes)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'limited': case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'unavailable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'products': return '📦'
      case 'transport': return '🚛'
      case 'both': return '🏢'
      default: return '🏪'
    }
  }

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '⭐' : '')
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.cnpj.includes(searchTerm) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRoutes = transportRoutes.filter(route =>
    route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Gestão FT
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão Completa de Fornecedores e Transporte
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <span className="mr-2">➕</span>
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'suppliers', name: 'Fornecedores', icon: '🏢' },
            { id: 'products', name: 'Catálogo de Produtos', icon: '📦' },
            { id: 'transport', name: 'Rotas de Transporte', icon: '🚛' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'suppliers' | 'products' | 'transport')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            {activeTab === 'suppliers' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="products">Produtos</option>
                    <option value="transport">Transporte</option>
                    <option value="both">Produtos + Transporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedStatus('all')
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo das Tabs */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getCategoryIcon(supplier.category)}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <p className="text-sm text-gray-600">{supplier.cnpj}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                    {supplier.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📧</span>
                    {supplier.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📞</span>
                    {supplier.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span>
                    {supplier.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-blue-600">{supplier.totalContracts}</div>
                    <div className="text-xs text-gray-600">Contratos</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-green-600">
                      R$ {(supplier.totalValue / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-gray-600">Volume</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-600">Avaliação:</span>
                    <span className="text-sm">{getRatingStars(supplier.rating)}</span>
                    <span className="text-sm text-gray-600">({supplier.rating})</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Último contato: {new Date(supplier.lastContact).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    <span className="mr-1">✏️</span>
                    Editar
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1">
                    <span className="mr-1">👁️</span>
                    Ver
                  </Button>
                  <Button size="sm" variant="secondary">
                    <span className="mr-1">💬</span>
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">📦</span>
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{product.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Unidade:</span>
                        <span className="text-sm text-gray-600 ml-1">{product.unit}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Preço:</span>
                        <span className="text-sm text-green-600 ml-1 font-semibold">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Fornecedor:</span>
                        <span className="text-sm text-gray-600 ml-1">
                          {suppliers.find(s => s.id === product.supplierId)?.name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {product.certifications.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Certificações:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.certifications.map((cert, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(product.availability)}`}>
                      {product.availability === 'available' ? 'Disponível' :
                       product.availability === 'limited' ? 'Limitado' : 'Indisponível'}
                    </span>
                    <Button size="sm">
                      <span className="mr-1">🛒</span>
                      Solicitar Cotação
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'transport' && (
        <div className="space-y-4">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-xl">🚛</span>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {route.origin} → {route.destination}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Fornecedor: {suppliers.find(s => s.id === route.supplierId)?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Distância:</span>
                        <div className="text-sm text-gray-600">{route.distance} km</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tempo estimado:</span>
                        <div className="text-sm text-gray-600">{route.estimatedTime}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Preço por km:</span>
                        <div className="text-sm text-green-600 font-semibold">R$ {route.pricePerKm.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Valor total:</span>
                        <div className="text-sm text-green-600 font-semibold">
                          R$ {(route.distance * route.pricePerKm).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tipo de veículo:</span>
                        <div className="text-sm text-gray-600">{route.vehicleType}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Capacidade máxima:</span>
                        <div className="text-sm text-gray-600">{route.maxCapacity}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(route.availability)}`}>
                      {route.availability === 'available' ? 'Disponível' :
                       route.availability === 'busy' ? 'Ocupado' : 'Indisponível'}
                    </span>
                    <Button size="sm" disabled={route.availability !== 'available'}>
                      <span className="mr-1">📋</span>
                      Solicitar Transporte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {((activeTab === 'suppliers' && filteredSuppliers.length === 0) ||
        (activeTab === 'products' && filteredProducts.length === 0) ||
        (activeTab === 'transport' && filteredRoutes.length === 0)) && (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">
                {activeTab === 'suppliers' ? '🏢' : activeTab === 'products' ? '📦' : '🚛'}
              </div>
              <h3 className="text-lg font-medium mb-2">
                Nenhum {activeTab === 'suppliers' ? 'fornecedor' : activeTab === 'products' ? 'produto' : 'rota'} encontrado
              </h3>
              <p className="text-sm">
                Ajuste os filtros ou adicione novos {activeTab === 'suppliers' ? 'fornecedores' : activeTab === 'products' ? 'produtos' : 'rotas'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}