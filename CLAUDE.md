# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CotAi Edge is an intelligent quotation management system with AI integration, automating the entire corporate procurement cycle with PNCP (Portal Nacional de Contratações Públicas) integration.

### Target Users
- **Primary:** Procurement departments of medium and large companies
- **Secondary:** Small companies with high quotation volume  
- **Tertiary:** Autonomous procurement professionals and consultants

## Architecture

### Hybrid Architecture with Supabase Self-Hosted
- **Supabase PostgreSQL:** Main database (quotations, suppliers, users, configs) - `api.neuro-ia.es`
- **Supabase Realtime:** Real-time updates/Kanban, instant notifications
- **Supabase GoTrue:** Authentication and user management
- **Supabase Storage:** Files, documents, attachments
- **Kong Gateway:** API Gateway and proxy (integrated with Supabase)
- **Redis Cloud (Upstash):** Query cache, sessions
- **Cloudflare Workers + KV:** Edge cache, API proxy
- **Google BigQuery:** Analytics/BI

### Frontend Stack
- **Framework:** Next.js with TypeScript
- **Styling:** Tailwind CSS
- **PWA:** Service Workers for offline support
- **Architecture:** Clean Architecture pattern

## Common Development Commands

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Docker Development
```bash
# Build and start all services (connects to remote Supabase)
docker compose up --build -d

# View logs for specific service
docker compose logs -f backend

# Restart specific service
docker compose restart frontend

# Stop all services
docker compose down
```

### Environment Configuration
The system connects to a remote Supabase instance at `api.neuro-ia.es`:

```bash
# Required environment variables
SUPABASE_URL=https://api.neuro-ia.es
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your-jwt-secret-here
```

## Core Entities and Database Structure

### Main Tables
- `organizations` - Company/organization data
- `users` - Internal users with roles and permissions
- `api_clients` - External API clients
- `suppliers` - Supplier management with performance tracking
- `quotations` - Main quotation/bidding entity
- `quotation_items` - Items within quotations
- `quotation_invitations` - Supplier invitations
- `supplier_proposals` - Supplier responses
- `proposal_items` - Items in supplier proposals
- `pncp_opportunities` - PNCP integration data
- `notifications` - Multi-channel notification system
- `audit_logs` - Immutable audit trail

### Key Features Implementation
- **Kanban Board:** Dynamic quotation status management (Open, In Progress, Responded, Finalized, Cancelled)
- **Document Processing:** OCR/AI extraction from multiple formats (PDF, DOC, images)
- **Real-time Updates:** Supabase Realtime for live status changes
- **Multi-channel Notifications:** Email, WhatsApp integration
- **Performance Tracking:** Supplier metrics and KPIs
- **PNCP Integration:** Public procurement portal connectivity

## Authentication Flow
- **Internal Users:** Supabase GoTrue with email/password
- **External Clients:** API Key authentication
- **Trial System:** 7-day free trial with automatic plan upgrade prompts
- **Status Management:** active, suspended, cancelled, trial_expired

## Key Business Logic

### Quotation Workflow
1. **Creation:** Manual or PNCP import
2. **Document Processing:** AI extraction and analysis
3. **Supplier Matching:** Automatic supplier recommendation
4. **Digital Signature:** ICP-Brasil/DocuSign integration
5. **Multi-channel Distribution:** Email/WhatsApp sending
6. **Response Collection:** Supplier proposal management
7. **Analysis & Reporting:** Performance metrics and exports

### User Management
- RBAC with flexible permissions (JSONB structure)
- Organization-based access control
- User preferences (theme, language, notifications)
- Audit logging for all actions

## Development Guidelines

### Code Style
- TypeScript for type safety
- Clean Architecture patterns
- Component-based UI structure
- Responsive design (mobile-first)
- Accessibility compliance (WCAG)

### API Integration
All Supabase services are accessed via the remote instance:
- **REST API:** `https://api.neuro-ia.es/rest/v1/`
- **Auth:** `https://api.neuro-ia.es/auth/v1/`
- **Realtime:** `https://api.neuro-ia.es/realtime/v1/`
- **Storage:** `https://api.neuro-ia.es/storage/v1/`
- **Edge Functions:** `https://api.neuro-ia.es/functions/v1/`

### Security Requirements
- AES-256 encryption for sensitive data
- Rate limiting on authentication
- Audit logging for all critical actions
- LGPD compliance
- No secrets in code or commits

## Testing and Quality

### Frontend Tests
```bash
# Run tests (when implemented)
npm test

# E2E tests (when implemented)  
npm run test:e2e
```

### Performance Requirements
- Response time < 200ms for queries
- 99.9% availability SLA
- Support for 10,000 concurrent users
- Document processing < 3 seconds

## Deployment

### Local Development
- Frontend runs locally via Docker or npm
- Connects to remote Supabase at `api.neuro-ia.es`
- All data persists in remote PostgreSQL

### Production
- Cloudflare Pages for frontend hosting
- Cloudflare Workers for edge computing
- AWS Lambda for backend services
- Supabase self-hosted for data layer

## Important Notes

- **Database:** Always use the remote Supabase instance, never local
- **Authentication:** Integrate with Supabase GoTrue for all auth flows
- **Real-time:** Use Supabase Realtime for live updates
- **Caching:** Implement edge caching with Cloudflare Workers KV
- **Monitoring:** All actions should be logged to `audit_logs` table
- **PWA:** Implement service workers for offline capability