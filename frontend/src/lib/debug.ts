// Script de diagnóstico para debug das credenciais Supabase

export function debugSupabaseConfig() {
  console.log('🔍 Diagnóstico Supabase:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyIsPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_anon_key_here',
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
  })
}

export async function testSupabaseConnection() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
    
    console.log('✅ Teste de conexão Supabase:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro de conexão:', errorText)
    }
    
    return response.ok
  } catch (error) {
    console.error('❌ Erro de rede:', error)
    return false
  }
}