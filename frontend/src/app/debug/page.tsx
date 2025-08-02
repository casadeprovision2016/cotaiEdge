'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { debugSupabaseConfig, testSupabaseConnection } from '@/lib/debug'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function DebugPage() {
  const [testResults, setTestResults] = useState<Array<{test: string, status: string, details: unknown, timestamp: string}>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    debugSupabaseConfig()
    testConnection()
  }, [])

  const testConnection = async () => {
    const result = await testSupabaseConnection()
    addTestResult('Connection Test', result ? 'Success' : 'Failed', result)
  }

  const addTestResult = (test: string, status: string, details: unknown) => {
    setTestResults(prev => [...prev, { test, status, details, timestamp: new Date().toISOString() }])
  }

  const testAuth = async () => {
    setLoading(true)
    try {
      // Test with fake credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'wrongpassword'
      })

      addTestResult('Auth Test (Wrong Password)', error ? 'Expected Error' : 'Unexpected Success', {
        error: error?.message,
        data: data?.user ? 'User returned' : 'No user'
      })
    } catch (error) {
      addTestResult('Auth Test (Exception)', 'Error', error)
    }
    setLoading(false)
  }

  const testTables = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      addTestResult('Users Table Test', error ? 'Error' : 'Success', {
        error: error?.message,
        hasData: !!data?.length
      })
    } catch (error) {
      addTestResult('Users Table Test (Exception)', 'Error', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔧 Debug Console - CotAi Edge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Environment Variables:</h3>
                <div className="bg-gray-100 p-4 rounded text-sm font-mono">
                  <div>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
                  <div>ANON_KEY Length: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length} chars</div>
                  <div>ANON_KEY Prefix: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button onClick={testAuth} loading={loading}>
                  Test Auth (Wrong Password)
                </Button>
                <Button onClick={testTables} loading={loading}>
                  Test Users Table
                </Button>
                <Button onClick={testConnection} loading={loading}>
                  Test Connection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{result.test}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      result.status === 'Success' ? 'bg-green-100 text-green-800' :
                      result.status === 'Expected Error' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Time: {new Date(result.timestamp).toLocaleTimeString()}</div>
                    <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
              
              {testResults.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  No test results yet. Click the buttons above to run tests.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}