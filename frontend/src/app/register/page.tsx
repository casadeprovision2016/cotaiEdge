'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Building2, User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react'

interface RegisterFormData {
  // Dados da empresa
  companyName: string
  cnpj: string
  companyEmail: string
  companyPhone: string
  
  // Dados do usuário
  userName: string
  userEmail: string
  password: string
  confirmPassword: string
  
  // Aceitar termos
  acceptTerms: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<RegisterFormData>({
    companyName: '',
    cnpj: '',
    companyEmail: '',
    companyPhone: '',
    userName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    // Validação da empresa
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório'
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório'
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
    }

    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'Email da empresa é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Email da empresa inválido'
    }

    // Validação do usuário
    if (!formData.userName.trim()) {
      newErrors.userName = 'Nome do usuário é obrigatório'
    }

    if (!formData.userEmail.trim()) {
      newErrors.userEmail = 'Email do usuário é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      newErrors.userEmail = 'Email do usuário inválido'
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem'
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Formatador de CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  // Formatador de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15)
  }

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    let processedValue = value

    // Aplicar formatação específica
    if (field === 'cnpj' && typeof value === 'string') {
      processedValue = formatCNPJ(value)
    } else if (field === 'companyPhone' && typeof value === 'string') {
      processedValue = formatPhone(value)
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Erro no formulário',
        description: 'Por favor, corrija os erros antes de continuar',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.userEmail,
        password: formData.password,
        options: {
          data: {
            name: formData.userName,
            company_name: formData.companyName
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      // 2. Criar organização no banco
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: formData.companyName,
          cnpj: formData.cnpj.replace(/\D/g, ''), // Salvar só números
          email: formData.companyEmail,
          phone: formData.companyPhone,
          subscription_plan: 'trial',
          status: 'active'
        }])
        .select()
        .single()

      if (orgError) {
        throw new Error('Erro ao criar organização: ' + orgError.message)
      }

      // 3. Criar usuário na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          supabase_uid: authData.user.id,
          organization_id: orgData.id,
          email: formData.userEmail,
          name: formData.userName,
          role: 'admin',
          permissions: {
            quotations_create: true,
            quotations_edit: true,
            quotations_delete: true,
            quotations_view: true,
            quotations_manage_status: true,
            suppliers_create: true,
            suppliers_edit: true,
            suppliers_delete: true,
            suppliers_view: true,
            users_create: true,
            users_edit: true,
            users_delete: true,
            users_view: true,
            reports_view: true,
            reports_export: true,
            settings_view: true,
            settings_edit: true,
            organization_manage: true
          },
          status: 'active',
          trial_start: new Date().toISOString()
        }])

      if (userError) {
        throw new Error('Erro ao criar usuário: ' + userError.message)
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu email para confirmar a conta. Você será redirecionado para o login.',
      })

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login?message=Verifique seu email para ativar a conta')
      }, 3000)

    } catch (error) {
      console.error('Erro no registro:', error)
      toast({
        title: 'Erro ao criar conta',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Criar Conta - CotAi Edge
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Automatize seu processo de cotações com inteligência artificial
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados da Empresa */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Dados da Empresa</h3>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Nome da empresa"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={errors.companyName ? 'border-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="CNPJ (XX.XXX.XXX/XXXX-XX)"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      className={errors.cnpj ? 'border-red-500' : ''}
                    />
                    {errors.cnpj && (
                      <p className="text-sm text-red-500 mt-1">{errors.cnpj}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="tel"
                      placeholder="Telefone (XX) XXXXX-XXXX"
                      value={formData.companyPhone}
                      onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                      className={errors.companyPhone ? 'border-red-500' : ''}
                    />
                    {errors.companyPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.companyPhone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email da empresa"
                    value={formData.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className={errors.companyEmail ? 'border-red-500' : ''}
                  />
                  {errors.companyEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.companyEmail}</p>
                  )}
                </div>
              </div>

              {/* Dados do Usuário */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Dados do Administrador</h3>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Nome completo"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    className={errors.userName ? 'border-red-500' : ''}
                  />
                  {errors.userName && (
                    <p className="text-sm text-red-500 mt-1">{errors.userName}</p>
                  )}
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email do usuário"
                    value={formData.userEmail}
                    onChange={(e) => handleInputChange('userEmail', e.target.value)}
                    className={errors.userEmail ? 'border-red-500' : ''}
                  />
                  {errors.userEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.userEmail}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmar senha"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Termos de Uso */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                    Eu aceito os{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-500">{errors.acceptTerms}</p>
                )}
              </div>

              {/* Botões */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>

                <div className="flex items-center justify-between">
                  <Link
                    href="/login"
                    className="flex items-center text-sm text-blue-600 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar ao Login
                  </Link>

                  <div className="text-sm text-gray-600">
                    Já tem uma conta?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">
                      Entrar
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações do Trial */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            🎉 <strong>Trial gratuito de 7 dias</strong> - Sem compromisso, cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  )
}