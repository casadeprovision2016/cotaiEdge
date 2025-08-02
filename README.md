# Documento Final - Sistema de Cotações Inteligentes
## Visão Consolidada: Arquitetura, Banco de Dados, Fornecedores e Frontend

---

## 1. Visão Geral e Objetivo

Sistema integrado de gestão de cotações com inteligência artificial, automatizando e otimizando todo o ciclo de compras empresariais, com integração ao PNCP (Portal Nacional de Contratações Públicas).

**Público-alvo:**
- **Primário:** Departamentos de compras de médias e grandes empresas
- **Secundário:** Pequenas empresas com alto volume de cotações
- **Terciário:** Profissionais autônomos de procurement e consultores

---

## 2. Funcionalidades e Fluxos Principais

### Funcionalidades-Chave
- Extração automática de documentos (OCR/IA)
- Criação de cotações com IA (produtos similares, recomendação de fornecedores)
- Integração e monitoramento de oportunidades PNCP
- Gestão de cadastros (usuários, fornecedores, produtos)
- Kanban dinâmico de cotações
- Assinatura digital, compliance LGPD
- Notificações multicanal (e-mail, WhatsApp)
- Relatórios, exportação, dashboard analítico

### Fluxos do Frontend
- Login/autenticação (Firebase Auth, API Key)
- Cadastro de usuários (trial de 7 dias, upgrade de plano)
- Recuperação de senha
- Dashboard principal (KPIs, notificações)
- Pesquisa e visualização de cotações (PNCP, internas)
- Kanban de cotações (abertas, canceladas, etc.)
- Gestão de fornecedores (CRUD, performance, histórico)
- Notificações, relatórios, exportação
- Configurações, permissões e preferências de usuário

---

## 3. Arquitetura Híbrida e Banco de Dados

### Estratégia Híbrida com Supabase Self-Hosted (api.neuro-ia.es)
- **Supabase PostgreSQL:** Banco principal (cotações, fornecedores, usuários, configs)
- **Supabase Realtime:** Real-time/Kanban, notificações instantâneas  
- **Supabase GoTrue:** Autenticação e gestão de usuários
- **Supabase Storage:** Arquivos, documentos, anexos
- **Supabase Logflare:** Logs/eventos, dados semi-estruturados
- **Kong Gateway:** API Gateway e proxy (integrado ao Supabase)
- **Redis Cloud (Upstash):** Cache de queries, sessões
- **Cloudflare Workers + KV:** Cache de borda, proxy de APIs
- **Google BigQuery:** Analytics/BI

### Estrutura de Entidades (resumo)
- organizations, users, suppliers, carriers, products, quotations, quotation_items, quotation_invitations, supplier_proposals, proposal_items, attachments, audit_logs, comments, notifications, pncp_opportunities

### Exemplo de SQL (Supabase PostgreSQL)
```sql
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Integração PNCP
- APIs RESTful, padrão JSON, controle de acesso por número de controle (CNPJ, sequencial, ano)
- Exemplo de endpoint: https://pncp.gov.br/api/consulta
- Dados de retorno padronizados: vetor de dados, total de registros, total de páginas, página atual, páginas restantes, empty

---

## 4. Requisitos Funcionais e Não-Funcionais

**Funcionais:**
- Extração de dados com 95% de precisão
- Processamento de cotações < 3s
- Suporte a múltiplas moedas/unidades
- API RESTful para ERPs
- Dashboard analítico em tempo real
- Notificações multicanal
- Backup automático
- Exportação de relatórios

**Não-Funcionais:**
- SLA 99.9%
- Resposta < 200ms
- 10.000 usuários simultâneos
- Criptografia AES-256
- Interface responsiva
- ISO 27001, LGPD
- Logs imutáveis
- Escalabilidade horizontal

---

## 5. Fornecedores e Justificativa por Camada

| Camada/Função           | Fornecedor/Produto           | Uso no Projeto                                      |
|-------------------------|------------------------------|-----------------------------------------------------|
| **Banco Principal**     | Supabase PostgreSQL (api.neuro-ia.es)| Dados estruturados: cotações, fornecedores, usuários|
| **Logs/Eventos**        | Supabase Logflare (api.neuro-ia.es)  | Logs, integrações PNCP, dados semi-estruturados     |
| **Real-time/Kanban**    | Supabase Realtime (api.neuro-ia.es)  | Status dinâmico, notificações, Kanban               |
| **Cache**               | Redis Cloud (Upstash)        | Sessões, cache de queries                           |
| **Autenticação**        | Supabase GoTrue (api.neuro-ia.es)     | Login, permissões, MFA                              |
| **Analytics/BI**        | Google BigQuery              | Relatórios, dashboards, insights de IA              |
| **API Gateway**         | Kong Gateway (api.neuro-ia.es)        | Proxy, rate limiting, autenticação                  |
| **Storage/Arquivos**    | Supabase Storage (api.neuro-ia.es)    | Documentos, anexos, imagens                        |
| **Edge/Proxy**          | Cloudflare Workers + KV      | Proxy, cache na borda, aceleração frontend          |
| **Funções Serverless**  | Supabase Edge Runtime (api.neuro-ia.es)| Processamento, validações, integrações           |

---

## 6. Clean Architecture e Estrutura de Pastas (Frontend/Backend)

```text
src/
├── domain/
│   ├── entities/
│   ├── use-cases/
│   └── repositories/
├── application/
│   ├── services/
│   └── dto/
├── infrastructure/
│   ├── database/
│   ├── external/
│   └── ai/
├── presentation/
│   ├── controllers/
│   ├── middleware/
│   └── validators/
└── shared/
    ├── utils/
    └── types/
```

---

## 7. Design System e Usabilidade

**Paleta de Cores:**
```css
:root {
  --gray-900: #0f172a;
}
```

**Componentes Base:**
- Botões (primary, secondary, ghost, danger)
- Inputs com validação em tempo real
- Selects com busca
- Tabelas com ordenação/filtros
- Cards responsivos

---

## 8. Setup do Ambiente e Ferramentas

```bash
# Instalação global de ferramentas CLI
npm install -g @nestjs/cli @supabase/cli vercel

# Criação dos projetos
npx create-next-app@latest frontend --typescript
nest new backend
python -m venv ai-service-env

# Configuração do Supabase remoto (api.neuro-ia.es)
export SUPABASE_URL="https://api.neuro-ia.es"
export SUPABASE_ANON_KEY="seu_anon_key_aqui"
export SUPABASE_SERVICE_ROLE_KEY="seu_service_role_key_aqui"

# Inicialização dos serviços cloud
vercel init

# --- Docker para Desenvolvimento Local ---
# Build e execução dos serviços locais (frontend, backend, ai-service)
docker compose build
docker compose up

# Parar todos os serviços
docker compose down
```

### Docker para Desenvolvimento

- O **Supabase self-hosted roda remotamente** em `api.neuro-ia.es`
- **Docker local** apenas para: frontend, backend, ai-service
- **Conexão remota** com Supabase via variáveis de ambiente
- Exemplos:
  - `docker compose build` — constrói imagens locais
  - `docker compose up` — inicia containers locais + conexão remota Supabase
  - `docker compose down` — encerra containers locais

## Integração com Supabase Self-Hosted (api.neuro-ia.es)

### Arquitetura de APIs Disponíveis

| Serviço | Endpoint | Porta | Função |
|---------|----------|-------|--------|
| **Kong Gateway** | `https://api.neuro-ia.es` | 443/8000 | Proxy, autenticação, rate limiting |
| **PostgREST** | `https://api.neuro-ia.es/rest/v1/` | 3000 | API REST automática do PostgreSQL |
| **GoTrue** | `https://api.neuro-ia.es/auth/v1/` | 9999 | Autenticação e gestão de usuários |
| **Realtime** | `https://api.neuro-ia.es/realtime/v1/` | 4000 | WebSockets, subscriptions |
| **Storage** | `https://api.neuro-ia.es/storage/v1/` | 5000 | Upload/download de arquivos |
| **Edge Functions** | `https://api.neuro-ia.es/functions/v1/` | 9000 | Funções serverless |
| **Supabase Studio** | `https://api.neuro-ia.es/studio` | 3001 | Interface administrativa |

### Exemplo de Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml - Conectando ao Supabase remoto
version: '3.8'

services:
  # Frontend Next.js
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=https://api.neuro-ia.es
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  # Backend NestJS  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@api.neuro-ia.es:5432/postgres
      - SUPABASE_URL=https://api.neuro-ia.es
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - ai-service

  # Serviço de IA Python
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=https://api.neuro-ia.es
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./ai-service:/app
```

### Configuração de Ambiente (.env)

```bash
# .env - Variáveis para conexão com api.neuro-ia.es

# Supabase Configuration
SUPABASE_URL=https://api.neuro-ia.es
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-jwt-secret-here

# Database Direct Connection (se necessário)
DB_PASSWORD=your-postgres-password
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@api.neuro-ia.es:5432/postgres

# External Services
OPENAI_API_KEY=sk-...
REDIS_URL=redis://your-redis-instance

# Application Settings
NODE_ENV=development
PORT=3001
```

### Modelos de API e Integração

#### 1. **REST API (PostgREST)**
```typescript
// Exemplo de client TypeScript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://api.neuro-ia.es',
  'your-anon-key'
)

// CRUD Operations
const { data: quotations } = await supabase
  .from('quotations')
  .select('*')
  .eq('status', 'active')

const { data: newQuotation } = await supabase
  .from('quotations')
  .insert({ title: 'Nova Cotação', status: 'open' })
```

#### 2. **Autenticação (GoTrue)**
```typescript
// Login/Registro
const { data: user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Login
const { data: session } = await supabase.auth.signInWithPassword({
  email: 'user@example.com', 
  password: 'password123'
})
```

#### 3. **Real-time (Subscriptions)**
```typescript
// Escutar mudanças em tempo real
const subscription = supabase
  .channel('quotations')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'quotations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

#### 4. **Storage API**
```typescript
// Upload de arquivos
const { data, error } = await supabase.storage
  .from('documents')
  .upload('quotation-123/edital.pdf', file)

// Download
const { data: url } = supabase.storage
  .from('documents')
  .getPublicUrl('quotation-123/edital.pdf')
```

#### 5. **Edge Functions**
```typescript
// Chamar função serverless
const { data, error } = await supabase.functions
  .invoke('process-quotation', {
    body: { quotationId: 123, action: 'extract-data' }
  })
```

### Comandos Docker para Desenvolvimento

```bash
# Build e start todos os serviços
docker compose up --build -d

# Logs de um serviço específico
docker compose logs -f backend

# Restart de um serviço
docker compose restart frontend

# Stop todos os serviços
docker compose down

# Rebuild específico
docker compose build backend --no-cache
```

### Healthchecks e Monitoramento

```yaml
# Adicionar ao docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "https://api.neuro-ia.es/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Componentes Supabase Self-Hosted (Rodando em api.neuro-ia.es):
```yaml
# Referência dos componentes remotos
services:
  supabase-studio: supabase/studio:2025.06.30-sha-6f5982d
  kong: kong:2.8.1  
  gotrue: supabase/gotrue:v2.177.0
  postgrest: postgrest/postgrest:v12.2.12
  realtime: supabase/realtime:v2.34.47
  storage: supabase/storage-api:v1.25.7
  imgproxy: darthsim/imgproxy:v3.8.0
  postgres-meta: supabase/postgres-meta:v0.91.0
  edge-runtime: supabase/edge-runtime:v1.67.4
  logflare: supabase/logflare:1.14.2
  postgres: supabase/postgres:15.8.1.060
  vector: timberio/vector:0.28.1-alpine
  supavisor: supabase/supavisor:2.5.7
  cloudflared: cloudflare/cloudflared:latest
```

---

## 9. Referências e Documentação PNCP

- Manual das APIs PNCP: estrutura dos endpoints, composição dos números de controle, exemplos de requisição e retorno, tabelas de domínio, sumário dos serviços disponíveis.
- Recomenda-se seguir o padrão de integração e nomenclatura do PNCP para máxima compatibilidade.

---

# Documento Final - Sistema de Cotações Inteligentes
## Plano Completo, Implementação AWS e Análise Estratégica

---

# 1. PLANO DE DESENVOLVIMENTO

## 1.1 Definição e Planejamento

### Definição do Produto
**Propósito:** Sistema integrado de gestão de cotações com inteligência artificial, automatizando e otimizando todo o ciclo de compras empresariais.

**Público-alvo:**
- **Primário:** Departamentos de compras de médias e grandes empresas
- **Secundário:** Pequenas empresas com alto volume de cotações
- **Terciário:** Profissionais autônomos de procurement e consultores

### Funcionalidades Principais Detalhadas

- **Página de Login/Autenticação e Fluxos de Upgrade**
  - Integração com Supabase GoTrue (api.neuro-ia.es) para autenticação de usuários internos (`users`) e API Key para clientes externos (`api_clients`).
  - Cadastro de novo usuário: registro em `users` com campos como `email`, `created_at`, `trial_start`, `status`='active', `role`, etc.
  - Lógica de teste gratuito: acesso liberado por 7 dias após `trial_start`. Após esse prazo, status muda para `trial_expired` e acesso é bloqueado, redirecionando para página de planos.
  - Fluxo de upgrade de plano: redirecionamento automático ao expirar o trial, escolha de plano, pagamento online (Stripe/Mercado Pago), liberação automática após confirmação, feedback visual, recibo por e-mail e atualização de status em tempo real.
  - Downgrade/cancelamento de plano com automação de status e notificações específicas.
  - Validação do status do usuário/cliente (`active`, `suspended`, `cancelled`, `trial_expired`) e redirecionamento/mensagens apropriadas.
  - Detecção automática do tipo de usuário (interno, externo/API, admin) e redirecionamento para dashboard/área adequada.
  - Proteção contra brute-force e rate limit nas tentativas de login.
  - Logging de autenticações e tentativas em `audit_logs`.

- **Página de Cadastro de Novos Usuários**
  - Integração com Firebase Auth, registro em `users`, início do trial de 7 dias.
  - Validação de e-mail único e senha forte.
  - Feedback visual, confirmação de e-mail (opcional), logging de cadastro.

- **Página de Recuperação de Senha**
  - Integração com Supabase GoTrue (api.neuro-ia.es) para envio de e-mail de recuperação.
  - Validação de e-mail cadastrado, feedback visual, logging de tentativas.

- **Dashboard Principal, Relatórios e KPIs**
  - Visão geral de cotações, status, KPIs e notificações.
  - Cards, gráficos, timeline de atividades.
  - Relatórios práticos (status, performance, uso de APIs, faturamento, engajamento), exportação PDF/Excel.
  - KPIs: tempo médio de resposta, conversão de trial, engajamento, SLA, performance de fornecedores, uso por plano.
  - Alertas automáticos para eventos críticos, notificações multicanal.

- **Pesquisa Cotação - nLic**
  - Barra de busca e filtros, tabela/lista de editais, paginação.

- **Resultado Cotação - nLic**
  - Card de resultado detalhado, botões "+ Incluir" e "Ver" (link para PNCP).

- **Gestão de Cotações - CotAi**
  - Kanban dinâmico com colunas: Abertas, Em andamento, Respondidos, Finalizadas, Canceladas.
    - **Em andamento**: inclui extração/análise inteligente de editais (suporte a múltiplos formatos, extração automática, análise semântica, matching automático com fornecedores, validação de campos, logs detalhados), validação e assinatura eletrônica (integração com ICP-Brasil/DocuSign, logs/evidências), envio de cotações (multicanal, status de envio, histórico, reenvio manual), funcionalidades adicionais (status em tempo real, download de documentos, relatórios de performance).
  - Cartões exibem dados principais, formulário detalhado dividido em seções (dados gerais, prazos, participantes, valores, histórico/anexos, observações, itens/produtos).
  - Ações rápidas: editar, visualizar, exportar, excluir, adicionar comentário, visualizar log.
  - Arrastar e soltar cartões, filtros avançados, busca, seleção múltipla para ações em lote.

- **Gestão de Fornecedores**
  - CRUD completo, dashboard de performance, histórico de interações, comentários, KPIs.

- **Wireframes, Prototipagem e Usabilidade**
  - Wireframes/protótipos das telas principais, testes de usabilidade, métricas de UX, acessibilidade (WCAG), navegação clara, componentes acessíveis/documentados.

- **Notificações e Comunicação**
  - Central de notificações (`notifications`), templates de e-mail, integração WhatsApp.

- **Permissões, Segurança e Internacionalização**
  - Gestão de permissões/roles (RBAC), MFA, versionamento/migração de dados, i18n, relatórios, exportação.

- **Configurações e Usuários**
  - CRUD de usuários internos, associação à organização, integração com Firebase Auth, ativação/desativação, histórico de login, reset de senha, auditoria, permissões flexíveis (JSONB), preferências individuais (tema, idioma, notificações), telas de administração, edição de permissões, logs.

- **Monitoramento de Uso**
  - Dashboard de uso dos recursos, agregação de dados de uso (PostgreSQL, Edge Functions, Supabase, etc.).

- **Outros Pontos**
  - Navegação clara, componentes reutilizáveis, suporte offline (PWA), foco em experiência do usuário, acessibilidade e performance.

### Análise de Requisitos Detalhada

**Requisitos Funcionais:**
- Extração de dados de documentos com 95% de precisão
- Processamento de cotações em menos de 3 segundos
- Suporte a múltiplas moedas e unidades de medida
- API RESTful para integração com ERPs
- Dashboard analítico em tempo real
- Sistema de notificações multicanal
- Backup automático e recuperação de dados
- Exportação de relatórios em múltiplos formatos

**Requisitos Não-Funcionais:**
- RNF001: Disponibilidade de 99.9% (SLA)
- RNF002: Tempo de resposta < 200ms para consultas
- RNF003: Suporte a 10.000 usuários simultâneos
- RNF004: Criptografia AES-256 para dados sensíveis
- RNF005: Interface responsiva para todos os dispositivos
- RNF006: Conformidade com ISO 27001
- RNF007: Logs de auditoria imutáveis
- RNF008: Escalabilidade horizontal automática

## 1.2 Escolha da Tecnologia

### Recomendações de Linguagens para Arquitetura Híbrida

- **Frontend (Web/PWA):**
  - **Linguagem:** TypeScript
  - **Framework:** Next.js
  - **Justificativa:** TypeScript oferece tipagem estática e melhor manutenção; Next.js permite SSR, PWA e integração fácil com APIs

- **Edge/Proxy/API Gateway:**
  - **Linguagem:** JavaScript (ES2022+) ou TypeScript
  - **Justificativa:** Workers exigem JavaScript/TypeScript para scripts leves e rápidos na borda

- **Backend Principal (APIs e Lógica de Negócio):**
  - **Linguagem:** TypeScript
  - **Framework:** NestJS
  - **Justificativa:** Garante modularidade, escalabilidade e integração nativa com AWS Lambda

- **Funções Serverless (AWS Lambda):**
  - **Linguagem:** TypeScript (preferencial) ou Python (para tarefas específicas de IA)
  - **Justificativa:** TypeScript para integração direta com o backend; Python para rotinas de IA

- **Banco de Dados Principal:**
  - **Serviço:** Supabase PostgreSQL (api.neuro-ia.es)
  - **Justificativa:** PostgreSQL completo com todas as funcionalidades SQL, RLS, funções e triggers

- **Cache e Real-time:**
  - **Serviço:** Redis (cache externo) + Supabase Realtime (api.neuro-ia.es)
  - **Justificativa:** Redis para cache de sessões; Supabase Realtime para dados em tempo real

- **IA e Machine Learning:**
  - **Linguagem:** Python
  - **Justificativa:** Python é padrão para IA, com ampla biblioteca e integração fácil via REST

- **Automação de Documentos e OCR:**
  - **Linguagem:** Python
  - **Frameworks:** Tesseract OCR, OpenCV, PyPDF2

- **Infraestrutura como Código:**
  - **Terraform (HCL)** para AWS e recursos cloud
  - **YAML** para Kubernetes, GitHub Actions e pipelines

- **Testes Automatizados:**
  - **Frontend:** TypeScript/Jest/Testing Library/Cypress
  - **Backend:** TypeScript/Jest/Supertest
  - **IA:** Python/pytest

---

# 2. IMPLEMENTAÇÃO AWS E ARQUITETURA HÍBRIDA

## 2.1 Análise Estratégica para Implementação com Planos Gratuitos

### Contexto e Justificativa

A implementação de um sistema capaz de gerenciar 5000 cotações utilizando exclusivamente planos gratuitos de serviços em nuvem requer uma abordagem estratégica que maximize os recursos disponíveis enquanto mitiga as limitações inerentes a cada provedor. Após análise detalhada dos principais provedores, identificamos que nenhuma plataforma única oferece todos os recursos necessários de forma gratuita e sustentável a longo prazo.

### Por que Firebase como Base Principal?

O Firebase emerge como a plataforma central mais adequada para nossa solução devido a:

1. **Longevidade Garantida**: O plano Spark é projetado para ser "gratuito para sempre" dentro de seus limites
2. **Cobertura Completa**: Oferece banco de dados, hospedagem, computação serverless e autenticação em um único ecossistema
3. **Generosidade de Hospedagem**: 10 GB de armazenamento + 10 GB/mês de transferência superam muitos concorrentes
4. **Flexibilidade de Dados**: Escolha entre Firestore e Realtime Database conforme necessidade
5. **Autenticação Robusta**: 10.000 autenticações gratuitas/mês atendem confortavelmente 5000 cotações

**Limitação Principal**: Restrição de rede nas Cloud Functions (apenas serviços Google no plano gratuito)

## 2.2 Arquitetura Híbrida Otimizada

### Visão Geral da Solução

```
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE APRESENTAÇÃO                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Cloudflare Pages)                                │
│  - Next.js PWA                                              │
│  - Service Workers para cache offline                       │
│  - CDN global com largura de banda "ilimitada"              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    CAMADA DE BORDA                          │
├─────────────────────────────────────────────────────────────┤
│  Edge Computing (Cloudflare Workers)                        │
│  - Proxy inteligente de API                                 │
│  - Cache com Workers KV                                     │
│  - Validação e transformação de dados                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  CAMADA DE APLICAÇÃO                        │
├─────────────────────────────────────────────────────────────┤
│  Backend Principal (AWS Lambda)                             │
│  - APIs RESTful com NestJS                                  │
│  - Lógica de negócios                                       │
│  - 1M requisições/mês gratuitas                             │
├─────────────────────────────────────────────────────────────┤
│  Autenticação (Firebase Auth)                               │
│  - Email/senha                                       │
│  - 10.000 autenticações/mês                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   CAMADA DE DADOS                           │
├─────────────────────────────────────────────────────────────┤
│  Banco Principal (AWS CosmosDB)                             │
│  - 25 GB armazenamento gratuito                             │
│  - 25 RCU/WCU (200M requisições/mês)                        │
├─────────────────────────────────────────────────────────────┤
│  Cache/Real-time (Firebase Realtime Database)               │
│  - 1 GB armazenamento                                       │
│  - 10 GB/mês transferência                                  │
│  - Operações ilimitadas                                     │
└─────────────────────────────────────────────────────────────┘
```

#### 3. **Página de Login/Autenticação e Fluxos de Upgrade**

- Integração com Supabase GoTrue (api.neuro-ia.es) para autenticação de usuários internos (tabela `users`) e API Key para clientes externos (tabela `api_clients`).
- Cadastro de novo usuário: registra em `users` com campos `email`, `created_at`, `trial_start`, `status`='active', `role`, etc.
- Lógica de teste gratuito: acesso liberado por 7 dias após `trial_start` (`users`). Após esse prazo, status do usuário muda para `trial_expired` e acesso é bloqueado, redirecionando para página de planos.

- **Fluxo de upgrade de plano:**
  - Ao expirar o trial, o usuário é redirecionado automaticamente para uma tela de planos, onde pode comparar opções, escolher um plano, realizar o pagamento online (integração com gateway como Stripe ou Mercado Pago) e ter o acesso liberado automaticamente após confirmação. O sistema deve exibir feedback visual em cada etapa (pagamento, ativação, erros, etc.), enviar recibo por e-mail e atualizar o status do usuário em tempo real.
  - Implementar downgrade/cancelamento de plano, com automação de status e notificações específicas para cada situação (trial_expired, suspended, cancelled).
  - Exemplo de tela: cards de planos com preços, benefícios, botão de contratação, status de pagamento, histórico de faturas e opção de reativação.
- Validação do status do usuário/cliente (campo `status` nas tabelas `users` e `api_clients`):
  - **active:** acesso normal ao dashboard
  - **suspended:** exibe mensagem "Sua conta está suspensa. Contate o suporte."
  - **cancelled:** exibe mensagem "Sua assinatura foi cancelada. Reative para continuar."
  - **trial_expired:** exibe mensagem "Seu teste gratuito expirou. Escolha um plano para continuar." e redireciona automaticamente para a página de planos
- Detecção automática do tipo de usuário (interno: `users`, externo/API: `api_clients`, admin: campo `role` em `users`) e redirecionamento para dashboard, área de integração ou painel administrativo conforme o caso
- Layout simples, seguro, responsivo, com feedback visual claro para autenticação (sucesso, erro, bloqueio, trial expirado)
- Proteção contra brute-force e aplicação de rate limit nas tentativas de login (armazenar tentativas e timestamps em tabela/log, ex: máximo de 5 tentativas por IP/usuário a cada 15 minutos)
- Sistema de logging em background: registrar autenticações e tentativas (sucesso, falha, bloqueio) em tabela de auditoria (`audit_logs`) para monitoramento e compliance

#### 3.1 **Página de Cadastro de Novos Usuários**

- Integração com Supabase GoTrue (api.neuro-ia.es) para criação de conta (email/senha), registro em `users` com campos: `email`, `created_at`, `trial_start`, `status`='active', `role`, etc.
- Ao cadastrar, inicia o período de teste gratuito de 7 dias (campo `trial_start` = now())
- Validação de e-mail único (unicidade em `users.email`) e senha forte (mínimo 8 caracteres, letras e números)
- Feedback visual para sucesso, erro e validação de campos
- Confirmação de e-mail (opcional) para ativação da conta (campo `is_active`)
- Layout responsivo, seguro e acessível
- Logging de cadastro em `audit_logs` para auditoria

#### 3.2 **Página de Recuperação de Senha**

- Integração com Supabase GoTrue (api.neuro-ia.es) para envio de e-mail de recuperação
- Validação de e-mail cadastrado (existência em `users.email`) e feedback visual para sucesso/erro
- Layout simples, seguro e responsivo
- Logging de tentativas de recuperação em `audit_logs` para auditoria


#### 4. **Dashboard Principal, Relatórios e KPIs**
- Visão geral de cotações, status, KPIs e notificações
- Cards, gráficos e timeline de atividades recentes
- **Relatórios e exportação:**
  - Disponibilizar relatórios práticos: cotações por status, performance de fornecedores, uso de APIs, faturamento mensal, engajamento de usuários, exportação em PDF/Excel.
  - Definir e exibir KPIs do negócio: tempo médio de resposta, taxa de conversão de trial, engajamento, SLA, performance de fornecedores, uso de recursos por plano.
  - Incluir alertas automáticos para eventos críticos (fim do trial, falha de integração, uso acima do limite do plano), com notificações multicanal (e-mail, WhatsApp, dashboard).
  - Utilizar views e consultas sobre quotations, suppliers, supplier_proposals, audit_logs para alimentar dashboards e relatórios.


#### 5. **Pesquisa Cotação - nLic**
- Barra de busca e filtros: permite pesquisar editais por palavra-chave, status, órgão, modalidade, entre outros critérios.
- Tabela/lista de editais: cada linha mostra informações resumidas do edital, como:
  - Número do edital
  - Órgão responsável
  - Modalidade
  - Objeto (descrição resumida)
  - Data de abertura e encerramento para envio de propostas
  - Status atual
- Paginação: navegação entre páginas de resultados.

#### 5.1 **Resultado Cotação - nLic**
- Card de resultado (exemplo de layout):
  - Card largo ocupando a horizontal, exibindo:
    - Id contratação PNCP: 08999690000146-1-000026/2025
    - Edital nº 19/2025
    - Órgão: MUNICIPIO DE SANTA CRUZ
    - Uasg: 123456
    - Última Atualização: 28/07/2025
    - Modalidade da Contratação: Pregão - Eletrônico
    - Objeto: [Portal de Compras Públicas] - AQUISIÇÃO PARCELADA DE BENS MÓVEIS TIPO; MOBILIÁRIO E ELETRODOMÉSTICOS, PARA ATENDER AS NECESSIDADES DE TODAS AS SECRETARIAS DO MUNICÍPIO DE SANTA CRUZ-PB
    - Local: Santa Cruz/PB
    - Botões à direita: "+ Incluir" e "Ver"

##### 5.1.a **Incluir - nLic**
- Inclui ao CotAi

##### 5.1.b **Ver - nLic**
- Leva à página cPNCP (com base no 'Id contratação PNCP: 08999690000146-1-000026/2025' o link será por exemplo https://pncp.gov.br/app/editais/08999690000146/2025/26)


#### 6. **Gestão de Cotações - CotAi**
- Visualização das cotações em um Kanban dinâmico, com colunas representando os principais status do fluxo:
  - **Abertas**: cotações recém-criadas, aguardando ações iniciais.
  - **Em andamento**: cotações em processo de recebimento de propostas ou análise.

    - **Processo inteligente de extração e análise de editais:**
      - Suporte a múltiplos formatos (PDF, DOC, ODT, XLS, imagens/OCR).
      - Extração automática de dados relevantes do edital (número, órgão, objeto, prazos, requisitos, anexos).
      - Análise semântica para identificar produtos/serviços e critérios de habilitação.
      - Matching automático com fornecedores cadastrados, sugerindo os mais aderentes ao edital.
      - Validação de campos obrigatórios e registro de metadados para auditoria.
      - Logs detalhados de cada etapa do processamento.

    - **Validação e assinatura eletrônica:**
      - Geração automática do pedido de cotação com base nos dados extraídos.
      - Integração com provedores de assinatura digital (ICP-Brasil, DocuSign, etc.).
      - Validação do certificado digital, integridade do documento (hash), registro de logs e evidências.
      - Apenas pedidos assinados e validados podem ser enviados.

    - **Envio de cotações aos clientes:**
      - Após validação e assinatura, o sistema permite o envio automático das cotações para os clientes/fornecedores selecionados.
      - Envio multicanal: e-mail, WhatsApp (quando disponível), e notificação interna no sistema.
      - Registro do status de envio (enviado, entregue, visualizado, erro) para cada destinatário.
      - Feedback visual ao operador sobre o sucesso ou falha do envio.
      - Histórico de envios e logs de auditoria acessíveis no detalhamento da cotação.
      - Possibilidade de reenvio manual em caso de falha ou atualização do pedido.

    - **Funcionalidades adicionais:**
      - Visualização do status de extração, análise, assinatura e envio em tempo real.
      - Download do edital estruturado e do pedido de cotação assinado.
      - Relatórios de performance de fornecedores e acompanhamento do ciclo de cada cotação.
  - **Respondidos**: cotações que já receberam respostas e estão aguardando análise para serem enviadas ao operador de licitação (prontas para proposta).
  - **Finalizadas**: cotações concluídas, com resultado definido.
  - **Canceladas**: cotações encerradas sem conclusão.
- Cada cartão de cotação exibe na coluna:
  - Número/ID da cotação
  - Data de criação
  - Última atualização
  - Prazo para resposta/envio de proposta
  - Órgão solicitante
  - Objeto/descrição detalhada
  Ao clicar em um cartão, exibe um **formulário detalhado da licitação**, permitindo visualizar e editar todas as informações relevantes. O formulário deve ser dividido em seções claras, com campos editáveis (quando permitido) e informações agrupadas de forma lógica. Sugestão de estrutura:

  **Seção 1: Dados Gerais**
  - **Número/ID da cotação**: campo somente leitura
  - **Data de criação**: campo somente leitura
  - **Última atualização**: campo somente leitura
  - **Status atual**: dropdown para alteração de status (com histórico de mudanças)
  - **Modalidade da cotação**: dropdown (ex: Pregão, Concorrência, etc.)
  - **Órgão solicitante**: campo texto/autocomplete
  - **Objeto/descrição detalhada**: textarea expansível

  **Seção 2: Prazos**
  - **Prazo para resposta/envio de proposta**: campo data/hora com calendário
  - **Local de entrega/execução**: campo texto/autocomplete

  **Seção 3: Participantes**
  - **Responsáveis pela cotação**: múltipla seleção de usuários internos (autocomplete)
  - **Fornecedores participantes**: lista com busca, opção de adicionar/remover fornecedores, exibir status de resposta de cada fornecedor

  **Seção 4: Valores**
  - **Valor total estimado**: campo numérico com máscara de moeda

  **Seção 5: Histórico e Anexos**
  - **Histórico de interações/ações**: timeline de eventos (edições, comentários, mudanças de status, etc.), cada item com data/hora, usuário e descrição da ação
  - **Anexos/documentos relacionados**: upload múltiplo de arquivos, visualização e download, opção de remover anexos

  **Seção 6: Observações**
  - **Observações/comentários**: campo textarea, com histórico de comentários, possibilidade de menção a usuários (@), ordenação por data

  **Seção 7: Botão: Listar Itens (mostra os produtos)**
  - Botão destacado "Listar Itens" dentro do formulário detalhado da cotação
  - Ao clicar, exibe uma lista dos produtos vinculados à cotação (campos principais: código, nome, categoria, unidade, quantidade, preço estimado)
  - Permite visualizar detalhes de cada produto/item, com opção de expandir para ver especificações técnicas
  - Interface responsiva, pode ser modal, drawer ou seção expansível
  - Útil para operadores e gestores conferirem rapidamente todos os itens/produtos da cotação sem sair do fluxo principal
  - **Observações/comentários**: campo textarea, com histórico de comentários, possibilidade de menção a usuários (@), ordenação por data


  **Ações rápidas no formulário:**
  - **Salvar alterações** (com validação de campos obrigatórios)
  - **Cancelar/Voltar**
  - **Exportar detalhes** (PDF, Excel)
  - **Excluir cotação** (com confirmação)
  - **Adicionar comentário** (com notificação aos responsáveis)
  - **Visualizar log completo de alterações**

  **Usabilidade:**
  - Campos obrigatórios destacados
  - Feedback visual de sucesso/erro ao salvar
  - Seções colapsáveis para facilitar navegação em formulários longos
  - Suporte a atalhos de teclado para navegação e ações rápidas
  - Responsivo para uso em desktop e mobile

- Ações rápidas em cada cartão:
  - Editar cotação
  - Visualizar detalhes
  - Exportar dados (PDF, Excel, etc.)
  - Excluir cotação
- Arrastar e soltar cartões entre colunas para atualizar o status da cotação.
- Filtros avançados por status, período, responsável, valor, entre outros.
- Busca por palavra-chave e paginação, se necessário.
- Seleção múltipla de cartões para ações em lote (ex: exportar, excluir).



#### 7. **Gestão de Fornecedores**
- CRUD de fornecedores: tabela `suppliers` (campos principais: id, name, cnpj/cpf, type, email, phone, whatsapp, address, status, performance_score, total_quotations, response_rate, avg_response_time_hours, categories, documents, certifications, created_by, updated_by, created_at, updated_at, deleted_at)
- Performance e histórico de interações: campos `performance_score`, `total_quotations`, `response_rate`, `avg_response_time_hours`, `last_interaction` em `suppliers`; histórico detalhado em `audit_logs` (entity_type='suppliers') e comentários em `comments` (commentable_type='supplier')
- Dashboard de performance: agregações e KPIs baseados nos campos acima


#### 8. **Wireframes, Prototipação e Usabilidade**

- Incluir wireframes, fluxogramas ou protótipos das telas principais (login, dashboard, Kanban, upgrade de plano, gestão de fornecedores, recuperação de senha, preferências de usuário) para validação visual dos fluxos.
- Realizar testes de usabilidade com usuários-alvo e definir métricas de UX (NPS, tempo de tarefa, taxa de erro, feedback visual para autenticação, cadastro, erros e bloqueios).
- Garantir que todos os componentes UI (botões, inputs, cards, modais) sejam acessíveis e documentados.
- Implementar navegação clara e acessível: menus laterais/superiores, breadcrumbs, atalhos de teclado, foco em acessibilidade.
- Detalhar requisitos de acessibilidade: contraste mínimo, navegação por teclado, ARIA, testes com leitores de tela, seguindo WCAG.

#### 9. **Notificações e Comunicação**
- Central de notificações: tabela `notifications` (user_id, title, message, type, related_type, related_id, is_read, channels, sent_at, delivery_status)
- Templates de e-mail: lógica de aplicação, mas pode ser armazenada em arquivos ou tabela específica (não detalhada no banco, mas pode ser expandida)
- Integração com WhatsApp: campo `channels` em `notifications` suporta 'whatsapp'


#### 10. **Permissões, Segurança e Internacionalização**

- Detalhar fluxos de gestão de permissões e roles (criação, edição, atribuição, histórico de alterações), com interface para atribuição e edição por usuário ou grupo.
- Considerar implementação de MFA (autenticação em dois fatores) para usuários internos e clientes externos, reforçando a segurança do login.
- Planejar processos de versionamento e migração de dados (ex: scripts de migração, versionamento de API e banco), garantindo evolução segura do sistema.
- Detalhar estratégia de internacionalização (i18n): suporte a múltiplos idiomas, formatos regionais, tradução de conteúdo, notificações e preferências de idioma do usuário.
- Relatórios: consultas e views sobre tabelas como `quotations`, `suppliers`, `supplier_proposals`, `audit_logs`, etc.
- Exportação: lógica de aplicação, mas os dados vêm dessas tabelas


#### 11. **Configurações e Usuários**


**Gerenciamento de usuários:**
  - CRUD completo de usuários internos, com listagem, busca, filtros por status, organização e papel (role).
  - Cadastro/edição de usuário: campos obrigatórios (email, nome, role, permissões, status), associação à organização (`organization_id`), integração com Supabase GoTrue (supabase_uid).
  - Ativação/desativação de usuários via campo `is_active`.
  - Visualização de histórico de login e ações recentes (via `audit_logs`).
  - Reset de senha e alteração de e-mail (integração com Supabase GoTrue e atualização em `users`).
  - Auditoria de alterações: todas as ações relevantes registradas em `audit_logs` (entity_type='users').

**Permissões (campo `permissions` em `users`):**
  - Estrutura flexível em JSONB para definir permissões granulares (ex: acesso a módulos, ações permitidas, limites de uso).
  - Permite implementação de RBAC (Role-Based Access Control) e customização por organização.
  - Interface para atribuição e edição de permissões por usuário ou grupo, com histórico de alterações e tela/modal dedicada.

**Preferências de usuário:**
  - Preferências individuais (tema, idioma, notificações, layout, etc.) podem ser armazenadas em um campo JSONB extra em `users` (ex: `preferences`) ou em uma tabela separada (`user_preferences`).
  - Interface para o usuário editar suas preferências pessoais, com salvamento automático e aplicação imediata.
  - Exemplo de estrutura: `{ "theme": "dark", "language": "pt-BR", "notifications": { "email": true, "whatsapp": false } }`

**Fluxos e telas sugeridos:**
  - Tela de administração de usuários (listagem, filtros, ações em lote, exportação)
  - Modal ou página para edição de permissões (com histórico de alterações)
  - Página de preferências pessoais do usuário
  - Logs/auditoria de ações administrativas

- **Permissões (campo `permissions` em `users`):**
  - Estrutura flexível em JSONB para definir permissões granulares (ex: acesso a módulos, ações permitidas, limites de uso).
  - Interface para atribuição e edição de permissões por usuário ou por grupo de usuários (roles).
  - Exemplo de estrutura: `["quotations:read", "quotations:edit", "suppliers:manage", "reports:view"]`.
  - Permite implementação de RBAC (Role-Based Access Control) e customização por organização.

- **Preferências de usuário:**
  - Preferências individuais (tema, idioma, notificações, layout, etc.) podem ser armazenadas em um campo JSONB extra em `users` (ex: `preferences`) ou em uma tabela separada (`user_preferences`).
  - Interface para o usuário editar suas preferências pessoais, com salvamento automático e aplicação imediata.
  - Exemplo de estrutura: `{ "theme": "dark", "language": "pt-BR", "notifications": { "email": true, "whatsapp": false } }`

- **Fluxos e telas sugeridos:**
  - Tela de administração de usuários (listagem, filtros, ações em lote, exportação)
  - Formulário de cadastro/edição de usuário
  - Modal ou página para edição de permissões
  - Página de preferências pessoais do usuário
  - Logs/auditoria de ações administrativas


#### 12. **Monitoramento de Uso**
- Dashboard de uso dos recursos: dados de uso podem ser extraídos de tabelas como `api_usage_logs`, `api_usage_daily_summary`, `audit_logs`, e agregados para exibir consumo de PostgreSQL, Edge Functions, Supabase, etc.

Se quiser exemplos de queries, views ou sugestões de implementação para alguma dessas áreas, é só pedir!


**Outros pontos:**

-- **Navegação clara e acessível:**
  - Menus laterais ou superiores bem definidos, breadcrumbs, atalhos de teclado, foco em acessibilidade (uso de ARIA, contraste, navegação por teclado e leitores de tela).

-- **Componentes reutilizáveis:**
  - Biblioteca de componentes UI padronizados (botões, tabelas, cards, modais, inputs, selects, tooltips, etc.), seguindo o design system do projeto. Todos os componentes devem ser responsivos, acessíveis, com estados visuais claros (hover, active, disabled, loading) e documentação de uso.

-- **Suporte offline (PWA):**
  - Implementação de Progressive Web App (PWA) com Service Worker para cache de assets e rotas críticas, fallback offline para principais telas, sincronização automática de dados quando a conexão for restabelecida e instalação no dispositivo do usuário (add to home screen).

-- **Foco em experiência do usuário, acessibilidade e performance:**
  - Feedback visual imediato em todas as ações (loading, sucesso, erro), animações suaves, otimização de imagens e assets, lazy loading de módulos, pré-busca de dados para telas críticas, métricas de performance (Lighthouse, Web Vitals), testes de usabilidade contínuos e validação de acessibilidade.

Se precisar de um esqueleto de rotas ou estrutura de pastas para o Next.js, posso gerar!




frontend/
├── Dockerfile
├── docker-compose.yml
├── public/
│   ├── offline.html
│   ├── favicon.ico
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── quotations/
│   │   │   ├── kanban/
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── suppliers/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── preferences/
│   │   │   └── page.tsx
│   │   ├── plans/
│   │   │   └── page.tsx
│   │   └── _middleware.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── Kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   └── KanbanCard.tsx
│   │   ├── Dashboard/
│   │   │   ├── KpiCards.tsx
│   │   │   ├── Chart.tsx
│   │   │   └── Timeline.tsx
│   │   ├── Suppliers/
│   │   │   ├── SupplierForm.tsx
│   │   │   └── SupplierCard.tsx
│   │   ├── Notifications/
│   │   │   └── NotificationList.tsx
│   │   ├── Preferences/
│   │   │   └── PreferencesForm.tsx
│   │   └── Layout/
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── Breadcrumbs.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   ├── utils/
│   │   ├── api.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css
│   └── service-worker.ts
├── .env.local
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md

# Para rodar o frontend com Docker:
# docker build -t frontend .
# docker run -p 3000:3000 frontend

# Para rodar todos os serviços integrados:
# docker compose up





