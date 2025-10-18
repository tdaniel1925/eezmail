'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Email } from '@/stores/aiPanelStore';
import { cn } from '@/lib/utils';
import { useAIPanelStore } from '@/stores/aiPanelStore';
import { ContactDetailModal } from '@/components/contacts/ContactDetailModal';

interface ContactStatsProps {
  email: Email;
}

interface ContactData {
  id?: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  emailsReceived: number;
  emailsSent: number;
  lastContact: string;
}

export function ContactStats({ email }: ContactStatsProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const { setSelectedContact } = useAIPanelStore();

  // Extract email address from "Name <email@domain.com>" format
  const extractEmail = (emailStr: string): string => {
    const match = emailStr.match(/<(.+)>/);
    return match ? match[1] : emailStr;
  };

  const extractName = (emailStr: string): string => {
    const match = emailStr.match(/^(.+?)\s*</);
    return match ? match[1].trim() : emailStr.split('@')[0];
  };

  useEffect(() => {
    const fetchContactData = async () => {
      setIsLoading(true);
      try {
        const emailAddress = extractEmail(email.from);

        // Try to fetch contact from API
        const response = await fetch(
          `/api/contacts/search?query=${encodeURIComponent(emailAddress)}`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.contacts && data.contacts.length > 0) {
            const contact = data.contacts[0];
            setContactData({
              id: contact.id,
              name: contact.displayName || extractName(email.from),
              email: emailAddress,
              company: contact.company || undefined,
              title: contact.jobTitle || undefined,
              phone: contact.primaryPhone || undefined,
              location: contact.location || undefined,
              emailsReceived: contact.emailsReceived || 0,
              emailsSent: contact.emailsSent || 0,
              lastContact: contact.lastContactedAt
                ? getRelativeTime(new Date(contact.lastContactedAt))
                : 'Just now',
            });
          } else {
            // No contact found, use email data
            setContactData({
              name: extractName(email.from),
              email: emailAddress,
              emailsReceived: 1,
              emailsSent: 0,
              lastContact: 'Just now',
            });
          }
        } else {
          // API error, use fallback
          setContactData({
            name: extractName(email.from),
            email: emailAddress,
            emailsReceived: 1,
            emailsSent: 0,
            lastContact: 'Just now',
          });
        }
      } catch (error) {
        console.error('Error fetching contact data:', error);
        // Use fallback data
        const emailAddress = extractEmail(email.from);
        setContactData({
          name: extractName(email.from),
          email: emailAddress,
          emailsReceived: 1,
          emailsSent: 0,
          lastContact: 'Just now',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactData();
  }, [email.from, email.id]);

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleViewProfile = () => {
    if (contactData?.id) {
      setSelectedContact(contactData.id);
      setShowContactModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contactData) {
    return null;
  }

  return (
    <>
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {contactData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {contactData.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {contactData.emailsReceived + contactData.emailsSent} total
                emails
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 pl-12">
            {/* Email Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Received
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {contactData.emailsReceived}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {contactData.emailsSent}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <a
                  href={`mailto:${contactData.email}`}
                  className="text-gray-700 hover:text-primary dark:text-gray-300"
                >
                  {contactData.email}
                </a>
              </div>
              {(contactData.company || contactData.title) && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {contactData.title && `${contactData.title}`}
                    {contactData.title && contactData.company && ' at '}
                    {contactData.company && contactData.company}
                  </span>
                </div>
              )}
              {contactData.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <a
                    href={`tel:${contactData.phone}`}
                    className="text-gray-700 hover:text-primary dark:text-gray-300"
                  >
                    {contactData.phone}
                  </a>
                </div>
              )}
              {contactData.location && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {contactData.location}
                  </span>
                </div>
              )}
            </div>

            {/* View Full Profile Button */}
            {contactData.id ? (
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 dark:border-primary/50 dark:hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  window.location.href = `/dashboard/contacts?action=add&email=${encodeURIComponent(contactData.email)}`;
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Add to Contacts
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {showContactModal && contactData?.id && (
        <ContactDetailModal
          contactId={contactData.id}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </>
  );
}
