export function SmartComposeMockup() {
  return (
    <svg
      viewBox="0 0 900 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Background */}
      <rect width="900" height="600" fill="#0A0A0A" rx="16" />
      
      {/* Window Header */}
      <rect width="900" height="50" fill="#1A1A1A" rx="16" />
      <text x="30" y="33" fill="#FFFFFF" fontSize="16" fontWeight="600">New Message</text>
      
      {/* Close/Minimize buttons */}
      <circle cx="860" cy="25" r="6" fill="#EF4444" opacity="0.8" />
      <circle cx="840" cy="25" r="6" fill="#F59E0B" opacity="0.8" />
      <circle cx="820" cy="25" r="6" fill="#10B981" opacity="0.8" />
      
      {/* Email Form */}
      <g>
        {/* To Field */}
        <rect x="30" y="70" width="840" height="40" fill="#151515" rx="8" />
        <text x="50" y="95" fill="#9CA3AF" fontSize="13">To:</text>
        <text x="100" y="95" fill="#E5E7EB" fontSize="13">sarah@company.com</text>
        
        {/* Subject Field */}
        <rect x="30" y="120" width="840" height="40" fill="#151515" rx="8" />
        <text x="50" y="145" fill="#9CA3AF" fontSize="13">Subject:</text>
        <text x="130" y="145" fill="#E5E7EB" fontSize="13">Q4 Budget Sign-off</text>
        
        {/* Compose Area */}
        <rect x="30" y="170" width="840" height="350" fill="#151515" rx="8" />
        
        {/* Typed Content */}
        <text x="50" y="200" fill="#E5E7EB" fontSize="13">Hi Sarah,</text>
        <text x="50" y="225" fill="#E5E7EB" fontSize="13"></text>
        <text x="50" y="250" fill="#E5E7EB" fontSize="13">Thanks for sending over the Q4 budget details. I've</text>
        
        {/* AI Suggestion (highlighted) */}
        <rect x="48" y="260" width="520" height="90" rx="6" fill="#FF4C5A" fillOpacity="0.1" stroke="#FF4C5A" strokeWidth="1" strokeDasharray="4 2" />
        <text x="58" y="280" fill="#FF4C5A" fontSize="13" opacity="0.7">reviewed the numbers and everything looks good. I</text>
        <text x="58" y="300" fill="#FF4C5A" fontSize="13" opacity="0.7">approve the $2.3M total with the $450K marketing</text>
        <text x="58" y="320" fill="#FF4C5A" fontSize="13" opacity="0.7">allocation. You have my sign-off to proceed. Let me</text>
        <text x="58" y="340" fill="#FF4C5A" fontSize="13" opacity="0.7">know if you need anything else.</text>
        
        {/* AI Suggestion Badge */}
        <rect x="580" y="265" width="180" height="28" rx="14" fill="#FF4C5A" fillOpacity="0.2" />
        <text x="600" y="284" fill="#FF4C5A" fontSize="11" fontWeight="600">✨ AI Suggestion</text>
        
        <rect x="580" y="300" width="95" height="24" rx="12" fill="#10B981" fillOpacity="0.2" />
        <text x="595" y="316" fill="#10B981" fontSize="10">✓ Accept</text>
        
        <rect x="685" y="300" width="75" height="24" rx="12" fill="#6B7280" fillOpacity="0.2" />
        <text x="695" y="316" fill="#9CA3AF" fontSize="10">× Skip</text>
        
        {/* Continuation */}
        <text x="50" y="380" fill="#E5E7EB" fontSize="13"></text>
        <text x="50" y="405" fill="#E5E7EB" fontSize="13">Best regards,</text>
        <text x="50" y="430" fill="#9CA3AF" fontSize="13" opacity="0.5">|</text>
      </g>
      
      {/* Toolbar */}
      <rect x="30" y="540" width="840" height="45" fill="#1A1A1A" rx="8" />
      
      {/* Toolbar Buttons */}
      <g opacity="0.8">
        <text x="50" y="567" fill="#9CA3AF" fontSize="18">B</text>
        <text x="80" y="567" fill="#9CA3AF" fontSize="18" fontStyle="italic">I</text>
        <text x="105" y="567" fill="#9CA3AF" fontSize="18" textDecoration="underline">U</text>
        <text x="135" y="567" fill="#9CA3AF" fontSize="16">🔗</text>
        <text x="165" y="567" fill="#9CA3AF" fontSize="16">📎</text>
        <text x="195" y="567" fill="#9CA3AF" fontSize="16">😊</text>
      </g>
      
      {/* Send Button */}
      <rect x="740" y="545" width="120" height="35" rx="18" fill="#FF4C5A" />
      <text x="780" y="568" fill="#FFFFFF" fontSize="14" fontWeight="600" textAnchor="middle">Send ✈️</text>
      
      {/* AI Stats */}
      <rect x="600" y="550" width="120" height="24" rx="12" fill="#3B82F6" fillOpacity="0.2" />
      <text x="615" y="566" fill="#3B82F6" fontSize="10">⚡ 10x faster</text>
    </svg>
  );
}

