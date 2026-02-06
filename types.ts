
export enum UserRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export type SubscriptionTier = 'starter' | 'pro' | 'elite' | 'business';

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  timezone: string;
  stripeConnectedId: string;
  tier: SubscriptionTier;
  platform_fee_percent: number;
  monthly_subscription_fee: number;
  is_demo: boolean;
  business_type?: 'service' | 'education' | 'retail' | 'professional' | 'beauty_lifestyle' | 'therapy_health';
  background_image_url?: string | null;
  is_founding_member?: boolean;
  founding_member_number?: number | null;
  seo: {
    title: string;
    description: string;
  };
  features: {
    enableBooking: boolean;
    enableShop: boolean;
    enableGallery: boolean;
  };
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  sku?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  lesson_notes?: string;
  is_recurring?: boolean;
  recurring_pattern?: 'weekly' | 'biweekly' | 'monthly';
  recurring_end_date?: string;
  parent_appointment_id?: string;
  recurring_group_id?: string;
}
