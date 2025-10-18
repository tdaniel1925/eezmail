export function AIAssistantMockup() {
  return (
    <svg
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Background */}
      <rect width="800" height="600" fill="#0A0A0A" rx="16" />
      
      {/* Header */}
      <rect width="800" height="60" fill="#1A1A1A" rx="16" />
      <text x="30" y="38" fill="#FF4C5A" fontSize="20" fontWeight="bold">🤖 AI Assistant</text>
      
      {/* Chat Area */}
      <g>
        {/* User Message 1 */}
        <rect x="500" y="90" width="270" height="80" rx="12" fill="#2D2D2D" />
        <text x="520" y="115" fill="#E5E7EB" fontSize="13">Find emails from Sarah about</text>
        <text x="520" y="135" fill="#E5E7EB" fontSize="13">the Q4 budget</text>
        <text x="750" y="160" fill="#6B7280" fontSize="10" textAnchor="end">2:45 PM</text>
        
        {/* AI Response 1 */}
        <rect x="30" y="190" width="350" height="140" rx="12" fill="#FF4C5A" fillOpacity="0.15" />
        <text x="50" y="215" fill="#FF4C5A" fontSize="12" fontWeight="600">✨ AI Found 3 emails</text>
        <text x="50" y="240" fill="#E5E7EB" fontSize="12">1. "Q4 Budget Proposal" - Oct 12</text>
        <text x="50" y="260" fill="#E5E7EB" fontSize="12">2. "Budget Review Meeting" - Oct 15</text>
        <text x="50" y="280" fill="#E5E7EB" fontSize="12">3. "Final Q4 Numbers" - Oct 18</text>
        <text x="50" y="310" fill="#9CA3AF" fontSize="11">💡 Most relevant: Final Q4 Numbers</text>
        
        {/* User Message 2 */}
        <rect x="480" y="350" width="290" height="60" rx="12" fill="#2D2D2D" />
        <text x="500" y="375" fill="#E5E7EB" fontSize="13">Summarize the latest one</text>
        <text x="750" y="400" fill="#6B7280" fontSize="10" textAnchor="end">2:46 PM</text>
        
        {/* AI Response 2 (typing indicator) */}
        <rect x="30" y="430" width="380" height="120" rx="12" fill="#FF4C5A" fillOpacity="0.15" />
        <text x="50" y="455" fill="#FF4C5A" fontSize="12" fontWeight="600">📧 Summary:</text>
        <text x="50" y="480" fill="#E5E7EB" fontSize="12">Sarah confirms Q4 budget of $2.3M</text>
        <text x="50" y="500" fill="#E5E7EB" fontSize="12">approved by finance. Marketing gets</text>
        <text x="50" y="520" fill="#E5E7EB" fontSize="12">$450K allocation. Needs your sign-off</text>
        <text x="50" y="540" fill="#E5E7EB" fontSize="12">by Friday.</text>
      </g>
      
      {/* Input Area */}
      <rect x="30" y="540" width="680" height="48" rx="24" fill="#1A1A1A" stroke="#333333" strokeWidth="1" />
      <text x="60" y="569" fill="#6B7280" fontSize="13">Ask AI anything about your emails...</text>
      
      {/* Send Button */}
      <circle cx="690" cy="564" r="16" fill="#FF4C5A" />
      <path d="M685 564 L695 564 M690 559 L695 564 L690 569" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Stats */}
      <g opacity="0.7">
        <rect x="30" y="20" width="120" height="24" rx="12" fill="#10B981" fillOpacity="0.2" />
        <text x="45" y="36" fill="#10B981" fontSize="11">⚡ Sub-100ms</text>
      </g>
    </svg>
  );
}

