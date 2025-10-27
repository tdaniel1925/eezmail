/**
 * Admin Page: Email Template Management
 * /admin/email-templates
 */

import { EmailTemplateManager } from '@/components/admin/EmailTemplateManager';

export const metadata = {
  title: 'Email Templates - Admin | EaseMail',
  description: 'Manage and customize notification email templates',
};

export default function EmailTemplatesPage(): JSX.Element {
  return <EmailTemplateManager />;
}
