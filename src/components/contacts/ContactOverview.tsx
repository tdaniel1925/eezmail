'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Star,
  Users,
  Tag as TagIcon,
  Plus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Contact } from './ContactDetailModal';
import { GroupBadge } from './GroupBadge';
import { TagBadge } from './TagBadge';
import { TagSelector } from './TagSelector';
import { CommunicationActions } from './CommunicationActions';
import {
  useContactGroups,
  addMembersToContactGroup,
} from '@/hooks/useContactGroups';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactDetails {
  emails: Array<{ email: string; type: string; isPrimary: boolean }>;
  phones: Array<{ phone: string; type: string; isPrimary: boolean }>;
  addresses: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    type: string;
  }>;
  socialLinks: Array<{ platform: string; url: string }>;
}

interface ContactOverviewProps {
  contact: Contact & {
    groups?: Array<{ id: string; name: string; color: string }>;
    tags?: Array<{ id: string; name: string; color: string }>;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ContactOverview({
  contact,
  onEdit,
  onDelete,
}: ContactOverviewProps): JSX.Element {
  const { groups } = useContactGroups();
  const [isAddingToGroup, setIsAddingToGroup] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    contact.tags?.map((t) => t.id) || []
  );
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    emails: [],
    phones: [],
    addresses: [],
    socialLinks: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real contact data from API
  useEffect(() => {
    async function fetchContactDetails() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/contacts/${contact.id}/details`);
        if (!response.ok) throw new Error('Failed to fetch contact details');
        
        const data = await response.json();
        setContactDetails({
          emails: data.emails || [],
          phones: data.phones || [],
          addresses: data.addresses || [],
          socialLinks: data.socialLinks || [],
        });
      } catch (error) {
        console.error('Error fetching contact details:', error);
        toast.error('Failed to load contact details');
        // Set empty arrays as fallback
        setContactDetails({
          emails: [],
          phones: [],
          addresses: [],
          socialLinks: [],
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchContactDetails();
  }, [contact.id]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Communication Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <CommunicationActions
              contactId={contact.id}
              phone={contactDetails.phones[0]?.phone}
              email={contactDetails.emails[0]?.email}
              contactName={contact.displayName || `${contact.firstName} ${contact.lastName}`}
            />
          </div>

      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contact Information
        </h3>

        <div className="space-y-3">
          {/* Emails */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
              Email Addresses
            </p>
            {contactDetails.emails.length > 0 ? (
              contactDetails.emails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2 py-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${email.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {email.email}
                  </a>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({email.type})
                  </span>
                  {email.isPrimary && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                No email addresses
              </p>
            )}
          </div>

          {/* Phones */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
              Phone Numbers
            </p>
            {contactDetails.phones.length > 0 ? (
              contactDetails.phones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2 py-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${phone.phone}`}
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary"
                  >
                    {phone.phone}
                  </a>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({phone.type})
                  </span>
                  {phone.isPrimary && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                No phone numbers
              </p>
            )}
          </div>

          {/* Company Info */}
          {(contact.company || contact.jobTitle) && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                Work Information
              </p>
              <div className="space-y-2">
                {contact.company && (
                  <div className="flex items-center gap-2 py-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {contact.company}
                    </span>
                  </div>
                )}
                {contact.jobTitle && (
                  <div className="flex items-center gap-2 py-1">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {contact.jobTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          {contactDetails.addresses.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                Addresses
              </p>
              {contactDetails.addresses.map((address, idx) => (
                <div key={idx} className="flex items-start gap-2 py-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p>{address.country}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({address.type})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
              Metadata
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 py-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Added: {contact.createdAt.toLocaleDateString()}
                </span>
              </div>
              {contact.lastContactedAt && (
                <div className="flex items-center gap-2 py-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Last contacted:{' '}
                    {contact.lastContactedAt.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {contactDetails.socialLinks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                Social Media
              </p>
              <div className="flex flex-wrap gap-2">
                {contactDetails.socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {link.platform.charAt(0).toUpperCase() +
                      link.platform.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups
          </h3>
        </div>

        <div className="space-y-3">
          {/* Current Groups */}
          {contact.groups && contact.groups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contact.groups.map((group) => (
                <GroupBadge
                  key={group.id}
                  name={group.name}
                  color={group.color}
                  size="md"
                  removable
                  onRemove={async () => {
                    try {
                      // Remove from group via API
                      await fetch(`/api/contacts/groups/${group.id}/members`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contactIds: [contact.id] }),
                      });
                      toast.success(`Removed from ${group.name}`);
                      // Refresh page or update state
                      window.location.reload();
                    } catch (error) {
                      console.error('Error removing from group:', error);
                      toast.error('Failed to remove from group');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Not in any groups yet
            </p>
          )}

          {/* Add to Group */}
          <div className="flex items-center gap-2">
            <Select
              onValueChange={async (groupId) => {
                try {
                  await addMembersToContactGroup(groupId, {
                    contactIds: [contact.id],
                  });
                  const group = groups.find((g) => g.id === groupId);
                  toast.success(`Added to ${group?.name}`);
                  // Refresh page or update state
                  window.location.reload();
                } catch (error) {
                  console.error('Error adding to group:', error);
                  toast.error('Failed to add to group');
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <Plus className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Add to group" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter((g) => !contact.groups?.some((cg) => cg.id === g.id))
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Tags
          </h3>
        </div>

        <TagSelector
          contactId={contact.id}
          selectedTagIds={selectedTagIds}
          onTagsChange={(newTagIds) => {
            setSelectedTagIds(newTagIds);
            // Optionally refresh or update parent state
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              // Get the primary email from the contact details
              const primaryEmail = contactDetails.emails.find(
                (e) => e.isPrimary
              )?.email;
              if (primaryEmail) {
                // Dispatch event to open email composer
                window.dispatchEvent(
                  new CustomEvent('open-email-composer', {
                    detail: {
                      to: primaryEmail,
                      mode: 'compose',
                    },
                  })
                );
                toast.success(`Opening email composer to ${primaryEmail}`);
              } else {
                toast.error('No email address found for this contact');
              }
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Send Email
          </button>
          <button
            onClick={() => {
              // TODO: Implement calendar integration
              toast.info('Calendar integration coming soon!');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Schedule Meeting
          </button>
          <button
            onClick={() => {
              if (onEdit) {
                onEdit();
              } else {
                toast.error('Edit functionality not available');
              }
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Edit Contact
          </button>
          {onDelete && (
            <button
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to delete this contact? This action cannot be undone.'
                  )
                ) {
                  onDelete();
                }
              }}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete Contact
            </button>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
