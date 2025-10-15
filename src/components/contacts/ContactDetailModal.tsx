'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Star,
  Edit2,
  Trash2,
  MessageSquare,
  Send,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { QuickComposeButton } from './QuickComposeButton';
import { EmailComposer } from '@/components/email/EmailComposer';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ContactDetails } from '@/lib/contacts/data';
import type { Email } from '@/db/schema';
import { getContactAvatarData } from '@/lib/contacts/avatar';
import { getEmailHistoryForContact } from '@/lib/contacts/email-history';

interface ContactDetailModalProps {
  contact: ContactDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

type TabType = 'overview' | 'emails' | 'notes';

export function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailModalProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerData, setComposerData] = useState<{
    to: string;
    subject: string;
  } | null>(null);
  const [emailHistory, setEmailHistory] = useState<Email[]>([]);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    sent: 0,
    received: 0,
  });
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  // Fetch email history when email tab is activated
  useEffect(() => {
    if (activeTab === 'emails' && contact && isOpen) {
      loadEmailHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, contact?.id, isOpen]);

  const loadEmailHistory = async () => {
    if (!contact) return;

    setIsLoadingEmails(true);
    try {
      const result = await getEmailHistoryForContact(
        contact.id,
        contact.userId,
        { limit: 50 }
      );
      setEmailHistory(result.emails);
      setEmailStats({
        total: result.total,
        sent: result.sentCount,
        received: result.receivedCount,
      });
    } catch (error) {
      console.error('Error loading email history:', error);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  if (!isOpen || !contact) return null;

  const avatarData = getContactAvatarData(contact, contact.emails[0]?.email);

  const handleOpenComposer = (email: string, contactName?: string) => {
    setComposerData({
      to: email,
      subject: contactName ? `Message to ${contactName}` : '',
    });
    setIsComposerOpen(true);
  };

  const handleCloseComposer = () => {
    setIsComposerOpen(false);
    setComposerData(null);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Building2 },
    { id: 'emails' as const, label: 'Email History', icon: Mail },
    { id: 'notes' as const, label: 'Notes', icon: MessageSquare },
  ];

  const socialPlatformIcons: Record<string, string> = {
    linkedin: '💼',
    twitter: '🐦',
    facebook: '👥',
    instagram: '📸',
    github: '💻',
    other: '🔗',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <ContactAvatar
              avatarUrl={avatarData.url}
              name={avatarData.name}
              initials={avatarData.initials}
              color={avatarData.color}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avatarData.name}
                </h2>
                {contact.isFavorite && (
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                )}
              </div>
              {contact.jobTitle && contact.company && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contact.jobTitle} at {contact.company}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Edit contact"
              >
                <Edit2 size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete contact"
              >
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 dark:border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emails */}
                {contact.emails.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email Addresses
                    </h3>
                    <div className="space-y-2">
                      {contact.emails.map((email) => (
                        <div
                          key={email.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <a
                              href={`mailto:${email.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {email.email}
                            </a>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({email.type}){email.isPrimary && ' • Primary'}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleOpenComposer(email.email, avatarData.name)
                            }
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title="Send email"
                          >
                            <Send
                              size={14}
                              className="text-gray-600 dark:text-gray-400"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phones */}
                {contact.phones.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Phone size={16} />
                      Phone Numbers
                    </h3>
                    <div className="space-y-2">
                      {contact.phones.map((phone) => (
                        <div key={phone.id} className="text-sm">
                          <a
                            href={`tel:${phone.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {phone.phone}
                          </a>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({phone.type}){phone.isPrimary && ' • Primary'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Addresses */}
              {contact.addresses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    Addresses
                  </h3>
                  <div className="space-y-3">
                    {contact.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {address.type}
                          {address.isPrimary && ' (Primary)'}
                        </div>
                        <div>
                          {address.street && <div>{address.street}</div>}
                          {(address.city ||
                            address.state ||
                            address.zipCode) && (
                            <div>
                              {address.city}
                              {address.state && `, ${address.state}`}
                              {address.zipCode && ` ${address.zipCode}`}
                            </div>
                          )}
                          {address.country && <div>{address.country}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Info */}
              {(contact.company || contact.jobTitle || contact.department) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Briefcase size={16} />
                    Work Information
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {contact.company && (
                      <div>
                        <span className="font-medium">Company:</span>{' '}
                        {contact.company}
                      </div>
                    )}
                    {contact.jobTitle && (
                      <div>
                        <span className="font-medium">Title:</span>{' '}
                        {contact.jobTitle}
                      </div>
                    )}
                    {contact.department && (
                      <div>
                        <span className="font-medium">Department:</span>{' '}
                        {contact.department}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Birthday */}
              {contact.birthday && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Birthday
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(contact.birthday), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              {/* Social Links */}
              {contact.socialLinks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <ExternalLink size={16} />
                    Social Links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                      >
                        <span>{socialPlatformIcons[link.platform]}</span>
                        <span className="capitalize">{link.platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className={cn(
                          'px-3 py-1 text-sm font-medium rounded-full',
                          tag.color === 'blue' &&
                            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                          tag.color === 'green' &&
                            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                          tag.color === 'red' &&
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                          tag.color === 'purple' &&
                            'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        )}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              {contact.customFields.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Custom Fields
                  </h3>
                  <div className="space-y-2">
                    {contact.customFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {field.fieldName}:
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {field.fieldValue || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {contact.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {contact.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {emailStats.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Total Emails
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {emailStats.sent}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Sent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {emailStats.received}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Received
                  </div>
                </div>
              </div>

              {/* Compose Button */}
              {contact.emails.length > 0 && (
                <div>
                  <QuickComposeButton
                    email={contact.emails[0].email}
                    contactName={avatarData.name}
                    onCompose={handleOpenComposer}
                  />
                </div>
              )}

              {/* Email List */}
              {isLoadingEmails ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Loading email history...
                  </p>
                </div>
              ) : emailHistory.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-12">
                  No email history found
                  <br />
                  <span className="text-sm">
                    Start emailing this contact to see the history here
                  </span>
                </p>
              ) : (
                <div className="space-y-3">
                  {emailHistory.map((email) => {
                    const isSent = contact.emails.some(
                      (ce) => ce.email === email.fromAddress.email
                    );
                    return (
                      <div
                        key={email.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isSent ? (
                              <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {isSent ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(
                              new Date(email.receivedAt),
                              'MMM d, yyyy h:mm a'
                            )}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {email.subject || '(No Subject)'}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {email.snippet}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {email.hasAttachments && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                              📎 Attachment
                            </span>
                          )}
                          {email.isStarred && (
                            <span className="text-xs">⭐</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {contact.notesList.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-12">
                  No notes yet
                </p>
              ) : (
                contact.notesList.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Composer */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={handleCloseComposer}
        mode="compose"
        initialData={composerData || undefined}
      />
    </div>
  );
}
