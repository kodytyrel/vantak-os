# Founding 100 Program - Implementation Guide

## Overview
The "Founding 100" program offers the first 100 businesses:
- **Lifetime Annual Fee Waiver** - No annual subscription fees ever
- **Pioneer Badge** - Exclusive gold-bordered Sky Blue badge in dashboard

## Database Schema

### Migration Required
Run `migrations/add_founding_member_fields.sql` to add:
- `is_founding_member` (boolean, default false)
- `founding_member_number` (integer, nullable, unique, 1-100)

## Implementation Details

### 1. Founding Member Banner
- **Location**: Top of landing page (`app/page.tsx`)
- **Component**: `components/FoundingMemberBanner.tsx`
- **API**: `/api/founding-member/availability` - Returns remaining spots
- **Display**: Shows animated banner only if spots available (> 0)

### 2. Automatic Assignment on Signup
- **Location**: `app/signup/page.tsx` - `handleFinalSubmit()`
- **Logic**: After tenant creation, automatically calls `/api/founding-member/assign`
- **Conditions**: 
  - Only assigns if < 100 founding members exist
  - Assigns sequential number (1-100)
  - Sets `is_founding_member = true`

### 3. Pioneer Badge Display
- **Location**: `components/OwnerDashboard.tsx` - Header section
- **Display**: Gold-bordered Sky Blue badge next to business name
- **Text**: "PIONEER #[number]"
- **Condition**: Only visible if `is_founding_member = true`

### 4. Stripe Subscription Schedule

#### For Non-Founding Members:
- **12-Month Free Trial** (Year 1)
- **Annual Fee** starting Month 13 (e.g., $99/year)
- **Recurring** annually

#### For Founding Members:
- **NO subscription created** - Lifetime waiver
- **Metadata flagged** in Stripe account: `skip_annual_fee: 'true'`

### 5. API Endpoints

#### `/api/founding-member/availability` (GET)
Returns:
- `isAvailable`: boolean
- `remainingSpots`: number (0-100)
- `currentFoundingMembers`: number
- `limit`: 100

#### `/api/founding-member/assign` (POST)
- Body: `{ tenantId: string }`
- Assigns founding member status if < 100 members
- Returns: `{ isFoundingMember: true, foundingMemberNumber: number, remainingSpots: number }`

#### `/api/stripe/create-subscription-schedule` (POST)
- Body: `{ tenantId: string, stripeAccountId?: string }`
- **If Founding Member**: Returns success with `isFoundingMember: true`, no subscription created
- **If Non-Founding Member**: Creates subscription with 12-month trial, then annual fee

### 6. Stripe Webhook Integration
- **Event**: `account.updated`
- **Trigger**: When Stripe Connect account onboarding completes
- **Action**: Automatically calls subscription creation API (if not founding member)

### 7. Client-Side Handling
- **Dashboard**: Checks URL params for `onboarding_complete=true`
- **Action**: Triggers subscription creation on return from Stripe onboarding
- **Founding Members**: See success message, no subscription created

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
STRIPE_ANNUAL_FEE_PRICE_ID=YOUR_STRIPE_ANNUAL_FEE_PRICE_ID  # Annual fee price ID (e.g., $99/year)
STRIPE_FREE_TIER_PRICE_ID=YOUR_STRIPE_FREE_TIER_PRICE_ID    # Optional: $0 price for free tier period
```

## Stripe Price Setup

You need to create two prices in Stripe:

1. **Annual Fee Price** (`STRIPE_ANNUAL_FEE_PRICE_ID`):
   - Amount: $99.00 (or your annual fee)
   - Billing: Annual
   - Type: Recurring

2. **Free Tier Price** (Optional - `STRIPE_FREE_TIER_PRICE_ID`):
   - Amount: $0.00
   - For use in subscription schedules (Phase 1)

**OR** use the simpler approach (recommended):
- Create subscription with `trial_period_days: 365` (12 months)
- No need for separate free tier price

## Testing Checklist

- [ ] Banner displays on landing page when spots available
- [ ] Banner hides when 100+ members reached
- [ ] New signups automatically get founding member status if < 100
- [ ] Founding member number assigned sequentially (1-100)
- [ ] Pioneer Badge displays in dashboard for founding members
- [ ] Non-founding members get subscription schedule with 12-month trial
- [ ] Founding members see no subscription created
- [ ] Webhook triggers subscription creation on account.updated event
- [ ] Dashboard triggers subscription on onboarding return
- [ ] Stripe account metadata includes founding member flags

## Usage Flow

1. **User Signs Up** → Founding member status auto-assigned if available
2. **User Enables Payments** → Stripe Connect account created with founding member metadata
3. **Onboarding Completes** → 
   - Webhook: `account.updated` event fires
   - OR Dashboard detects `onboarding_complete=true` in URL
   - Subscription creation API called
   - **Founding Members**: Skip subscription (waiver applied)
   - **Non-Founding Members**: Subscription created with 12-month trial

## Notes

- The subscription schedule uses `trial_period_days: 365` for simplicity
- Annual fee starts automatically after trial period ends
- Founding members are exempt from ALL future annual fees (lifetime)
- The webhook and dashboard both handle subscription creation for redundancy
- If subscription creation fails, it can be retried manually via API

