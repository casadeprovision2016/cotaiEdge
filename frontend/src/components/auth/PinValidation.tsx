'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useRBAC } from '@/hooks/useRBAC'
import { useToast } from '@/hooks/use-toast'

interface PinValidationProps {
  onValidated: () => void
  onCancel: () => void
  title?: string
  description?: string
}

export function PinValidation({ 
  onValidated, 
  onCancel, 
  title = 'Validação de Segurança',
  description = 'Digite seu PIN de 4 dígitos para continuar'
}: PinValidationProps) {
  const { validatePin } = useRBAC()
  const { toast } = useToast()
  
  const [pin, setPin] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length !== 4) {
      toast({
        title: 'PIN Inválido',
        description: 'O PIN deve ter exatamente 4 dígitos',
        variant: 'destructive'
      })
      return
    }

    setIsValidating(true)
    
    try {
      const isValid = await validatePin(pin)
      
      if (isValid) {
        toast({
          title: 'PIN Validado',
          description: 'Acesso autorizado',
          variant: 'default'
        })
        onValidated()
      } else {
        setAttempts(prev => prev + 1)
        setPin('')
        
        toast({
          title: 'PIN Incorreto',
          description: `Tentativa ${attempts + 1}/3. Verifique seu PIN.`,
          variant: 'destructive'
        })
        
        // Bloquear após 3 tentativas
        if (attempts >= 2) {
          toast({
            title: 'Acesso Bloqueado',
            description: 'Muitas tentativas inválidas. Tente novamente mais tarde.',
            variant: 'destructive'
          })
          onCancel()
        }
      }
    } catch (error) {
      toast({
        title: 'Erro de Validação',
        description: 'Ocorreu um erro ao validar o PIN',
        variant: 'destructive'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handlePinChange = (value: string) => {
    // Apenas números
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    setPin(numericValue)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🔐</span>
            <span>{title}</span>
          </CardTitle>
          <p className="text-center text-gray-600 text-sm">
            {description}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={4}
                autoFocus
                disabled={isValidating}
              />
              
              <div className="flex justify-center space-x-1 mt-2">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 ${
                      pin.length >= i 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {attempts > 0 && (
              <div className="text-center">
                <p className="text-red-600 text-sm">
                  Tentativas restantes: {3 - attempts}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="flex-1"
                disabled={isValidating}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                className="flex-1"
                disabled={pin.length !== 4 || isValidating}
              >
                {isValidating ? 'Validando...' : 'Confirmar'}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Esqueceu seu PIN? Entre em contato com o administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}