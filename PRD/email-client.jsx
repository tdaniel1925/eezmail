import React, { useState } from 'react';
import { Mail, Inbox, Send, File, Star, Trash2, Search, Menu, Paperclip, MoreVertical, Archive, Clock, Flag, ChevronDown, ChevronUp, Reply, Forward } from 'lucide-react';

const EmailClient = () => {
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const emails = [
    {
      id: 1,
      sender: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      subject: 'Q4 Marketing Strategy Review',
      preview: 'Hi team, I wanted to share some thoughts on our Q4 marketing approach. I believe we should focus more on...',
      time: '10:30 AM',
      read: false,
      starred: true,
      hasAttachment: true,
      color: 'bg-purple-500'
    },
    {
      id: 2,
      sender: 'Michael Rodriguez',
      email: 'michael.r@startup.io',
      subject: 'Partnership Opportunity',
      preview: 'Hello! I came across your company and was really impressed by your recent product launch. I think there could be...',
      time: '9:15 AM',
      read: false,
      starred: false,
      hasAttachment: false,
      color: 'bg-blue-500'
    },
    {
      id: 3,
      sender: 'Emma Thompson',
      email: 'emma.t@design.co',
      subject: 'Design Files Ready for Review',
      preview: 'The mockups are complete and ready for your feedback. I\'ve included both mobile and desktop versions...',
      time: 'Yesterday',
      read: true,
      starred: false,
      hasAttachment: true,
      color: 'bg-green-500'
    },
    {
      id: 4,
      sender: 'Alex Kim',
      email: 'alex.kim@tech.com',
      subject: 'Meeting Notes - Product Sync',
      preview: 'Thanks for the productive meeting today. Here are the key takeaways and action items we discussed...',
      time: 'Yesterday',
      read: true,
      starred: true,
      hasAttachment: false,
      color: 'bg-orange-500'
    },
    {
      id: 5,
      sender: 'LinkedIn',
      email: 'notifications@linkedin.com',
      subject: 'Your weekly network update',
      preview: 'See who viewed your profile this week and connect with people you may know...',
      time: '2 days ago',
      read: true,
      starred: false,
      hasAttachment: false,
      color: 'bg-blue-600'
    }
  ];

  const folders = [
    { name: 'Inbox', icon: Inbox, count: 12, active: true },
    { name: 'Starred', icon: Star, count: 3 },
    { name: 'Sent', icon: Send, count: null },
    { name: 'Drafts', icon: File, count: 2 },
    { name: 'Archive', icon: Archive, count: null },
    { name: 'Trash', icon: Trash2, count: null }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Mail className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">MailBox</h1>
          </div>
          <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
            <span>Compose</span>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.name}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                folder.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <folder.icon size={20} />
                <span className="font-medium">{folder.name}</span>
              </div>
              {folder.count && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  folder.active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search emails..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Email List - Full Width */}
          <div className="flex-1 bg-white overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
              <p className="text-sm text-gray-500">12 unread messages</p>
            </div>

            <div className="max-w-5xl mx-auto">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`border-b border-gray-200 transition-all duration-200 ${
                    expandedEmail === email.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Email Preview */}
                  <div
                    onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                    className="p-6 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${email.color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                        {email.sender.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className={`text-lg font-semibold text-gray-800 ${!email.read ? 'font-bold' : ''}`}>
                                {email.sender}
                              </h3>
                              {!email.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                            <p className="text-sm text-gray-500">{email.email}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className="text-sm text-gray-500">{email.time}</span>
                            <div className="flex items-center gap-2">
                              {email.starred && <Star size={18} className="text-yellow-500 fill-yellow-500" />}
                              {email.hasAttachment && <Paperclip size={18} className="text-gray-400" />}
                            </div>
                            {expandedEmail === email.id ? (
                              <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={20} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-base text-gray-900 mb-2 ${!email.read ? 'font-semibold' : ''}`}>
                          {email.subject}
                        </p>
                        
                        {expandedEmail !== email.id && (
                          <p className="text-sm text-gray-600 line-clamp-2">{email.preview}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Email Content */}
                  {expandedEmail === email.id && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top duration-200">
                      <div className="ml-16 pl-4 border-l-2 border-gray-200">
                        {/* Email Actions */}
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                          <button className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200">
                            <Archive size={18} className="text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200">
                            <Flag size={18} className="text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200">
                            <Trash2 size={18} className="text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200">
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>
                          <div className="flex items-center gap-2 ml-auto text-sm text-gray-500">
                            <Clock size={14} />
                            <span>{email.time}</span>
                          </div>
                        </div>

                        {/* Email Body */}
                        <div className="prose max-w-none mb-6">
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {email.preview}
                          </p>
                          <p className="text-gray-700 leading-relaxed mb-4">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                          </p>
                          <p className="text-gray-700 leading-relaxed mb-4">
                            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                          </p>
                          <p className="text-gray-700 leading-relaxed">
                            Best regards,<br />
                            {email.sender}
                          </p>
                        </div>

                        {/* Attachments */}
                        {email.hasAttachment && (
                          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Paperclip size={16} />
                              Attachments
                            </p>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <File size={20} className="text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">document.pdf</p>
                                <p className="text-xs text-gray-500">2.4 MB</p>
                              </div>
                              <button className="text-sm text-blue-600 font-medium hover:underline">
                                Download
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reply Actions */}
                        <div className="flex gap-3">
                          <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                            <Reply size={18} />
                            Reply
                          </button>
                          <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors">
                            <Forward size={18} />
                            Forward
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailClient;