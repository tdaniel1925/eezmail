export function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Background */}
      <rect width="1200" height="800" fill="#0A0A0A" />
      
      {/* Sidebar */}
      <rect x="0" y="0" width="240" height="800" fill="#1A1A1A" />
      
      {/* Logo */}
      <text x="20" y="40" fill="#FF4C5A" fontSize="20" fontWeight="bold">easeMail</text>
      
      {/* Sidebar Menu Items */}
      <g opacity="0.7">
        <rect x="20" y="80" width="200" height="36" rx="8" fill="#FF4C5A" fillOpacity="0.2" />
        <text x="40" y="103" fill="#FFFFFF" fontSize="14">📥 Inbox</text>
        
        <text x="40" y="143" fill="#9CA3AF" fontSize="14">📤 Sent</text>
        <text x="40" y="183" fill="#9CA3AF" fontSize="14">⭐ Starred</text>
        <text x="40" y="223" fill="#9CA3AF" fontSize="14">📋 Drafts</text>
        <text x="40" y="263" fill="#9CA3AF" fontSize="14">🗑️ Trash</text>
      </g>
      
      {/* Main Content Area */}
      <rect x="240" y="0" width="960" height="800" fill="#0F0F0F" />
      
      {/* Header */}
      <rect x="240" y="0" width="960" height="60" fill="#151515" />
      <text x="270" y="38" fill="#FFFFFF" fontSize="18" fontWeight="600">Inbox</text>
      
      {/* Search Bar */}
      <rect x="900" y="18" width="260" height="36" rx="18" fill="#1A1A1A" stroke="#333333" strokeWidth="1" />
      <text x="920" y="38" fill="#6B7280" fontSize="12">🔍 Search with AI...</text>
      
      {/* Email List */}
      <g>
        {/* Email 1 - Unread */}
        <rect x="260" y="80" width="680" height="100" fill="#1A1A1A" rx="8" />
        <circle cx="285" cy="115" r="20" fill="#FF4C5A" />
        <text x="285" y="120" fill="#FFFFFF" fontSize="12" textAnchor="middle">JD</text>
        <text x="320" y="110" fill="#FFFFFF" fontSize="14" fontWeight="600">John Doe</text>
        <text x="320" y="132" fill="#9CA3AF" fontSize="13">Q4 Strategy Meeting - Need your input</text>
        <text x="320" y="155" fill="#6B7280" fontSize="12">Hi team, I wanted to discuss our Q4 priorities...</text>
        <rect x="900" y="95" width="8" height="8" rx="4" fill="#FF4C5A" />
        <text x="880" y="115" fill="#9CA3AF" fontSize="11" textAnchor="end">10:23 AM</text>
        
        {/* Email 2 */}
        <rect x="260" y="200" width="680" height="100" fill="#151515" rx="8" />
        <circle cx="285" cy="235" r="20" fill="#3B82F6" />
        <text x="285" y="240" fill="#FFFFFF" fontSize="12" textAnchor="middle">SA</text>
        <text x="320" y="230" fill="#E5E7EB" fontSize="14">Sarah Anderson</text>
        <text x="320" y="252" fill="#9CA3AF" fontSize="13">Project Update - Week 42</text>
        <text x="320" y="275" fill="#6B7280" fontSize="12">Here's the weekly update on the client project...</text>
        <text x="880" y="235" fill="#9CA3AF" fontSize="11" textAnchor="end">Yesterday</text>
        
        {/* Email 3 */}
        <rect x="260" y="320" width="680" height="100" fill="#151515" rx="8" />
        <circle cx="285" cy="355" r="20" fill="#10B981" />
        <text x="285" y="360" fill="#FFFFFF" fontSize="12" textAnchor="middle">MK</text>
        <text x="320" y="350" fill="#E5E7EB" fontSize="14">Mike Kim</text>
        <text x="320" y="372" fill="#9CA3AF" fontSize="13">Re: Budget Approval</text>
        <text x="320" y="395" fill="#6B7280" fontSize="12">Thanks for the quick turnaround on this...</text>
        <text x="880" y="355" fill="#9CA3AF" fontSize="11" textAnchor="end">2 days ago</text>
      </g>
      
      {/* Right Sidebar - AI Panel */}
      <rect x="960" y="60" width="240" height="740" fill="#1A1A1A" />
      <text x="980" y="95" fill="#FFFFFF" fontSize="16" fontWeight="600">AI Assistant</text>
      
      {/* AI Chat Messages */}
      <g>
        <rect x="975" y="120" width="210" height="60" rx="8" fill="#2D2D2D" />
        <text x="985" y="140" fill="#9CA3AF" fontSize="11">You:</text>
        <text x="985" y="160" fill="#E5E7EB" fontSize="12">Summarize unread</text>
        <text x="985" y="175" fill="#E5E7EB" fontSize="12">emails</text>
        
        <rect x="975" y="195" width="210" height="120" rx="8" fill="#FF4C5A" fillOpacity="0.15" />
        <text x="985" y="215" fill="#FF4C5A" fontSize="11">AI:</text>
        <text x="985" y="235" fill="#E5E7EB" fontSize="11">You have 3 unread</text>
        <text x="985" y="250" fill="#E5E7EB" fontSize="11">messages. Most urgent:</text>
        <text x="985" y="265" fill="#E5E7EB" fontSize="11">John needs Q4 input</text>
        <text x="985" y="280" fill="#E5E7EB" fontSize="11">by EOD. Other 2 are</text>
        <text x="985" y="295" fill="#E5E7EB" fontSize="11">informational updates.</text>
      </g>
      
      {/* Quick Actions */}
      <g>
        <rect x="975" y="650" width="100" height="32" rx="6" fill="#FF4C5A" fillOpacity="0.2" stroke="#FF4C5A" strokeWidth="1" />
        <text x="1005" y="672" fill="#FF4C5A" fontSize="11" textAnchor="middle">✨ Compose</text>
        
        <rect x="1085" y="650" width="100" height="32" rx="6" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="1" />
        <text x="1115" y="672" fill="#3B82F6" fontSize="11" textAnchor="middle">🎤 Dictate</text>
      </g>
      
      {/* Decorative Elements */}
      <circle cx="1180" cy="30" r="4" fill="#10B981" />
      <text x="1155" y="35" fill="#9CA3AF" fontSize="10">Online</text>
    </svg>
  );
}

