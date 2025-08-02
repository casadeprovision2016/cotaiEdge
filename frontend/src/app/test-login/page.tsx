'use client'

import React from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function TestLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Teste de Login</h1>
        <LoginForm />
      </div>
    </div>
  )
}