# VantakOS Technical Whitepaper
## Architecture, Implementation, and System Design

**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** VantakOS Engineering Team

---

## Executive Summary

VantakOS is a multi-tenant, white-label SaaS platform built on Next.js 16 (App Router) that enables service businesses to deploy fully branded, installable Progressive Web Applications (PWAs) with integrated booking and payment processing. The system utilizes a modern tech stack with serverless architecture, real-time tenant resolution, and automated payment splitting via Stripe Connect.

**Core Technical Achievement:** Single codebase deployment that dynamically renders thousands of unique, branded applications with isolated payment processing, theme injection, and tenant-specific PWA manifests.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 Application                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  App Router  │  │  API Routes  │  │   Server     │      │
│  │  (Pages)     │  │  (Backend)   │  │ Components   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Supabase   │     │   Stripe    │     │  Vercel     │
    │  (Database  │     │   Connect   │     │  (CDN/Host) │
    │  + Storage) │     │   (Payments)│     │             │
    └─────────────┘     └─────────────┘     └─────────────┘
```

### 1.2 Technology Stack

**Frontend Framework:**
- **Next.js 16.1.1** (App Router) - Server-side rendering and API routes
- **React 19.0.0** - Component library with concurrent features
- **TypeScript 5.8.2** - Type-safe development
- **Tailwind CSS 4.1.18** - Utility-first styling with CSS-first configuration
- **Framer Motion 11.11.11** - Animation library for UI interactions

**Backend & Infrastructure:**
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **Stripe Connect** - Payment processing with multi-party transfers
- **Vercel** - Serverless hosting and edge deployment
- **PostCSS** - CSS processing pipeline

**Additional Services:**
- **Google Gemini AI** (Gemini 3 Flash) - AI-powered support assistant
- **Supabase Storage** - Image and asset hosting
- **Service Workers** - PWA offline capabilities and push notifications

### 1.3 Multi-Tenancy Architecture

**Tenant Resolution Strategy:**
- Tenants are identified via URL slug pattern: `/{slug}` or query parameter `?tenant={slug}`
- Dynamic tenant resolution occurs at page load via Supabase query
- Fallback to mock data for resilience during database outages
- Server-side tenant context injection prevents client-side data leakage

**Database Schema (Key Tables):**

```sql
-- Core tenant configuration
tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR UNIQUE,
  business_name VARCHAR,
  primary_color VARCHAR,
  secondary_color VARCHAR,
  logo_url TEXT,
  background_image_url TEXT,
  stripe_account_id VARCHAR,
  tier VARCHAR, -- 'starter' | 'pro' | 'elite' | 'business'
  platform_fee_percent DECIMAL,
  business_type VARCHAR, -- 'service' | 'education'
  font_family VARCHAR,
  timezone VARCHAR,
  created_at TIMESTAMP
)

-- Service offerings per tenant
services (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR,
  description TEXT,
  price INTEGER, -- stored in cents
  duration_minutes INTEGER,
  image_url TEXT
)

-- Appointment bookings
appointments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  customer_id UUID,
  service_id UUID REFERENCES services(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR, -- 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  lesson_notes TEXT, -- for education businesses
  is_recurring BOOLEAN,
  recurring_pattern VARCHAR, -- 'weekly' | 'biweekly' | 'monthly'
  recurring_end_date DATE,
  parent_appointment_id UUID, -- first in series
  recurring_group_id UUID, -- groups related appointments
  created_at TIMESTAMP
)

-- Product/Shop items (Lesson Packs for education)
products (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR,
  description TEXT,
  price INTEGER, -- stored in cents
  image_url TEXT,
  sku VARCHAR
)
```

### 1.4 Request Flow Architecture

**Landing Page Request:**
```
1. User visits /glow-studio
2. Next.js Server Component executes getTenant('glow-studio')
3. Supabase query: SELECT * FROM tenants WHERE slug = 'glow-studio'
4. Tenant data mapped to TenantConfig interface
5. CSS variables injected into <html> element
6. Dynamic manifest generated for PWA
7. Page rendered with tenant-specific branding
```

**Booking Flow:**
```
1. Customer selects service, date, time
2. Frontend creates PENDING appointment in Supabase
3. Appointment ID returned to client
4. POST /api/checkout with appointmentId, amount, slug
5. Server-side: Lookup tenant Stripe account & fee percent
6. Stripe Checkout Session created with:
   - application_fee_amount (platform fee)
   - transfer_data.destination (merchant account)
7. Customer redirected to Stripe Checkout
8. Stripe webhook: checkout.session.completed
9. Webhook handler updates appointment: CONFIRMED, paid=true
```

---

## 2. Core Technical Components

### 2.1 Tenant Resolution Engine

**Location:** `app/[slug]/page.tsx`, `services/tenantService.ts`

**Implementation:**
- Server-side tenant lookup using Next.js Server Components
- Type-safe mapping from Supabase snake_case to TypeScript camelCase
- Graceful degradation with mock fallback
- Background image URL and business type support

**Key Function:**
```typescript
async function getTenant(slug: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();
  
  // Maps database schema to TypeScript interface
  return {
    id: data.id,
    name: data.business_name,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color,
    business_type: data.business_type || 'service',
    background_image_url: data.background_image_url,
    // ... additional mappings
  };
}
```

### 2.2 Dynamic Theme Injection

**Location:** `components/ThemeProvider.tsx`, `services/themeService.ts`

**Mechanism:**
- CSS custom properties (CSS variables) set on `:root`
- Tailwind CSS configured to consume these variables via `var(--brand-primary)`
- Live theme updates without page reload
- Background images applied to body element

**CSS Variable Mapping:**
```css
:root {
  --brand-primary: #38bdf8;      /* Tenant's primary color */
  --brand-secondary: #0f172a;    /* Tenant's secondary color */
  --brand-accent: #f0f9ff;       /* Accent color */
  --brand-bg: #ffffff;           /* Background */
  --brand-radius: 1.5rem;        /* Border radius */
  --font-family: 'Inter', sans-serif;
}
```

### 2.3 Payment Processing Engine

**Location:** `app/api/checkout/route.ts`

**Stripe Connect Implementation:**
- **Application Fee Model:** Platform collects fee before transferring remainder
- **Connected Accounts:** Each tenant has isolated Stripe Express account
- **Fee Calculation:** Tier-based percentages (Starter: 1.5%, Pro: 1.0%, Elite: 0.4%)
- **Webhook Security:** Signature verification prevents unauthorized updates

**Payment Flow:**
```typescript
// 1. Calculate fees
const amountCents = Math.round(amount * 100);
const feePercent = tenant.platform_fee_percent || 1.5;
const applicationFeeAmount = Math.round(amountCents * (feePercent / 100));

// 2. Create checkout session with split
const session = await stripe.checkout.sessions.create({
  payment_intent_data: {
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: tenant.stripe_account_id, // Merchant account
    },
  },
});
```

### 2.4 PWA Manifest Generation

**Location:** `app/manifest.ts`

**Dynamic Manifest:**
- Server-side manifest generation using Next.js MetadataRoute
- Base64-encoded SVG icons for instant loading
- Tenant-specific name, theme color, and start URL
- Supports both maskable and regular icon purposes

**Implementation:**
```typescript
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VantakOS',
    short_name: 'Vantak',
    theme_color: '#38BDF8',
    background_color: '#0F172A',
    icons: [
      {
        src: 'data:image/svg+xml;base64,...', // Base64 SVG
        sizes: '192x192',
        type: 'image/svg+xml',
      },
    ],
  };
}
```

### 2.5 Recurring Appointments System

**Location:** `app/api/appointments/create-recurring/route.ts`

**Implementation:**
- Pro tier feature (gated access)
- Generates multiple appointment records for weekly/biweekly/monthly patterns
- Groups related appointments via `recurring_group_id`
- Links appointments via `parent_appointment_id`
- Single Stripe checkout for entire series

**Recurring Logic:**
```typescript
// Calculate all appointment dates
const dates = [];
let currentDate = new Date(startDate);
while (currentDate <= endDate) {
  dates.push(new Date(currentDate));
  currentDate.setDate(currentDate.getDate + (pattern === 'weekly' ? 7 : 14));
}

// Create appointments in batch
const appointments = dates.map(date => ({
  tenant_id: tenantId,
  service_id: serviceId,
  start_time: date,
  is_recurring: true,
  recurring_group_id: groupId,
  parent_appointment_id: firstAppointmentId,
}));
```

### 2.6 Education Mode (Business Type Variants)

**Implementation:**
- Conditional UI rendering based on `tenant.business_type`
- Terminology swapping: "Services" → "Lesson Types", "Customers" → "Students"
- Lesson notes functionality for post-appointment feedback
- Package selling rebranded as "Lesson Packs"

**Conditional Rendering Example:**
```typescript
const buttonText = tenant.business_type === 'education' 
  ? 'Schedule Lesson' 
  : 'Book Now';
```

---

## 3. API Design

### 3.1 RESTful Endpoints

**Checkout API:**
- `POST /api/checkout`
- Request: `{ amount, slug, serviceName, appointmentId, customerEmail }`
- Response: `{ url: Stripe Checkout URL }`
- Side Effects: Creates Stripe Checkout Session with fee split

**Recurring Appointments:**
- `POST /api/appointments/create-recurring`
- Request: `{ slug, serviceId, startDate, recurringPattern, endDate }`
- Response: `{ checkoutUrl, appointmentCount }`
- Side Effects: Creates multiple appointments, initiates single checkout

**Stripe Webhooks:**
- `POST /api/webhooks/stripe`
- Events: `checkout.session.completed`
- Side Effects: Updates appointment status to CONFIRMED, sets paid flag

**Push Notifications:**
- `POST /api/push/subscribe` - Subscribes device for push notifications
- `POST /api/push/send` - Sends notification to subscribed devices (Elite tier)

### 3.2 Server-Side Security

**Environment Variables:**
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only, never exposed to client
- `STRIPE_SECRET_KEY` - Server-only
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `NEXT_PUBLIC_SUPABASE_URL` - Public read-only access

**Row Level Security (RLS):**
- Supabase RLS policies prevent unauthorized data access
- Tenant isolation enforced at database level
- Service role key bypasses RLS for server-side operations only

---

## 4. Frontend Architecture

### 4.1 Component Structure

**Server Components (Next.js App Router):**
- `app/[slug]/page.tsx` - Tenant landing page
- `app/layout.tsx` - Root layout with global styles
- `app/manifest.ts` - PWA manifest generation

**Client Components:**
- `components/BookingFlow.tsx` - Interactive booking interface
- `components/OwnerDashboard.tsx` - Business management interface
- `components/BrandingEditor.tsx` - Live theme customization
- `components/InstallBanner.tsx` - PWA installation prompts

### 4.2 State Management

**React Hooks Pattern:**
- `useState` for local component state
- `useEffect` for data fetching and side effects
- Server Components handle initial data loading
- Client Components handle interactivity

**No Global State Library:**
- Props drilling for tenant context
- Server Components provide initial data
- Supabase client-side queries for real-time updates

### 4.3 Styling Architecture

**Tailwind CSS 4 Configuration:**
- CSS-first configuration via `@import "tailwindcss"`
- Content scanning: `./app/**/*.{js,ts,jsx,tsx,mdx}`
- Theme customization via CSS variables
- Brand colors mapped to Tailwind utilities

**Dynamic Theming:**
```typescript
// Theme injection
document.documentElement.style.setProperty('--brand-primary', tenant.primaryColor);
document.documentElement.style.setProperty('--brand-secondary', tenant.secondaryColor);
```

---

## 5. Database Design

### 5.1 Key Relationships

```
tenants (1) ──┬── (many) services
              ├── (many) appointments
              ├── (many) products
              └── (1) stripe_account (via stripe_account_id)
```

### 5.2 Indexing Strategy

**Recommended Indexes:**
- `tenants.slug` - UNIQUE index for fast tenant resolution
- `appointments.tenant_id` - Foreign key index
- `appointments.customer_id` - Query optimization
- `services.tenant_id` - Foreign key index
- `appointments.recurring_group_id` - Recurring appointment queries

### 5.3 Data Types

- **UUIDs:** Primary keys for all entities (Supabase standard)
- **Timestamps:** ISO 8601 format, stored as TIMESTAMP
- **Monetary Values:** Stored as INTEGER (cents) to avoid floating-point errors
- **Percentages:** DECIMAL(5,2) for fee percentages
- **Colors:** VARCHAR(7) for hex codes (#RRGGBB)

---

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Current Implementation:**
- Tenant identification via public slug (no authentication required for browsing)
- Owner dashboard access control (implementation varies)
- Stripe Connect onboarding requires identity verification

**Recommended Enhancements:**
- Implement Supabase Auth for owner/admin access
- Role-based access control (RBAC) for staff members
- API route authentication middleware

### 6.2 Payment Security

**Stripe Connect Best Practices:**
- All payment operations server-side
- Webhook signature verification
- Application fees calculated server-side
- No client-side manipulation of payment amounts

### 6.3 Data Protection

**Supabase Security:**
- Row Level Security (RLS) policies for tenant isolation
- Service role key restricted to server-side only
- Public access limited to read-only operations
- Environment variables for all secrets

**Recommendations:**
- Enable Supabase RLS on all tables
- Implement rate limiting on API routes
- Add input validation and sanitization
- Regular security audits of dependencies

---

## 7. Performance Optimization

### 7.1 Next.js Optimizations

**Server Components:**
- Database queries executed server-side
- Reduced client-side JavaScript bundle
- Improved initial page load times

**Static Generation:**
- Homepage (`app/page.tsx`) statically generated
- Manifest and icon routes pre-rendered
- Dynamic routes use ISR (Incremental Static Regeneration)

### 7.2 Database Optimization

**Query Optimization:**
- Single query per tenant resolution
- Efficient joins for related data
- Pagination for large result sets

**Caching Strategy:**
- Supabase connection pooling
- Next.js caching for static content
- CDN caching via Vercel Edge Network

### 7.3 Asset Optimization

**Image Handling:**
- Supabase Storage for tenant assets
- Lazy loading for below-fold images
- Responsive image sizes
- WebP format support

---

## 8. Deployment Architecture

### 8.1 Hosting Platform

**Vercel Deployment:**
- Serverless functions for API routes
- Edge network for global distribution
- Automatic SSL certificates
- Environment variable management

### 8.2 CI/CD Pipeline

**Recommended Setup:**
- GitHub Actions for automated testing
- Vercel Git integration for automatic deployments
- Preview deployments for pull requests
- Production deployments from main branch

### 8.3 Monitoring & Logging

**Current Implementation:**
- Console logging for errors
- Stripe webhook logging
- Supabase query logging

**Recommended Enhancements:**
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (Pingdom, UptimeRobot)
- Database query performance monitoring

---

## 9. Scalability Considerations

### 9.1 Multi-Tenancy Scalability

**Current Architecture:**
- Single database with tenant isolation
- Efficient tenant resolution via indexed slug
- No tenant-specific infrastructure

**Scaling Strategy:**
- Horizontal scaling via Supabase connection pooling
- Database partitioning if needed (future)
- CDN caching for static tenant assets

### 9.2 Payment Processing Scale

**Stripe Connect Benefits:**
- Built-in scalability for payment processing
- Automatic handling of high transaction volumes
- Global payment method support

### 9.3 Future Enhancements

**Recommended Additions:**
- Redis caching for tenant data
- Message queue for async operations
- Microservices architecture for complex features
- Multi-region deployment for global reach

---

## 10. Development Workflow

### 10.1 Local Development

**Setup Requirements:**
```bash
# Install dependencies
npm install

# Environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_URL=http://localhost:3000

# Run development server
npm run dev
```

### 10.2 Build Process

**Production Build:**
```bash
npm run build  # Creates optimized production bundle
npm start      # Runs production server locally
```

**Build Optimizations:**
- TypeScript compilation
- Tailwind CSS purging (unused styles removed)
- Code splitting and tree shaking
- Image optimization

---

## 11. Testing Strategy

### 11.1 Current Testing

**Manual Testing:**
- Tenant resolution flows
- Booking and payment flows
- Stripe webhook handling
- Theme injection verification

### 11.2 Recommended Testing

**Unit Tests:**
- Utility functions
- Fee calculation logic
- Date/time utilities
- Data transformation functions

**Integration Tests:**
- API route endpoints
- Database queries
- Stripe integration
- Webhook processing

**E2E Tests:**
- Complete booking flow
- Payment processing
- Tenant onboarding
- Owner dashboard operations

---

## 12. API Documentation

### 12.1 Public API (Future)

**Potential Public Endpoints:**
- Tenant information retrieval
- Service listing
- Availability checking
- Appointment creation (with authentication)

### 12.2 Webhook Events

**Stripe Webhooks:**
- `checkout.session.completed` - Payment successful
- `account.updated` - Stripe account status changes
- `transfer.created` - Funds transferred to merchant

---

## 13. Future Technical Roadmap

### 13.1 Short-Term (Q1 2025)
- Enhanced authentication system
- Staff management and permissions
- Advanced calendar/scheduling features
- Real-time appointment updates (Supabase Realtime)

### 13.2 Medium-Term (Q2-Q3 2025)
- Custom domain support per tenant
- Advanced analytics dashboard
- Email/SMS notification system
- Inventory management for shops

### 13.3 Long-Term (Q4 2025+)
- Mobile native apps (React Native)
- Marketplace features
- White-label API for third-party integrations
- Multi-currency support

---

## Conclusion

VantakOS represents a modern, scalable approach to multi-tenant SaaS architecture. By leveraging Next.js App Router, Supabase, and Stripe Connect, the platform achieves true white-labeling with isolated payment processing, dynamic theming, and PWA distribution—all from a single codebase deployment.

The technical foundation supports rapid scaling, secure multi-party payments, and flexible tenant configuration, making it an ideal platform for service businesses seeking a professional digital presence without the complexity of custom development.

---

**Document Version:** 1.0  
**Maintained By:** VantakOS Engineering Team  
**Last Updated:** January 2025

