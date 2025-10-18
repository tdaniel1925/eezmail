'use client';

import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Star,
} from 'lucide-react';
import { Contact } from './ContactDetailModal';

interface ContactOverviewProps {
  contact: Contact;
}

export function ContactOverview({
  contact,
}: ContactOverviewProps): JSX.Element {
  // Mock data - replace with real data from API
  const contactDetails = {
    emails: [
      { email: 'john.doe@example.com', type: 'work', isPrimary: true },
      { email: 'john.personal@gmail.com', type: 'personal', isPrimary: false },
    ],
    phones: [
      { phone: '+1 (555) 123-4567', type: 'work', isPrimary: true },
      { phone: '+1 (555) 987-6543', type: 'mobile', isPrimary: false },
    ],
    addresses: [
      {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
        type: 'work',
      },
    ],
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
      { platform: 'twitter', url: 'https://twitter.com/johndoe' },
    ],
  };

  return (
    <div className="space-y-6">
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
            {contactDetails.emails.map((email, idx) => (
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
            ))}
          </div>

          {/* Phones */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
              Phone Numbers
            </p>
            {contactDetails.phones.map((phone, idx) => (
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
            ))}
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

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            Send Email
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            Schedule Meeting
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            Edit Contact
          </button>
        </div>
      </div>
    </div>
  );
}
