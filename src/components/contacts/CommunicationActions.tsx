'use client';

/**
 * Communication Actions Component
 * Quick action buttons for email and SMS communications
 */

import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { SMSComposerModal } from './SMSComposerModal';

interface CommunicationActionsProps {
  contactId: string;
  phone?: string | null;
  email?: string | null;
  contactName?: string;
  onEmailClick?: () => void; // Custom handler for email composer
}

export function CommunicationActions({
  contactId,
  phone,
  email,
  contactName = 'Contact',
  onEmailClick,
}: CommunicationActionsProps) {
  const [showSMSModal, setShowSMSModal] = useState(false);

  const handleEmailClick = () => {
    if (onEmailClick) {
      onEmailClick();
      toast.success(`📧 Opening email to ${contactName}`, {
        position: 'top-center',
        duration: 3000,
      });
    } else if (email) {
      // Open default email composer
      window.location.href = `/dashboard/inbox?compose=true&to=${encodeURIComponent(email)}`;
      toast.success(`📧 Opening email composer`, {
        position: 'top-center',
        duration: 3000,
      });
    } else {
      toast.error('No email address available for this contact', {
        position: 'top-center',
      });
    }
  };

  const handleSMSClick = () => {
    if (!phone) {
      toast.error('No phone number available for this contact', {
        position: 'top-center',
      });
      return;
    }
    setShowSMSModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Email Button */}
        <button
          onClick={handleEmailClick}
          disabled={!email}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={email ? `Email ${contactName}` : 'No email address'}
        >
          <Mail className="h-4 w-4" />
          <span>Email</span>
        </button>

        {/* SMS Button */}
        <button
          onClick={handleSMSClick}
          disabled={!phone}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={phone ? `Send SMS to ${contactName}` : 'No phone number'}
        >
          <MessageSquare className="h-4 w-4" />
          <span>SMS</span>
        </button>
      </div>

      {/* SMS Modal */}
      {phone && (
        <SMSComposerModal
          isOpen={showSMSModal}
          onClose={() => setShowSMSModal(false)}
          contactId={contactId}
          recipientName={contactName}
          recipientPhone={phone}
        />
      )}
    </>
  );
}
