import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types based on database/init.sql structure
export interface User {
  id: string
  organization_id?: string
  supabase_uid: string
  email: string
  name?: string
  role: string
  permissions: Record<string, unknown>
  preferences: Record<string, unknown>
  last_login?: string
  trial_start?: string
  status: 'active' | 'suspended' | 'cancelled' | 'trial_expired'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiClient {
  id: string
  name: string
  api_key: string
  status: 'active' | 'suspended' | 'cancelled'
  created_at: string
  organization_id: string
}

export interface Organization {
  id: string
  name: string
  cnpj: string
  email: string
  phone?: string
  address?: Record<string, unknown>
  subscription_plan: string
  plan_limits: Record<string, unknown>
  status: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Supplier {
  id: string
  organization_id: string
  name: string
  cnpj?: string
  cpf?: string
  type: 'pj' | 'pf' | 'mei'
  email?: string
  phone?: string
  whatsapp?: string
  address?: Record<string, unknown>
  performance_score: number
  total_quotations: number
  response_rate: number
  avg_response_time_hours: number
  last_interaction?: string
  categories: string[]
  status: 'active' | 'inactive' | 'blocked'
  documents: Record<string, unknown>
  certifications: string[]
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Quotation {
  id: string
  organization_id: string
  number: string
  title: string
  description?: string
  pncp_id?: string
  pncp_data?: Record<string, unknown>
  orgao?: string
  modalidade?: string
  local?: string
  opening_date?: string
  closing_date?: string
  response_deadline?: string
  estimated_value?: number
  max_value?: number
  status: 'abertas' | 'em_andamento' | 'respondidas' | 'finalizadas' | 'canceladas'
  priority: 'alta' | 'media' | 'baixa'
  responsible_user_id?: string
  auto_invite: boolean
  require_documents: boolean
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface QuotationItem {
  id: string
  quotation_id: string
  product_id?: string
  item_number: number
  description: string
  quantity: number
  unit: string
  specifications?: string
  brand_required: boolean
  technical_requirements: Record<string, unknown>
  reference_price?: number
  max_price?: number
  created_at: string
  updated_at: string
}

export interface SupplierProposal {
  id: string
  quotation_id: string
  quotation_invitation_id?: string
  supplier_id: string
  proposal_number?: string
  total_value: number
  delivery_time_days?: number
  payment_terms?: string
  validity_days: number
  observations?: string
  technical_compliance: Record<string, unknown>
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  organization_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  related_entity_type?: string
  related_entity_id?: string
  read_at?: string
  is_read: boolean
  channels: string[]
  sent_email: boolean
  sent_whatsapp: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}