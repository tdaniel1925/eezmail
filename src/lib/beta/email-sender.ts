'use server';

import { Resend } from 'resend';
import { db } from '@/lib/db';
import { users, betaEmailsSent } from '@/db/schema';
import { eq } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'beta@easemail.app';
const FROM_NAME = 'EaseMail Beta Team';

/**
 * Generate beta welcome email HTML
 */
function generateWelcomeEmailHTML(params: {
  firstName: string;
  username: string;
  tempPassword: string;
  smsCredits: number;
  aiCredits: number;
  expirationDays: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF4C5A 0%, #FF6B7A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .credential-box { background: white; border-left: 4px solid #FF4C5A; padding: 15px; margin: 20px 0; }
    .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .button { display: inline-block; background: #FF4C5A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to EaseMail Beta!</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.firstName},</p>
    
    <p><strong>Congratulations!</strong> You've been selected to join the exclusive EaseMail Beta Program.</p>
    
    <div class="benefits">
      <h3>🌟 Your Beta Benefits:</h3>
      <div class="benefit-item">✅ Full email management</div>
      <div class="benefit-item">✅ ${params.smsCredits} free SMS messages per month</div>
      <div class="benefit-item">✅ ${params.aiCredits} AI-powered actions per month</div>
      <div class="benefit-item">✅ Priority beta support</div>
      <div class="benefit-item">✅ Early access to new features</div>
      <div class="benefit-item">✅ ${params.expirationDays}-day beta period</div>
    </div>
    
    <div class="credential-box">
      <h3>📱 Your Login Credentials:</h3>
      <p><strong>Website:</strong> https://easemail.app/login</p>
      <p><strong>Username:</strong> ${params.username}</p>
      <p><strong>Temporary Password:</strong> ${params.tempPassword}</p>
      <p style="color: #FF4C5A; font-size: 14px;">🔒 Please change your password after first login</p>
    </div>
    
    <h3>🚀 Get Started:</h3>
    <ol>
      <li>Click the button below to log in</li>
      <li>Change your password</li>
      <li>Connect your email account (Microsoft/Google/IMAP)</li>
      <li>Start managing your inbox with AI!</li>
    </ol>
    
    <center>
      <a href="https://easemail.app/login" class="button">Log In Now →</a>
    </center>
    
    <p style="margin-top: 30px;">We'd love to hear your thoughts! Your feedback helps us build a better product for everyone.</p>
    
    <p>Questions? Just reply to this email - we're here to help! 💬</p>
    
    <p>Welcome aboard! 🚀</p>
    <p><strong>The EaseMail Team</strong></p>
  </div>
  
  <div class="footer">
    <p>EaseMail Beta Program | https://easemail.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate credits low email HTML
 */
function generateCreditsLowEmailHTML(params: {
  firstName: string;
  creditType: string;
  remaining: number;
  limit: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FFA500; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning-box { background: #FFF3CD; border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #FF4C5A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Your Beta Credits are Running Low</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.firstName},</p>
    
    <div class="warning-box">
      <h3>📊 Credit Usage Alert</h3>
      <p><strong>${params.creditType} Credits:</strong> ${params.remaining} out of ${params.limit} remaining</p>
      <p>You've used <strong>${Math.round(((params.limit - params.remaining) / params.limit) * 100)}%</strong> of your monthly allocation.</p>
    </div>
    
    <p>Your credits will automatically reset next month, or you can upgrade to Premium for unlimited access.</p>
    
    <h3>🚀 Why Upgrade to Premium?</h3>
    <ul>
      <li>✅ Unlimited SMS messages</li>
      <li>✅ Unlimited AI-powered features</li>
      <li>✅ Priority support</li>
      <li>✅ Advanced features</li>
      <li>✅ No expiration date</li>
    </ul>
    
    <center>
      <a href="https://easemail.app/dashboard/plans" class="button">Upgrade to Premium →</a>
    </center>
    
    <p style="margin-top: 30px;">Questions? Reply to this email anytime!</p>
    
    <p><strong>The EaseMail Team</strong></p>
  </div>
  
  <div class="footer">
    <p>EaseMail Beta Program | https://easemail.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate credits exhausted email HTML
 */
function generateCreditsExhaustedEmailHTML(params: {
  firstName: string;
  creditType: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: #F8D7DA; border-left: 4px solid #DC3545; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #FF4C5A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚫 Your Beta Credits are Exhausted</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.firstName},</p>
    
    <div class="alert-box">
      <h3>Credits Depleted</h3>
      <p>You've used all your <strong>${params.creditType}</strong> credits for this month.</p>
    </div>
    
    <p>Don't worry! Your credits will automatically reset next month. In the meantime, you can upgrade to Premium for unlimited access.</p>
    
    <h3>🎉 Upgrade to Premium Today</h3>
    <ul>
      <li>✅ Unlimited SMS messages</li>
      <li>✅ Unlimited AI features</li>
      <li>✅ Never worry about credits again</li>
      <li>✅ Support independent development</li>
    </ul>
    
    <center>
      <a href="https://easemail.app/dashboard/plans" class="button">Upgrade Now →</a>
    </center>
    
    <p style="margin-top: 30px;">Thank you for being part of our beta program! 🙏</p>
    
    <p><strong>The EaseMail Team</strong></p>
  </div>
  
  <div class="footer">
    <p>EaseMail Beta Program | https://easemail.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate weekly update email HTML
 */
function generateWeeklyUpdateEmailHTML(params: {
  firstName: string;
  updates: string[];
}): string {
  const updatesList = params.updates.map((update) => `<li>${update}</li>`).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .updates-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .updates-box li { padding: 10px 0; border-bottom: 1px solid #eee; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📰 This Week at EaseMail</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.firstName},</p>
    
    <p>We've been busy this week! Here's what's new in your EaseMail Beta:</p>
    
    <div class="updates-box">
      <h3>✨ New Features & Improvements:</h3>
      <ul>${updatesList}</ul>
    </div>
    
    <p>Have feedback on these updates? We'd love to hear from you! Your input directly shapes our product roadmap.</p>
    
    <center>
      <a href="https://easemail.app/dashboard" class="button">Check It Out →</a>
    </center>
    
    <p style="margin-top: 30px;">Thank you for being an amazing beta tester! 🌟</p>
    
    <p><strong>The EaseMail Team</strong></p>
  </div>
  
  <div class="footer">
    <p>EaseMail Beta Program | https://easemail.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate feedback thanks email HTML
 */
function generateFeedbackThanksEmailHTML(params: {
  firstName: string;
  feedbackTitle: string;
  actionItemCreated: boolean;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .feedback-box { background: white; border-left: 4px solid #38ef7d; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🙏 Thank You for Your Feedback!</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.firstName},</p>
    
    <p>We received your feedback and wanted to say <strong>thank you!</strong> Your input is invaluable in helping us build a better product.</p>
    
    <div class="feedback-box">
      <h3>Your Feedback:</h3>
      <p><em>"${params.feedbackTitle}"</em></p>
      ${params.actionItemCreated ? '<p style="color: #38ef7d;">✅ We\'ve created an action item from your feedback and added it to our roadmap!</p>' : '<p>Our team is reviewing your feedback and will consider it for future updates.</p>'}
    </div>
    
    <p>Your contribution helps make EaseMail better for everyone. We truly appreciate you taking the time to share your thoughts!</p>
    
    <p>Keep the feedback coming - we're always listening! 👂</p>
    
    <p><strong>The EaseMail Team</strong></p>
  </div>
  
  <div class="footer">
    <p>EaseMail Beta Program | https://easemail.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate beta graduation email HTML
 */
function generateBetaGraduationEmailHTML(params: {
  firstName: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .benefits-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to EaseMail Premium!</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.firstName},</p>
    
    <p><strong>Congratulations!</strong> You've graduated from our Beta Program and are now a Premium member.</p>
    
    <div class="benefits-box">
      <h3>🚀 Your New Premium Benefits:</h3>
      <div class="benefit-item">✅ Unlimited SMS messages</div>
      <div class="benefit-item">✅ Unlimited AI-powered features</div>
      <div class="benefit-item">✅ Priority customer support</div>
      <div class="benefit-item">✅ Advanced analytics</div>
      <div class="benefit-item">✅ Early access to new features</div>
      <div class="benefit-item">✅ No expiration date</div>
    </div>
    
    <p>Thank you for being an incredible beta tester! Your feedback has been instrumental in shaping EaseMail into what it is today.</p>
    
    <p>We're excited to continue this journey with you as a Premium member! 🌟</p>
    
    <center>
      <a href="https://easemail.app/dashboard" class="button">Explore Premium Features →</a>
    </center>
    
    <p style="margin-top: 30px;">Questions about your Premium account? We're here to help!</p>
    
    <p>With gratitude,<br><strong>The EaseMail Team</strong></p>
  </div>
  
  <div class="footer">
    <p>EaseMail | https://easemail.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send beta welcome email with credentials
 */
export async function sendBetaWelcomeEmail(
  userId: string,
  username: string,
  tempPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const emailHtml = generateWelcomeEmailHTML({
      firstName: user.firstName || 'there',
      username,
      tempPassword,
      smsCredits: 50,
      aiCredits: 100,
      expirationDays: 90,
    });

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: '🎉 Welcome to EaseMail Beta Program!',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send beta welcome email:', error);
      return { success: false, error: error.message };
    }

    // Track email sent
    await db.insert(betaEmailsSent).values({
      userId,
      templateName: 'beta_welcome',
      resendId: data?.id,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending beta welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send credits low warning email
 */
export async function sendBetaCreditsLowEmail(
  userId: string,
  creditType: 'sms' | 'ai',
  remaining: number,
  limit: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if we already sent this email recently (within 7 days)
    const recentEmails = await db
      .select()
      .from(betaEmailsSent)
      .where(eq(betaEmailsSent.userId, userId));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLowEmail = recentEmails.find(
      (e) =>
        e.templateName === `credits_low_${creditType}` &&
        new Date(e.sentAt) > sevenDaysAgo
    );

    if (recentLowEmail) {
      return { success: false, error: 'Already sent recently' };
    }

    const emailHtml = generateCreditsLowEmailHTML({
      firstName: user.firstName || 'there',
      creditType: creditType === 'sms' ? 'SMS' : 'AI',
      remaining,
      limit,
    });

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: `⚠️ Your Beta ${creditType.toUpperCase()} Credits are Running Low`,
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await db.insert(betaEmailsSent).values({
      userId,
      templateName: `credits_low_${creditType}`,
      resendId: data?.id,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send credits exhausted email
 */
export async function sendBetaCreditsExhaustedEmail(
  userId: string,
  creditType: 'sms' | 'ai'
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const emailHtml = generateCreditsExhaustedEmailHTML({
      firstName: user.firstName || 'there',
      creditType: creditType === 'sms' ? 'SMS' : 'AI',
    });

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: `🚫 Your Beta ${creditType.toUpperCase()} Credits are Exhausted`,
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await db.insert(betaEmailsSent).values({
      userId,
      templateName: `credits_exhausted_${creditType}`,
      resendId: data?.id,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send weekly update email
 */
export async function sendWeeklyUpdateEmail(
  userId: string,
  updates: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const emailHtml = generateWeeklyUpdateEmailHTML({
      firstName: user.firstName || 'there',
      updates,
    });

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: '📰 EaseMail Beta Update - New Features This Week',
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await db.insert(betaEmailsSent).values({
      userId,
      templateName: 'weekly_update',
      resendId: data?.id,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send feedback thanks email
 */
export async function sendFeedbackThanksEmail(
  userId: string,
  feedbackTitle: string,
  actionItemCreated: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const emailHtml = generateFeedbackThanksEmailHTML({
      firstName: user.firstName || 'there',
      feedbackTitle,
      actionItemCreated,
    });

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: '🙏 Thank You for Your Feedback!',
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await db.insert(betaEmailsSent).values({
      userId,
      templateName: 'feedback_thanks',
      resendId: data?.id,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send beta graduation email (when they upgrade)
 */
export async function sendBetaGraduationEmail(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const emailHtml = generateBetaGraduationEmailHTML({
      firstName: user.firstName || 'there',
    });

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: '🎉 Welcome to EaseMail Premium!',
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await db.insert(betaEmailsSent).values({
      userId,
      templateName: 'beta_graduation',
      resendId: data?.id,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
