/**
 * Payment Failed Email Template
 * Sent when a payment attempt fails
 */

export function generatePaymentFailedEmail(data: {
  customerName: string;
  amount: string;
  nextRetryDate: string;
  updatePaymentUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header { 
      background: #FF4C5A; 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .content p {
      margin: 0 0 16px 0;
    }
    .highlight {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .button { 
      background: #FF4C5A; 
      color: white !important; 
      padding: 14px 28px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 24px 0; 
      font-weight: 600;
      text-align: center;
    }
    .button:hover {
      background: #E63946;
    }
    .footer { 
      text-align: center; 
      color: #666; 
      font-size: 12px; 
      padding: 20px;
      background-color: #f9f9f9;
    }
    .footer a {
      color: #FF4C5A;
      text-decoration: none;
    }
    .details {
      background-color: #f9f9f9;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Payment Issue - Action Required</h1>
    </div>
    <div class="content">
      <p>Hi ${data.customerName},</p>
      
      <p>We tried to process your payment but it didn't go through successfully.</p>
      
      <div class="details">
        <strong>Payment Amount:</strong> $${data.amount}<br>
        <strong>Next Retry:</strong> ${data.nextRetryDate}
      </div>
      
      <div class="highlight">
        <strong>Why did this happen?</strong><br>
        This could be due to:
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Insufficient funds in your account</li>
          <li>Expired or invalid card</li>
          <li>Your bank declining the charge</li>
          <li>Card limit reached</li>
        </ul>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <p>We'll automatically retry your payment on <strong>${data.nextRetryDate}</strong>. However, to avoid any service interruption, we recommend updating your payment method now.</p>
      
      <div style="text-align: center;">
        <a href="${data.updatePaymentUrl}" class="button">Update Payment Method</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 32px;">
        If you have questions or need assistance, please contact our support team. We're here to help!
      </p>
    </div>
    <div class="footer">
      <p><strong>EaseMail</strong></p>
      <p><a href="https://easemail.app">easemail.app</a> | <a href="https://easemail.app/support">Support</a></p>
      <p style="margin-top: 16px; font-size: 11px;">
        This is an automated email regarding your EaseMail subscription.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Final Payment Warning Email Template
 * Sent before subscription cancellation
 */
export function generateFinalPaymentWarningEmail(data: {
  customerName: string;
  amount: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header { 
      background: #dc3545; 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .urgent {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
      color: #721c24;
    }
    .button { 
      background: #dc3545; 
      color: white !important; 
      padding: 14px 28px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 24px 0; 
      font-weight: 600;
    }
    .footer { 
      text-align: center; 
      color: #666; 
      font-size: 12px; 
      padding: 20px;
      background-color: #f9f9f9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Final Notice - Subscription at Risk</h1>
    </div>
    <div class="content">
      <p>Hi ${data.customerName},</p>
      
      <div class="urgent">
        <strong>⚠️ URGENT ACTION REQUIRED</strong><br>
        Your subscription payment of $${data.amount} has failed multiple times. If we cannot process your payment, your subscription will be cancelled within 24 hours.
      </div>
      
      <p><strong>This is your final notice.</strong></p>
      
      <p>We've attempted to charge your payment method several times without success. To keep your EaseMail account active, please update your payment information immediately.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?update=true" class="button">Update Payment Now</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 32px;">
        If you're experiencing financial difficulties or need to discuss your account, please contact our support team. We're here to help find a solution.
      </p>
    </div>
    <div class="footer">
      <p><strong>EaseMail</strong></p>
      <p><a href="https://easemail.app">easemail.app</a> | <a href="https://easemail.app/support">Support</a></p>
    </div>
  </div>
</body>
</html>
  `;
}
