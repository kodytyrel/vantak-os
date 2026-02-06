# Tier Gating Guide

## Overview

VantakOS uses a centralized tier gating system to control feature access based on subscription tiers. This ensures consistent feature locking across the entire application.

## Tiers

- **starter** - Free tier ($0/mo, 1.5% fee)
- **pro** - Pro tier ($29/mo, 1.0% fee) - Includes Marketing Engine
- **elite** - Business Suite ($79/mo, 0.4% fee) - Includes Marketing Engine + The Ledger + Push Notifications

## Usage

### 1. Import Tier Gating Utilities

```typescript
import { hasProAccess, hasEliteAccess, hasMarketingEngineAccess, hasBusinessSuiteAccess } from '../lib/tierGating';
```

### 2. Conditional Rendering (Recommended)

Use the utility functions for clean, readable code:

```tsx
// Marketing Engine (Pro/Elite)
{hasMarketingEngineAccess(tenant.tier) && (
  <NewsletterPopup tenantId={tenant.id} />
)}

// Business Suite (Elite only)
{hasBusinessSuiteAccess(tenant.tier) && (
  <TheLedger tenant={tenant} />
)}

// Simple tier check
{hasProAccess(tenant.tier) && (
  <button>Generate AI Newsletter</button>
)}
```

### 3. Using the TierGate Component

For more complex scenarios, use the `TierGate` component:

```tsx
import { TierGate } from '../components/TierGate';

<TierGate tier={tenant.tier} requiredTier="pro">
  <MarketingManager tenant={tenant} />
</TierGate>

// With upgrade prompt
<TierGate 
  tier={tenant.tier} 
  requiredTier="elite"
  showUpgradePrompt
  fallback={<UpgradePrompt message="Upgrade to Business Suite to unlock The Ledger" />}
>
  <TheLedger tenant={tenant} />
</TierGate>
```

### 4. Direct Tier Checks

For simple inline checks:

```tsx
{tenant.tier === 'elite' && (
  <ExpenseTracker tenant={tenant} />
)}

{tenant.tier === 'pro' || tenant.tier === 'elite' ? (
  <NewsletterPopup />
) : null}
```

**Note:** While direct checks work, using the utility functions is preferred for consistency and easier refactoring.

## Feature Mapping

| Feature | Required Tier | Utility Function |
|---------|--------------|------------------|
| Basic Booking | starter | Always available |
| Newsletter Collection | pro | `hasMarketingEngineAccess()` |
| AI Newsletter Generator | pro | `hasMarketingEngineAccess()` |
| Marketing Engine Tab | pro | `hasMarketingEngineAccess()` |
| Expense Tracker | elite | `hasBusinessSuiteAccess()` |
| Mileage Tracker | elite | `hasBusinessSuiteAccess()` |
| The Ledger | elite | `hasBusinessSuiteAccess()` |
| Push Notifications | elite | `hasBusinessSuiteAccess()` |

## API Route Gating

For API routes, check tier before processing:

```typescript
// app/api/marketing/generate-newsletter/route.ts
export async function POST(req: NextRequest) {
  const { tenantId } = await req.json();
  
  // Fetch tenant to check tier
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('tier')
    .eq('id', tenantId)
    .single();

  if (!hasMarketingEngineAccess(tenant.tier)) {
    return NextResponse.json(
      { error: 'Marketing Engine requires Pro tier or higher' },
      { status: 403 }
    );
  }

  // Continue with feature logic...
}
```

## Upgrade Messages

Get upgrade messages for locked features:

```typescript
import { getUpgradeMessage } from '../lib/tierGating';

const message = getUpgradeMessage('pro');
// Returns: "Upgrade to Pro ($29/mo) to unlock this feature"
```

## Best Practices

1. **Always gate at the component level** - Hide features completely for users without access
2. **Gate in API routes** - Never trust client-side gating alone
3. **Use utility functions** - Don't hardcode tier checks (`tenant.tier === 'pro' || tenant.tier === 'elite'`)
4. **Provide upgrade prompts** - Show clear upgrade paths for locked features
5. **Test all tiers** - Verify features appear/disappear correctly for each tier

## Examples

### Example 1: Conditional Button

```tsx
import { hasMarketingEngineAccess } from '../lib/tierGating';

<button
  onClick={handleGenerateNewsletter}
  disabled={!hasMarketingEngineAccess(tenant.tier)}
  className={hasMarketingEngineAccess(tenant.tier) ? 'bg-brand-primary' : 'bg-gray-400'}
>
  {hasMarketingEngineAccess(tenant.tier) 
    ? 'Generate AI Newsletter' 
    : 'Upgrade to Pro'}
</button>
```

### Example 2: Menu Item Gating

```tsx
const menuItems = [
  { id: 'overview', label: 'Command Center', icon: '...' },
  { id: 'schedule', label: 'Schedule', icon: '...' },
  ...(hasMarketingEngineAccess(tenant.tier) ? [
    { id: 'marketing', label: 'Marketing Engine', icon: '...' }
  ] : []),
  ...(hasBusinessSuiteAccess(tenant.tier) ? [
    { id: 'taxvault', label: 'The Ledger', icon: '...' }
  ] : []),
];
```

### Example 3: Feature Flag in Settings

```tsx
<div className="settings-section">
  <h3>Marketing Features</h3>
  {hasMarketingEngineAccess(tenant.tier) ? (
    <NewsletterSettings />
  ) : (
    <UpgradePrompt 
      feature="Marketing Engine"
      tier="pro"
      price="$29/mo"
    />
  )}
</div>
```

## Migration Checklist

When adding new features:

- [ ] Determine required tier
- [ ] Add conditional rendering using utility function
- [ ] Gate API routes if applicable
- [ ] Test with all tier levels
- [ ] Add upgrade prompt for locked state
- [ ] Update this documentation


