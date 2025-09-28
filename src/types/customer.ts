export interface Customer {
  id: string;
  businessName: string;
  systemName: string;
  email: string;
  phone: string;
  whatsapp?: string | null;
  websiteUrl?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStart: Date;
  subscriptionEndDate?: Date;
  isActive: boolean;
  isRegularClient: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: Date;
  unblockedAt?: Date;
  price?: number; // Monthly price in USD
  customPrice?: number; // Custom monthly price
  useCustomPrice: boolean; // Whether to use custom price instead of plan price
  createdAt: Date;
}

export interface Revenue {
  id: string;
  clientId: string;
  amount: number;
  type: 'subscription' | 'one-time';
  description: string;
  date: Date;
}

export interface Website {
  id: string;
  customerId: string;
  domain: string;
  status: 'active' | 'blocked' | 'maintenance';
  blockedReason?: string;
  blockedAt?: Date;
  unblockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const SUBSCRIPTION_PLANS = [
  { name: 'Basic', price: 0 },      // Price will be set manually in database
  { name: 'Premium', price: 0 },    // Price will be set manually in database
  { name: 'Enterprise', price: 0 }, // Price will be set manually in database
  { name: 'Starter', price: 0 },    // Price will be set manually in database
  { name: 'Standard', price: 0 },   // Price will be set manually in database
  { name: 'Professional', price: 0 } // Price will be set manually in database
] as const;

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number]['name'];