'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  onboardingProgress,
  onboardingAchievements,
  onboardingTutorials,
  type OnboardingProgress,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getOnboardingProgress(userId: string) {
  const progress = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.userId, userId),
  });

  if (!progress) {
    // Create initial progress record
    const [newProgress] = await db
      .insert(onboardingProgress)
      .values({ userId })
      .returning();
    return newProgress;
  }

  return progress;
}

export async function updateOnboardingProgress(
  userId: string,
  updates: Partial<OnboardingProgress>
) {
  await db
    .update(onboardingProgress)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(onboardingProgress.userId, userId));

  // Check if phase should advance
  const progress = await getOnboardingProgress(userId);

  // Phase 1 → 2: Essential setup complete
  if (
    progress.emailConnected &&
    progress.signatureConfigured &&
    progress.profileCompleted &&
    progress.currentPhase === 1
  ) {
    await db
      .update(onboardingProgress)
      .set({ currentPhase: 2 })
      .where(eq(onboardingProgress.userId, userId));
  }

  // Phase 2 → 3: Quick wins complete
  if (
    progress.aiReplyTried &&
    progress.smartInboxViewed &&
    progress.keyboardShortcutsLearned &&
    progress.currentPhase === 2
  ) {
    await db
      .update(onboardingProgress)
      .set({ currentPhase: 3 })
      .where(eq(onboardingProgress.userId, userId));
  }

  // All phases complete
  if (
    progress.contactsExplored &&
    progress.automationCreated &&
    progress.voiceFeatureTried &&
    progress.chatbotUsed &&
    !progress.onboardingCompleted
  ) {
    await db
      .update(onboardingProgress)
      .set({ onboardingCompleted: true, completedAt: new Date() })
      .where(eq(onboardingProgress.userId, userId));
  }
}

export async function unlockAchievement(
  userId: string,
  achievementId: string,
  achievementName: string,
  achievementDescription: string,
  category: string
) {
  // Check if already unlocked
  const existing = await db.query.onboardingAchievements.findFirst({
    where: and(
      eq(onboardingAchievements.userId, userId),
      eq(onboardingAchievements.achievementId, achievementId)
    ),
  });

  if (existing) return existing;

  const [achievement] = await db
    .insert(onboardingAchievements)
    .values({
      userId,
      achievementId,
      achievementName,
      achievementDescription,
      category,
    })
    .returning();

  return achievement;
}

export async function startTutorial(userId: string, tutorialId: string) {
  const [tutorial] = await db
    .insert(onboardingTutorials)
    .values({
      userId,
      tutorialId,
      started: true,
      startedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [onboardingTutorials.userId, onboardingTutorials.tutorialId],
      set: { started: true, startedAt: new Date() },
    })
    .returning();

  return tutorial;
}

export async function completeTutorial(
  userId: string,
  tutorialId: string,
  timeSpentSeconds: number
) {
  await db
    .update(onboardingTutorials)
    .set({
      completed: true,
      completedAt: new Date(),
      timeSpentSeconds,
    })
    .where(
      and(
        eq(onboardingTutorials.userId, userId),
        eq(onboardingTutorials.tutorialId, tutorialId)
      )
    );
}

export async function dismissOnboarding(userId: string) {
  await db
    .update(onboardingProgress)
    .set({ dismissedOnboarding: true })
    .where(eq(onboardingProgress.userId, userId));
}

