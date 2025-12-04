"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { verifyRecaptcha } from "@/actions/recaptcha";

export type GetProfileParams = {
  walletAddress: string;
};

export async function getProfile(params: GetProfileParams) {
  const { walletAddress } = params;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.walletAddress, walletAddress));

  return profile || null;
}

export type SaveProfileParams = {
  walletAddress: string;
  username?: string | null;
  bio?: string | null;
  email?: string | null;
  marketingOptIn?: boolean;
  recaptchaToken?: string;
};

export type SaveProfileResult =
  | { success: true; data: typeof profiles.$inferSelect }
  | { success: false; error: string };

export async function saveProfile(
  params: SaveProfileParams
): Promise<SaveProfileResult> {
  const {
    walletAddress,
    username,
    bio,
    email,
    marketingOptIn,
    recaptchaToken,
  } = params;

  try {
    // Verify reCAPTCHA if token is provided
    if (recaptchaToken) {
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        return {
          success: false,
          error: "reCAPTCHA verification failed. Please try again.",
        };
      }
    }

    // Check if profile exists
    const existing = await getProfile({ walletAddress });

    if (existing) {
      // Update existing profile
      const [updated] = await db
        .update(profiles)
        .set({
          username,
          bio,
          email,
          marketingOptIn: marketingOptIn ?? false,
          updatedAt: new Date(),
        })
        .where(eq(profiles.walletAddress, walletAddress))
        .returning();

      return { success: true, data: updated };
    } else {
      // Create new profile
      const [created] = await db
        .insert(profiles)
        .values({
          walletAddress,
          username,
          bio,
          email,
          marketingOptIn: marketingOptIn ?? false,
        })
        .returning();

      return { success: true, data: created };
    }
  } catch (error: any) {
    console.error("Error saving profile:", error);
    return {
      success: false,
      error: error.message || "Failed to save profile",
    };
  }
}
