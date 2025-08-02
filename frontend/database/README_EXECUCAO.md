# Guia de Execução - CotAi Edge Database

## 📋 **Visão Geral**

Este guia contém as instruções completas para configurar o banco de dados PostgreSQL do **CotAi Edge** no Supabase, um sistema B2B de gestão inteligente de cotações para **empresas** com integração ao PNCP.

## 🎯 **Arquitetura do Sistema**

- **Público-alvo**: Empresas (B2B)
- **Banco**: Supabase PostgreSQL
- **Realtime**: Habilitado para atualizações em tempo real
- **Segurança**: Row Level Security (RLS) ativo
- **Auditoria**: Sistema completo de logs

## 📁 **Arquivos do Projeto**

```
database/
├── supabase_schema.sql       # Schema principal completo
├── supabase_realtime.sql     # Configuração Realtime
├── sample_data.sql           # Dados de exemplo
└── README_EXECUCAO.md        # Este guia
```

## 🚀 **Passo a Passo de Execução**

### **1. Preparação do Ambiente Supabase**

1. **Acesse seu projeto Supabase**:
   - Vá para [https://supabase.com](https://supabase.com)
   - Entre no projeto `api.neuro-ia.es`

2. **Abra o SQL Editor**:
   - Menu: `SQL Editor`
   - Clique em `New query`

### **2. Execução do Schema Principal**

1. **Execute o schema principal**:
   ```sql
   -- Copie e cole o conteúdo completo de: supabase_schema.sql
   ```

2. **Verificar se executou com sucesso**:
   ```sql
   -- Verificar tabelas criadas
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Deve retornar 12 tabelas principais
   ```

### **3. Configuração do Realtime**

1. **Execute a configuração Realtime**:
   ```sql
   -- Copie e cole o conteúdo completo de: supabase_realtime.sql
   ```

2. **Verificar Realtime ativo**:
   ```sql
   -- Verificar publicação realtime
   SELECT tablename FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime';
   ```

### **4. Inserção de Dados de Exemplo**

1. **Execute os dados de amostra**:
   ```sql
   -- Copie e cole o conteúdo completo de: sample_data.sql
   ```

### **5. Configuração de Autenticação**

1. **No Supabase Dashboard**:
   - Vá para `Authentication` → `Settings`
   - Configure:
     - `Enable email confirmations`: **Desabilitado** (para desenvolvimento)
     - `Enable phone confirmations`: **Desabilitado**

2. **Criar usuário de teste**:
   - Vá para `Authentication` → `Users`
   - Clique `Add user`
   - Email: `admin@teste.com`
   - Password: `123456789`
   - `Email confirmed`: ✅ **Marcado**

### **6. Configuração de Variáveis de Ambiente**

Atualize o arquivo `.env.local` do frontend:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://api.neuro-ia.es
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui

# App Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_PNCP_API_URL=https://pncp.gov.br/api/pncp/v1
```

## 🔧 **Configurações Avançadas**

### **Row Level Security (RLS)**

O sistema implementa segurança por linha baseada em organização:

```sql
-- Exemplo: Usuários só veem dados da própria empresa
CREATE POLICY "Users can view their own organization data" ON quotations
FOR SELECT USING (
    organization_id = (
        SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
    )
);
```

### **Sistema de Auditoria**

Todas as operações são auditadas automaticamente:

```sql
-- Consultar logs de auditoria
SELECT * FROM audit_logs 
WHERE entity_type = 'quotations' 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Realtime Subscriptions**

O frontend pode se inscrever em mudanças em tempo real:

```typescript
// Exemplo de subscription
const subscription = supabase
  .channel('quotations_channel')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'quotations'
  }, (payload) => {
    console.log('Cotação atualizada:', payload)
  })
  .subscribe()
```

## 📊 **Estrutura das Principais Entidades**

### **1. Organizations (Empresas)**
- Sistema B2B focado em empresas
- Planos de assinatura (trial, premium)
- Limites por plano configuráveis

### **2. Users (Usuários)**
- Integração com Supabase Auth
- Sistema RBAC (admin, user, viewer)
- Permissões customizáveis por usuário

### **3. Quotations (Cotações)**
- Status Kanban: abertas → em_andamento → respondidas → finalizadas
- Integração com PNCP
- Numeração automática (COT-2025-001)

### **4. Suppliers (Fornecedores)**
- Métricas de performance automáticas
- Score baseado em histórico
- Categorização por tipo de produto/serviço

## 🔍 **Verificações de Funcionamento**

### **1. Testar Conexão Frontend**

```sql
-- Query de teste para o frontend
SELECT 
    o.name as organization_name,
    u.name as user_name,
    u.email,
    u.role
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.supabase_uid = 'seu_uuid_do_supabase_auth';
```

### **2. Testar Realtime**

```sql
-- Atualizar uma cotação para testar realtime
UPDATE quotations 
SET status = 'em_andamento' 
WHERE number = 'COT-2025-001';
```

### **3. Verificar Métricas**

```sql
-- Dashboard metrics em tempo real
SELECT * FROM realtime_dashboard_metrics;
```

## 🚨 **Solução de Problemas**

### **Erro: "relation does not exist"**
- ✅ Verificar se o schema foi executado completamente
- ✅ Verificar se há erros na criação das tabelas

### **Erro: RLS Policy**
- ✅ Verificar se o usuário foi criado no Supabase Auth
- ✅ Verificar se existe registro na tabela `users`

### **Realtime não funciona**
- ✅ Verificar se as tabelas foram adicionadas à publicação
- ✅ Verificar políticas RLS para realtime

### **Frontend não conecta**
- ✅ Verificar variáveis de ambiente
- ✅ Verificar se anon_key está correto
- ✅ Verificar se RLS permite acesso

## 📈 **Monitoramento e Manutenção**

### **Verificação de Saúde**
```sql
-- Executar verificação de saúde do sistema
SELECT * FROM system_health_check();
```

### **Limpeza Automática**
```sql
-- Limpeza manual de logs antigos (+ de 6 meses)
SELECT cleanup_old_audit_logs();
```

### **Monitoramento de Performance**
```sql
-- Top consultas mais demoradas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 🎯 **Próximos Passos**

1. ✅ **Executar schema principal**
2. ✅ **Configurar Realtime**
3. ✅ **Inserir dados de exemplo**
4. ✅ **Testar login no frontend**
5. ✅ **Verificar Kanban funcionando**
6. ✅ **Testar notificações em tempo real**

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs do Supabase**: Dashboard → Logs
2. **Verificar console do navegador**: F12 → Console
3. **Verificar políticas RLS**: SQL Editor → `SELECT * FROM pg_policies;`

---

**🎉 Parabéns!** Após seguir este guia, seu sistema CotAi Edge estará funcionando completamente!