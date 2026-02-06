
import { TenantConfig, Service } from './types';

export const VANTAK = {
  name: "Vantak",
  productName: "VantakOS",
  parentCompany: "KC Dev Co",
  domain: "vantak.app",
  tagline: "We handle the business, so you can focus on the craft.",
  theme: {
    primary: "#0F172A", // Slate 900
    accent: "#38BDF8",  // Sky 400
  },
  fees: {
    starter: 1.5,
    pro: 1.0,
    elite: 0.4,
  }
};

export const MOCK_TENANTS: Record<string, TenantConfig> = {
  'glow-studio': {
    id: 't1',
    slug: 'glow-studio',
    name: 'Glow Spray Tan Studio',
    logoUrl: 'https://picsum.photos/seed/glow/200/200',
    primaryColor: '#db2777', 
    secondaryColor: '#9d174d',
    accentColor: '#fdf2f8',
    fontFamily: 'sans-serif',
    contactEmail: 'hello@glowstudio.com',
    contactPhone: '(555) 123-4567',
    address: '123 Sun Street',
    city: 'Miami',
    state: 'FL',
    timezone: 'America/New_York',
    stripeConnectedId: 'acct_mock_123',
    tier: 'starter',
    platform_fee_percent: VANTAK.fees.starter,
    monthly_subscription_fee: 0,
    is_demo: false,
    seo: {
      title: 'Premium Spray Tanning in Miami | Glow Studio',
      description: 'Get the perfect sun-kissed look without the UV damage. Book your professional spray tan today.'
    },
    features: {
      enableBooking: true,
      enableShop: true,
      enableGallery: true
    }
  },
  'zen-spa': {
    id: 't2',
    slug: 'zen-spa',
    name: 'Zen Wellness Spa',
    logoUrl: 'https://picsum.photos/seed/zen/200/200',
    primaryColor: '#059669', 
    secondaryColor: '#047857',
    accentColor: '#ecfdf5',
    fontFamily: 'serif',
    contactEmail: 'contact@zenspa.com',
    contactPhone: '(555) 987-6543',
    address: '456 Calm Ave',
    city: 'Austin',
    state: 'TX',
    timezone: 'America/Chicago',
    stripeConnectedId: 'acct_mock_456',
    tier: 'pro',
    platform_fee_percent: VANTAK.fees.pro,
    monthly_subscription_fee: 0,
    is_demo: false,
    seo: {
      title: 'Luxury Spa & Massage | Zen Wellness Austin',
      description: 'Relax and rejuvenate with our signature massage and facial treatments.'
    },
    features: {
      enableBooking: true,
      enableShop: false,
      enableGallery: true
    }
  }
};

export const MOCK_SERVICES: Record<string, Service[]> = {
  't1': [
    { id: 's1', tenantId: 't1', name: 'Signature Bronze', description: 'Our most popular full-body tan.', price: 45, durationMinutes: 20 },
    { id: 's2', tenantId: 't1', name: 'Rapid Glow', description: 'Rinse in 2-4 hours. Perfect for last-minute events.', price: 60, durationMinutes: 20 },
  ],
  't2': [
    { id: 's3', tenantId: 't2', name: 'Deep Tissue Massage', description: 'Relieve chronic muscle tension.', price: 120, durationMinutes: 60 },
    { id: 's4', tenantId: 't2', name: 'Hydrating Facial', description: 'Rejuvenate your skin with organic minerals.', price: 85, durationMinutes: 45 },
  ]
};
