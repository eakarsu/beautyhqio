// Commission calculation utilities for marketplace lead generation

import { SubscriptionPlan } from "@prisma/client";

// Commission rates by subscription plan
export const COMMISSION_RATES: Record<SubscriptionPlan, number> = {
  STARTER: 9,   // 9% - Free tier
  GROWTH: 0,    // 0% - $49/month (no commission)
  PRO: 0,       // 0% - $149/month (no commission)
};

// Subscription pricing
export const SUBSCRIPTION_PRICING: Record<SubscriptionPlan, number> = {
  STARTER: 0,     // Free
  GROWTH: 49,     // $49/month
  PRO: 149,       // $149/month
};

export interface CommissionCalculation {
  appointmentTotal: number;
  commissionRate: number;
  commissionAmount: number;
  netToSalon: number;
}

/**
 * Calculate commission for a marketplace lead
 * @param appointmentTotal - Total value of the appointment
 * @param plan - Subscription plan of the business
 * @param customRate - Optional custom commission rate override
 */
export function calculateCommission(
  appointmentTotal: number,
  plan: SubscriptionPlan,
  customRate?: number
): CommissionCalculation {
  const rate = customRate ?? COMMISSION_RATES[plan];
  const commissionAmount = Math.round((appointmentTotal * rate) / 100 * 100) / 100;
  const netToSalon = Math.round((appointmentTotal - commissionAmount) * 100) / 100;

  return {
    appointmentTotal,
    commissionRate: rate,
    commissionAmount,
    netToSalon,
  };
}

/**
 * Get commission rate for a subscription plan
 */
export function getCommissionRate(plan: SubscriptionPlan): number {
  return COMMISSION_RATES[plan];
}

/**
 * Get monthly price for a subscription plan
 */
export function getSubscriptionPrice(plan: SubscriptionPlan): number {
  return SUBSCRIPTION_PRICING[plan];
}

/**
 * Calculate total commissions for a list of appointments
 */
export function calculateTotalCommission(
  appointments: { total: number }[],
  plan: SubscriptionPlan
): number {
  const rate = COMMISSION_RATES[plan];
  return appointments.reduce((sum, apt) => {
    return sum + Math.round((apt.total * rate) / 100 * 100) / 100;
  }, 0);
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

/**
 * Calculate savings for upgrading to a higher tier
 */
export function calculateUpgradeSavings(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan,
  monthlyLeadRevenue: number
): {
  currentCommission: number;
  newCommission: number;
  monthlySavings: number;
  newSubscriptionCost: number;
  netMonthlySavings: number;
} {
  const currentRate = COMMISSION_RATES[currentPlan];
  const newRate = COMMISSION_RATES[targetPlan];
  const newSubscriptionCost = SUBSCRIPTION_PRICING[targetPlan];

  const currentCommission = (monthlyLeadRevenue * currentRate) / 100;
  const newCommission = (monthlyLeadRevenue * newRate) / 100;
  const monthlySavings = currentCommission - newCommission;
  const netMonthlySavings = monthlySavings - newSubscriptionCost;

  return {
    currentCommission: Math.round(currentCommission * 100) / 100,
    newCommission: Math.round(newCommission * 100) / 100,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    newSubscriptionCost,
    netMonthlySavings: Math.round(netMonthlySavings * 100) / 100,
  };
}

/**
 * Determine if upgrading makes financial sense
 */
export function shouldUpgrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan,
  monthlyLeadRevenue: number
): boolean {
  const savings = calculateUpgradeSavings(currentPlan, targetPlan, monthlyLeadRevenue);
  return savings.netMonthlySavings > 0;
}

/**
 * Get recommended plan based on monthly lead revenue
 */
export function getRecommendedPlan(monthlyLeadRevenue: number): SubscriptionPlan {
  // STARTER (9%): $0 subscription, 9% commission
  // GROWTH (0%): $49 subscription, no commission
  // PRO (0%): $149 subscription, no commission

  // Breakeven for GROWTH: $49 / 9% = $49 / 0.09 = $544.44/month
  // PRO is for high-volume salons wanting premium features

  if (monthlyLeadRevenue >= 544.44) {
    return "GROWTH";
  } else {
    return "STARTER";
  }
}
