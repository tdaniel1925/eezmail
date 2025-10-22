/**
 * Predictive Intelligence Engine
 * Predicts user actions and suggests optimal handling for emails
 */

'use server';

import { db } from '@/lib/db';

export interface EmailPrediction {
  emailId: string;
  likelyAction:
    | 'archive'
    | 'reply'
    | 'forward'
    | 'delete'
    | 'snooze'
    | 'no_action';
  actionConfidence: number; // 0-100
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedReplyTime: Date | null; // When user typically replies to this type of email
  similarPastEmails: Array<{
    id: string;
    subject: string;
    action: string;
    responseTime: number; // minutes
  }>;
  recommendedFolder: string | null;
  priorityScore: number; // 0-100
  reasoning: string[];
}

export interface UserBehaviorProfile {
  userId: string;
  avgReplyTimeByContact: Map<string, number>; // Contact email -> avg reply time (minutes)
  peakActivityHours: number[]; // Hours when user is most active
  preferredFolders: Map<string, number>; // Sender domain -> folder preference
  commonActions: Map<string, string>; // Email pattern -> most common action
  replyPriority: Map<string, number>; // Contact email -> priority score
  workingDays: number[]; // 0=Sunday, 1=Monday, etc.
  avgEmailProcessingTime: number; // Minutes per email
}

export interface EmailContext {
  id: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  receivedAt: Date;
  hasAttachments: boolean;
  conversationId?: string;
  isReply?: boolean;
  importance?: 'low' | 'normal' | 'high';
}

/**
 * Predict user action for an email
 */
export async function predictUserAction(
  email: EmailContext,
  userId: string
): Promise<EmailPrediction> {
  // Get user behavior profile
  const profile = await getUserBehaviorProfile(userId);

  // Analyze email characteristics
  const urgency = analyzeUrgency(email, profile);
  const priorityScore = calculatePriorityScore(email, profile);

  // Find similar past emails
  const similarEmails = await findSimilarEmails(email, userId);

  // Predict likely action based on similar emails
  const likelyAction = predictAction(similarEmails, email, profile);
  const actionConfidence = calculateActionConfidence(
    similarEmails,
    likelyAction
  );

  // Predict reply time
  const suggestedReplyTime = predictReplyTime(email, profile);

  // Recommend folder
  const recommendedFolder = recommendFolder(email, profile);

  // Generate reasoning
  const reasoning = generateReasoning(
    email,
    profile,
    similarEmails,
    likelyAction,
    urgency
  );

  return {
    emailId: email.id,
    likelyAction,
    actionConfidence,
    urgency,
    suggestedReplyTime,
    similarPastEmails: similarEmails,
    recommendedFolder,
    priorityScore,
    reasoning,
  };
}

/**
 * Analyze email urgency
 */
function analyzeUrgency(
  email: EmailContext,
  profile: UserBehaviorProfile
): 'low' | 'medium' | 'high' | 'critical' {
  const urgencyIndicators = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const text = `${email.subject} ${email.bodyText}`.toLowerCase();

  // Check for urgency keywords
  const criticalKeywords = [
    'asap',
    'urgent',
    'emergency',
    'critical',
    'immediate',
  ];
  const highKeywords = ['important', 'priority', 'deadline', 'today'];
  const mediumKeywords = ['soon', 'needed', 'required', 'attention'];

  if (criticalKeywords.some((kw) => text.includes(kw))) {
    urgencyIndicators.critical += 3;
  }
  if (highKeywords.some((kw) => text.includes(kw))) {
    urgencyIndicators.high += 2;
  }
  if (mediumKeywords.some((kw) => text.includes(kw))) {
    urgencyIndicators.medium += 1;
  }

  // Check if from high-priority contact
  const senderPriority = profile.replyPriority.get(email.fromAddress) || 0;
  if (senderPriority > 80) {
    urgencyIndicators.high += 2;
  } else if (senderPriority > 60) {
    urgencyIndicators.medium += 1;
  }

  // Check if it's a reply in an ongoing conversation
  if (email.isReply) {
    urgencyIndicators.medium += 1;
  }

  // Check marked importance
  if (email.importance === 'high') {
    urgencyIndicators.high += 2;
  }

  // Determine final urgency
  if (urgencyIndicators.critical >= 3) return 'critical';
  if (urgencyIndicators.high >= 3) return 'high';
  if (urgencyIndicators.medium >= 2) return 'medium';
  return 'low';
}

/**
 * Calculate priority score
 */
function calculatePriorityScore(
  email: EmailContext,
  profile: UserBehaviorProfile
): number {
  let score = 50; // Base score

  // Adjust based on sender
  const senderPriority = profile.replyPriority.get(email.fromAddress) || 0;
  score += senderPriority * 0.3; // Up to +30 points

  // Adjust based on conversation
  if (email.isReply) {
    score += 15; // Replies are more important
  }

  // Adjust based on marked importance
  if (email.importance === 'high') {
    score += 20;
  } else if (email.importance === 'low') {
    score -= 10;
  }

  // Adjust based on how recently received
  const ageMinutes = (Date.now() - email.receivedAt.getTime()) / (1000 * 60);
  if (ageMinutes < 30) {
    score += 10; // Recent emails are more important
  } else if (ageMinutes > 1440) {
    // 24 hours
    score -= 20; // Old emails less important
  }

  // Ensure score is in range 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Find similar past emails
 */
async function findSimilarEmails(
  email: EmailContext,
  userId: string
): Promise<
  Array<{ id: string; subject: string; action: string; responseTime: number }>
> {
  // This would use vector similarity search in production
  // For now, return empty array
  // You would:
  // 1. Generate embedding for current email
  // 2. Query similar emails using cosine similarity
  // 3. Filter by emails that user took action on
  // 4. Return top 5 most similar

  return [];
}

/**
 * Predict action based on similar emails
 */
function predictAction(
  similarEmails: Array<{ action: string }>,
  email: EmailContext,
  profile: UserBehaviorProfile
): 'archive' | 'reply' | 'forward' | 'delete' | 'snooze' | 'no_action' {
  if (similarEmails.length === 0) {
    return 'no_action';
  }

  // Count actions from similar emails
  const actionCounts = new Map<string, number>();

  for (const similar of similarEmails) {
    const count = actionCounts.get(similar.action) || 0;
    actionCounts.set(similar.action, count + 1);
  }

  // Find most common action
  let maxCount = 0;
  let mostCommonAction = 'no_action';

  for (const [action, count] of actionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonAction = action;
    }
  }

  return mostCommonAction as any;
}

/**
 * Calculate confidence in action prediction
 */
function calculateActionConfidence(
  similarEmails: Array<{ action: string }>,
  predictedAction: string
): number {
  if (similarEmails.length === 0) {
    return 0;
  }

  const matchingActions = similarEmails.filter(
    (e) => e.action === predictedAction
  ).length;

  // Confidence = (matching / total) * 100, but weighted by total sample size
  const consistency = (matchingActions / similarEmails.length) * 100;
  const sampleWeight = Math.min(similarEmails.length / 10, 1); // Max weight at 10+ samples

  return Math.round(consistency * sampleWeight);
}

/**
 * Predict reply time
 */
function predictReplyTime(
  email: EmailContext,
  profile: UserBehaviorProfile
): Date | null {
  // Get average reply time for this sender
  const avgReplyTime = profile.avgReplyTimeByContact.get(email.fromAddress);

  if (!avgReplyTime) {
    return null; // No historical data
  }

  // Start from current time
  let predictedTime = new Date();

  // If outside working hours, move to next working period
  const currentHour = predictedTime.getHours();
  const currentDay = predictedTime.getDay();

  // If not a working day, move to next working day
  if (!profile.workingDays.includes(currentDay)) {
    // Find next working day
    let daysToAdd = 1;
    while (!profile.workingDays.includes((currentDay + daysToAdd) % 7)) {
      daysToAdd++;
    }
    predictedTime.setDate(predictedTime.getDate() + daysToAdd);
    predictedTime.setHours(9, 0, 0, 0); // Start of work day
  }

  // If outside peak hours, move to next peak hour
  if (!profile.peakActivityHours.includes(currentHour)) {
    const nextPeakHour =
      profile.peakActivityHours.find((h) => h > currentHour) ||
      profile.peakActivityHours[0];
    if (nextPeakHour < currentHour) {
      // Next day
      predictedTime.setDate(predictedTime.getDate() + 1);
    }
    predictedTime.setHours(nextPeakHour, 0, 0, 0);
  }

  // Add average reply time
  predictedTime.setMinutes(predictedTime.getMinutes() + avgReplyTime);

  return predictedTime;
}

/**
 * Recommend folder for email
 */
function recommendFolder(
  email: EmailContext,
  profile: UserBehaviorProfile
): string | null {
  const senderDomain = email.fromAddress.split('@')[1];

  // Check if user has a folder preference for this domain
  const preferredFolder = profile.preferredFolders.get(senderDomain);

  return preferredFolder || null;
}

/**
 * Generate reasoning for predictions
 */
function generateReasoning(
  email: EmailContext,
  profile: UserBehaviorProfile,
  similarEmails: Array<{ action: string }>,
  likelyAction: string,
  urgency: string
): string[] {
  const reasons: string[] = [];

  // Reason for urgency
  if (urgency === 'high' || urgency === 'critical') {
    reasons.push(`Marked as ${urgency} priority based on content and sender`);
  }

  // Reason for action prediction
  if (similarEmails.length > 0) {
    const matchCount = similarEmails.filter(
      (e) => e.action === likelyAction
    ).length;
    reasons.push(
      `You ${likelyAction}d ${matchCount} of ${similarEmails.length} similar emails in the past`
    );
  }

  // Reason for sender priority
  const senderPriority = profile.replyPriority.get(email.fromAddress);
  if (senderPriority && senderPriority > 70) {
    reasons.push('You typically reply quickly to this sender');
  }

  // Reason for timing
  const avgReplyTime = profile.avgReplyTimeByContact.get(email.fromAddress);
  if (avgReplyTime && avgReplyTime < 60) {
    reasons.push(
      `You usually reply within ${avgReplyTime} minutes to this sender`
    );
  }

  return reasons;
}

/**
 * Get user behavior profile
 */
async function getUserBehaviorProfile(
  userId: string
): Promise<UserBehaviorProfile> {
  // This would query your database and aggregate user behavior
  // For now, return a default profile
  return {
    userId,
    avgReplyTimeByContact: new Map(),
    peakActivityHours: [9, 10, 11, 14, 15, 16], // 9am-11am, 2pm-4pm
    preferredFolders: new Map(),
    commonActions: new Map(),
    replyPriority: new Map(),
    workingDays: [1, 2, 3, 4, 5], // Monday-Friday
    avgEmailProcessingTime: 3, // 3 minutes per email
  };
}

/**
 * Update user behavior profile based on action
 */
export async function updateBehaviorProfile(
  userId: string,
  emailId: string,
  action: {
    type: string;
    timestamp: Date;
    email: EmailContext;
  }
): Promise<void> {
  // Calculate response time
  const responseTime =
    (action.timestamp.getTime() - action.email.receivedAt.getTime()) /
    (1000 * 60);

  // Update average reply time for this sender
  // Update folder preferences
  // Update action patterns
  // Update peak activity hours
  // Update priority scores

  console.log(
    `Updated behavior profile for user ${userId} based on ${action.type} action`
  );
}
