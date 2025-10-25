'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Plus,
  Loader2,
  Building2,
  Briefcase,
  Clock,
  ExternalLink,
} from 'lucide-react';
import type { Email } from '@/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyState } from '../EmptyStates';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { useChatbotContext } from '../ChatbotContext';

interface PeopleTabProps {
  // Props are no longer used, we get email from context
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  emails: Array<{ email: string; type: string; isPrimary: boolean }>;
}

interface SenderEmail {
  id: string;
  subject: string;
  snippet?: string;
  fromAddress: any;
  receivedAt: Date;
  sentAt?: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  folderName?: string;
}

export function PeopleTab({}: PeopleTabProps): JSX.Element {
  // Get current email from context instead of props
  const { currentEmail } = useChatbotContext();

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [senderEmails, setSenderEmails] = useState<SenderEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [openingEmailId, setOpeningEmailId] = useState<string | null>(null);

  // Extract sender email from currentEmail
  // fromAddress is a JSONB field with structure: { email: string, name?: string }
  const senderEmail =
    typeof currentEmail?.fromAddress === 'object' && currentEmail?.fromAddress
      ? (currentEmail.fromAddress as any).email || ''
      : '';

  const senderName =
    typeof currentEmail?.fromAddress === 'object' && currentEmail?.fromAddress
      ? (currentEmail.fromAddress as any).name || senderEmail
      : senderEmail;

  console.log(
    '[PeopleTab] Current email fromAddress:',
    currentEmail?.fromAddress
  );
  console.log('[PeopleTab] Extracted senderEmail:', senderEmail);
  console.log('[PeopleTab] Extracted senderName:', senderName);

  // Check if sender exists in contacts
  useEffect(() => {
    if (senderEmail) {
      fetchContactInfo();
      fetchSenderEmails(0);
    } else {
      setContact(null);
      setSenderEmails([]);
      setOffset(0);
    }
  }, [senderEmail]);

  async function fetchContactInfo() {
    if (!senderEmail) return;

    setIsLoadingContact(true);
    try {
      const response = await fetch(
        `/api/contacts?email=${encodeURIComponent(senderEmail)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.contacts && data.contacts.length > 0) {
          setContact(data.contacts[0]);
        } else {
          setContact(null);
        }
      } else {
        setContact(null);
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      setContact(null);
    } finally {
      setIsLoadingContact(false);
    }
  }

  async function fetchSenderEmails(newOffset: number) {
    if (!senderEmail) return;

    console.log(
      `[PeopleTab] Fetching emails for sender: ${senderEmail}, offset: ${newOffset}`
    );

    setIsLoadingEmails(true);
    try {
      const response = await fetch(
        `/api/contacts/sender-emails?senderEmail=${encodeURIComponent(senderEmail)}&offset=${newOffset}`
      );

      console.log(`[PeopleTab] Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(
          `[PeopleTab] Received ${data.emails?.length || 0} emails, hasMore: ${data.hasMore}`
        );

        if (newOffset === 0) {
          setSenderEmails(data.emails || []);
        } else {
          setSenderEmails((prev) => [...prev, ...(data.emails || [])]);
        }

        setHasMore(data.hasMore || false);
        setOffset(newOffset);
      } else {
        const errorData = await response.json();
        console.error(`[PeopleTab] Error response:`, errorData);
        toast.error('Failed to load previous emails');
      }
    } catch (error) {
      console.error('[PeopleTab] Error fetching sender emails:', error);
      toast.error('Failed to load previous emails');
    } finally {
      setIsLoadingEmails(false);
    }
  }

  function handleLoadMore() {
    fetchSenderEmails(offset + 20);
  }

  function handleEmailClick(emailId: string) {
    // Show inline notification
    setOpeningEmailId(emailId);

    // Dispatch event to open email in main view
    const event = new CustomEvent('open-email', { detail: { emailId } });
    window.dispatchEvent(event);

    // Clear notification after animation completes
    setTimeout(() => {
      setOpeningEmailId(null);
    }, 2000);
  }

  async function handleContactSaved() {
    // Refresh contact info after saving
    await fetchContactInfo();
    setShowContactForm(false);
    toast.success('Contact saved successfully');
  }

  if (!currentEmail) {
    return <EmptyState type="people" />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Sender Profile */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {contact?.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={senderName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <Users className="h-8 w-8 text-primary" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {contact?.displayName ||
                  contact?.firstName ||
                  senderName ||
                  'Unknown Sender'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {senderEmail}
              </p>

              {isLoadingContact && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-500">Loading...</span>
                </div>
              )}

              {contact && !isLoadingContact && (
                <div className="mt-2 space-y-1">
                  {contact.company && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{contact.company}</span>
                    </div>
                  )}
                  {contact.jobTitle && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      <span className="truncate">{contact.jobTitle}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div>
            {contact ? (
              <button
                onClick={() => {
                  // Navigate to contact detail page
                  window.location.href = `/dashboard/contacts/${contact.id}`;
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Full Contact
              </button>
            ) : (
              <button
                onClick={() => setShowContactForm(true)}
                disabled={isLoadingContact}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add to Contacts
              </button>
            )}
          </div>
        </div>

        {/* Previous Emails */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Previous Emails
            </h4>
            {senderEmails.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {senderEmails.length}{' '}
                {senderEmails.length === 1 ? 'email' : 'emails'}
              </span>
            )}
          </div>

          {isLoadingEmails && offset === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : senderEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No previous emails from this sender
              </p>
            </div>
          ) : (
            <>
              {/* Inline notification when opening email */}
              {openingEmailId && (
                <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Opening email...</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {senderEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => handleEmailClick(email.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-all duration-200',
                      openingEmailId === email.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 scale-[0.98]'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent hover:border-gray-200 dark:hover:border-gray-600',
                      'border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5
                        className={cn(
                          'text-sm font-medium truncate flex-1',
                          email.isRead
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-900 dark:text-white font-semibold'
                        )}
                      >
                        {email.subject || '(No Subject)'}
                      </h5>
                      {!email.isRead && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>

                    {email.snippet && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                        {email.snippet}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(email.receivedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {email.hasAttachments && (
                        <span className="flex items-center gap-1">
                          📎 Attachment
                        </span>
                      )}
                      {email.folderName && email.folderName !== 'INBOX' && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs">
                          {email.folderName}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingEmails}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingEmails ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactFormModal
          isOpen={showContactForm}
          onClose={() => setShowContactForm(false)}
          contact={{
            firstName: senderName?.split(' ')[0] || '',
            lastName: senderName?.split(' ').slice(1).join(' ') || '',
            emails: [{ email: senderEmail, type: 'work', isPrimary: true }],
          }}
          onSave={handleContactSaved}
        />
      )}
    </div>
  );
}
