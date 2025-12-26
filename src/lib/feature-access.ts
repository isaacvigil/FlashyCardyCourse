/**
 * Feature Access Control
 * 
 * This module provides a robust way to check feature access that works with:
 * 1. Clerk Billing (if configured)
 * 2. User public metadata (fallback)
 * 3. Development mode (for testing)
 */

import { auth } from "@clerk/nextjs/server";

export type FeatureName = "ai_flashcard_generation" | "unlimited_decks";
export type PlanName = "free" | "pro";

interface FeatureCheckResult {
  hasAccess: boolean;
  reason?: string;
  method?: "billing" | "metadata" | "dev_mode";
}

/**
 * Check if a user has access to a specific feature
 * 
 * Priority:
 * 1. Development mode (if enabled)
 * 2. Clerk Billing features
 * 3. User public metadata
 * 4. Default to free tier
 */
export async function checkFeatureAccess(
  feature: FeatureName
): Promise<FeatureCheckResult> {
  const { userId, has } = await auth();

  if (!userId) {
    return {
      hasAccess: false,
      reason: "User not authenticated",
    };
  }

  // Development mode: Allow all features if DEV_MODE_ALLOW_ALL_FEATURES is set
  if (process.env.DEV_MODE_ALLOW_ALL_FEATURES === "true") {
    console.log("🔧 DEV MODE: Allowing access to", feature);
    return {
      hasAccess: true,
      reason: "Development mode enabled",
      method: "dev_mode",
    };
  }

  // Try Clerk Billing first (if configured)
  try {
    const hasFeatureViaBilling = has({ feature });
    
    if (hasFeatureViaBilling) {
      return {
        hasAccess: true,
        reason: `Feature granted via Clerk Billing`,
        method: "billing",
      };
    }
  } catch (error) {
    console.log("⚠️ Clerk Billing check failed, trying metadata fallback");
  }

  // Fallback to user metadata (if Clerk Billing not configured)
  try {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as { plan?: PlanName } | undefined;
    const userPlan = metadata?.plan || "free";

    // Feature-to-plan mapping
    const featureMap: Record<FeatureName, PlanName[]> = {
      ai_flashcard_generation: ["pro"],
      unlimited_decks: ["pro"],
    };

    const allowedPlans = featureMap[feature];
    const hasAccess = allowedPlans.includes(userPlan);

    return {
      hasAccess,
      reason: hasAccess
        ? `Feature granted via user plan: ${userPlan}`
        : `Feature requires Pro plan, user is on ${userPlan} plan`,
      method: "metadata",
    };
  } catch (error) {
    console.error("Error checking feature access:", error);
  }

  // Default to no access
  return {
    hasAccess: false,
    reason: "Feature not available on free plan",
  };
}

/**
 * Check if a user is on a specific plan
 */
export async function checkPlan(plan: PlanName): Promise<boolean> {
  const { userId, has } = await auth();

  if (!userId) {
    return false;
  }

  // Development mode
  if (process.env.DEV_MODE_ALLOW_ALL_FEATURES === "true") {
    return plan === "pro"; // Always return true for pro in dev mode
  }

  // Try Clerk Billing first
  try {
    const hasPlanViaBilling = has({ plan });
    if (hasPlanViaBilling) {
      return true;
    }
  } catch (error) {
    console.log("⚠️ Clerk Billing check failed, trying metadata fallback");
  }

  // Fallback to metadata
  try {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as { plan?: PlanName } | undefined;
    return metadata?.plan === plan;
  } catch (error) {
    console.error("Error checking plan:", error);
  }

  return false;
}

/**
 * Get user's current plan
 */
export async function getUserPlan(): Promise<PlanName> {
  const { userId } = await auth();

  if (!userId) {
    return "free";
  }

  // Development mode
  if (process.env.DEV_MODE_ALLOW_ALL_FEATURES === "true") {
    return "pro";
  }

  // Try Clerk Billing
  try {
    const { has } = await auth();
    if (has({ plan: "pro" })) {
      return "pro";
    }
  } catch (error) {
    console.log("⚠️ Clerk Billing check failed, trying metadata fallback");
  }

  // Fallback to metadata
  try {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as { plan?: PlanName } | undefined;
    return metadata?.plan || "free";
  } catch (error) {
    console.error("Error getting user plan:", error);
  }

  return "free";
}

