# Arquitetura de Segurança - Frontend

## Princípios de Segurança Implementados

### 1. **Apenas Anon Key no Frontend**
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Segura para exposição pública
- ❌ `SUPABASE_SERVICE_ROLE_KEY`: NUNCA no frontend (apenas backend/server)

### 2. **Row Level Security (RLS)**
A segurança é garantida no nível do banco de dados através de políticas RLS:

```sql
-- Exemplo de política RLS para tabela users
CREATE POLICY "users_select_own" ON users
FOR SELECT USING (auth.uid() = supabase_uid);

CREATE POLICY "users_update_own" ON users
FOR UPDATE USING (auth.uid() = supabase_uid);

CREATE POLICY "audit_logs_insert_own" ON audit_logs
FOR INSERT WITH CHECK (auth.uid() = (
  SELECT supabase_uid FROM users WHERE id = user_id
));
```

### 3. **Validação de Status no Frontend**
O frontend valida status do usuário mas a autorização final é no backend:
- `trial_expired`: Bloqueio visual + redirecionamento
- `suspended`: Bloqueio total
- `cancelled`: Redirecionamento para reativação

### 4. **Rate Limiting**
Implementado através de logs de auditoria:
- Máximo 5 tentativas por IP/email por hora
- Logs automáticos de tentativas falhadas
- Bloqueio temporário baseado em timestamps

### 5. **Audit Trail**
Todos os logs são protegidos por RLS:
- Usuários só veem seus próprios logs
- Logs de sistema ficam invisíveis para usuários finais
- Integridade mantida no nível do banco

## Fluxo de Autenticação Segura

1. **Login**: Supabase GoTrue com anon key
2. **JWT**: Token seguro fornecido automaticamente
3. **RLS**: Políticas filtram dados automaticamente
4. **Status Check**: Validação de trial/suspension
5. **Audit**: Log de todas as ações importantes

## Responsabilidades por Camada

### Frontend (Anon Key)
- Autenticação básica
- Validação de formulários
- UX de status de usuário
- Logs de auditoria pessoais

### Backend (Service Role Key)
- Operações administrativas
- Processamento de pagamentos
- Integrações externas (PNCP)
- Logs de sistema

### Banco (RLS)
- Autorização final
- Isolamento de dados
- Integridade referencial
- Audit trail imutável

Esta arquitetura garante que mesmo com anon key exposta, a segurança é mantida através das políticas RLS no banco de dados.