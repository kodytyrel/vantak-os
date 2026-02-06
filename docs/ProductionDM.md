 # Production DM - Vantak
 
 ## Mission
 Vantak's mission is to provide a white-label, AI-assisted business operating system for service businesses. The platform helps owners launch branded customer experiences, manage operations, and get paid with minimal setup.
 
 ## Product Summary
 Vantak is a multi-tenant SaaS platform that delivers:
 - Branded public landing pages and marketing sites for each tenant.
 - A customer-facing booking and checkout experience.
 - Owner and admin dashboards for operations and growth.
 - Payments, invoicing, and terminal flows powered by Stripe.
 - Founding member and tier gating mechanics for growth and access control.
 - Push notifications and PWA install flows for retention.
 
 ## Tech Stack
 **Frontend**
 - Next.js (App Router) with React 19
 - Tailwind CSS and utility helpers
 - Framer Motion for motion/animation
 - PWA assets and install flows
 
 **Backend**
 - Next.js Route Handlers (server API)
 - Supabase for auth, database, and storage
 - Stripe for payments, subscriptions, and webhooks
 
 **Core Libraries**
 - Supabase auth helpers
 - Stripe SDK
 - QrCode generator for terminal flows
 - AI integration via Google GenAI SDK
 
 ## Architecture Overview
 - **Multi-tenant model** with tenant-specific branding, themes, and content.
 - **Server API routes** in `app/api` for business operations, checkout, and metrics.
 - **Payment flows** that include checkout, invoices, and terminal workflows.
 - **Push notifications** and PWA install components for customer re-engagement.
 - **Tier gating** to control feature access based on subscription or founder status.
 
 ## What We Have Built
 **Public Experience**
 - Landing pages, hero content, and service listings.
 - Themed branding and marketing components.
 - Lead capture and newsletter popups.
 
 **Customer Flows**
 - Claim and onboarding flows.
 - Booking and checkout experiences.
 - Invoice viewing and payment confirmation.
 
 **Owner/Admin Operations**
 - Owner dashboard with operational tools.
 - Admin prospector and marketing manager.
 - Product and order management interfaces.
 
 **Payments and Finance**
 - Stripe onboarding and account linking.
 - Checkout sessions and payment success flows.
 - Invoicing and receipts.
 - Terminal checkout and manual payment workflows.
 
 **Platform Capabilities**
 - Push notification setup and delivery.
 - PWA install prompts and animations.
 - Tier gating and founding member logic.
 
 ## How It Works
 **Tenant Setup**
 - Tenant branding and theme are defined in the database.
 - Branding and theming services load tenant configuration and drive UI styling.
 
 **Customer Journey**
 - Public landing and marketing routes are served from the App Router.
 - Customers can claim, book, and pay through Stripe-backed flows.
 - Payment confirmation and receipts are delivered via server routes and UI overlays.
 
 **Owner Journey**
 - Owners manage services, invoices, and growth tools from the dashboard.
 - Founding member and tier gating determine access to premium features.
 
 **Payments**
 - Stripe Connect onboarding is used for account setup.
 - Checkout sessions are created server-side, with webhook handling for status updates.
 - Terminal routes support in-person payment capture and receipt flows.
 
 **Data and Integrations**
 - Supabase provides authentication, data storage, and policies.
 - Stripe handles payment state and subscription lifecycle.
 - Push notifications are registered and delivered to subscribed devices.
 
 ## What Already Exists (Key Paths)
 - **Public pages**: `app/page.tsx`, `components/LandingPage.tsx`
 - **Tenant pages**: `app/[slug]/page.tsx`
 - **Dashboards**: `app/dashboard/*`, `components/OwnerDashboard.tsx`
 - **Payments**: `app/api/checkout/route.ts`, `api/checkout/create-session.ts`
 - **Stripe webhooks**: `app/api/stripe/*`, `api/webhooks/stripe.ts`
 - **Terminal flows**: `app/api/terminal/*`, `components/VantakTerminal.tsx`
 - **Branding**: `components/BrandingEditor.tsx`, `services/themeService.ts`
 - **Founding member logic**: `docs/FOUNDING_*`, `lib/tierGating.ts`
 
 ## How Systems Interact
 - **UI → API**: React components call Next.js route handlers for server operations.
 - **API → Supabase**: Server routes use Supabase for data reads/writes and auth.
 - **API → Stripe**: Payments, invoices, and terminal sessions are created server-side.
 - **Stripe → Webhooks**: Stripe sends payment lifecycle events to webhook handlers.
 - **UI ↔ Push**: Client registers push subscriptions; server sends notifications.
 - **Tenant Theme ↔ UI**: Theme services load per-tenant settings to drive UI styles.
 
 ## Data Model and Storage (High Level)
 - Tenants, users, and roles stored in Supabase.
 - Services, invoices, and appointments stored in relational tables.
 - Founding member metadata and tier access flags stored per tenant or user.
 
 ## Security and Compliance
 - Stripe handles sensitive payment data.
 - Supabase auth and row-level security guard tenant data.
 - Server routes validate and gate access based on session and tier.
 
 ## Current Limitations
 - Some flows are MVP-level and need robustness for edge cases.
 - Admin tools and analytics are expanding but not yet unified.
 - Automation and AI workflows are present but not fully integrated across features.
 
 ## Future Goals
 - Expand AI-powered workflows for marketing, ops, and customer support.
 - Deeper analytics and KPI dashboards for owners.
 - Unified billing and subscription management for all tenant tiers.
 - More automation around onboarding, reviews, and retention.
 - Enhanced multi-location support and advanced scheduling.
 
 ## Deployment Notes
 - Next.js App Router application with server routes.
 - Requires Supabase and Stripe configuration for production.
 - Environment variables should include Supabase keys and Stripe secrets.
