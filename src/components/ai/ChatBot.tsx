'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, GripVertical, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useChatbotContext } from './ChatbotContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  needsConfirmation?: boolean;
  actionData?: any;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function ChatBot(): JSX.Element | null {
  const { currentEmail, currentFolder, selectedEmails } = useChatbotContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your email AI assistant. I can help you understand your emails, draft responses, find specific messages, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);
  const [autoSubmitTrigger, setAutoSubmitTrigger] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Operation-specific loading messages
  const OPERATION_MESSAGES: Record<string, string> = {
    compose_email:
      '✉️ Your eezMail Assistant is drafting your email. Just a moment, please...',
    verify_email_address: '🔍 Verifying email address...',
    search_emails: '📧 Searching through your emails...',
    create_contact: '👤 Adding contact to your address book...',
    update_contact: '✏️ Updating contact information...',
    delete_contact: '🗑️ Removing contact...',
    search_contacts: '📇 Looking up contacts...',
    list_contacts: '📋 Retrieving your contact list...',
    find_contact_by_email: '🔎 Searching for contact...',
    create_contact_from_email: '👤 Adding new contact...',
    get_contact_details: '📋 Retrieving contact details...',
    create_folder: '📁 Creating new folder...',
    bulk_move_by_sender: '📦 Moving emails...',
    bulk_move_emails_to_folder: '📦 Organizing emails...',
    create_folder_and_move: '📁 Creating folder and moving emails...',
    bulk_archive: '📥 Archiving emails...',
    bulk_delete: '🗑️ Deleting emails...',
    bulk_mark_read: '✓ Marking emails as read...',
    bulk_star: '⭐ Starring emails...',
    create_email_rule: '⚙️ Creating email rule...',
    create_calendar_event: '📅 Creating calendar event...',
    update_calendar_event: '📅 Updating event...',
    delete_calendar_event: '🗑️ Deleting event...',
    reschedule_event: '📅 Rescheduling event...',
    get_todays_events: "📅 Loading today's schedule...",
    get_upcoming_events: '📅 Loading upcoming events...',
    search_calendar: '🔍 Searching calendar...',
    research_emails: '🔬 Analyzing your emails...',
    summarize_thread: '📝 Summarizing conversation...',
    analyze_attachment: '📎 Analyzing attachment...',
    search_by_attachment: '🔎 Searching by attachment type...',
    reply_to_email: '↩️ Preparing reply...',
    forward_email: '➡️ Preparing forward...',
    get_unread_emails: '📬 Loading unread emails...',
    get_starred_emails: '⭐ Loading starred emails...',
    get_emails_with_attachments: '📎 Finding emails with attachments...',
    default: '⚙️ Processing your request...',
  };

  // Dragging state - start on right side
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing state
  const [size, setSize] = useState({ width: 380, height: 550 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial position on right side after mount
  useEffect(() => {
    setPosition({ x: window.innerWidth - 400, y: 20 });
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false; // Stop after one utterance
        recognition.interimResults = true; // Show real-time transcription
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update input with interim or final transcript
          setInput(finalTranscript + interimTranscript);

          // If this is the final result, auto-submit after a short delay
          const isFinal = event.results[event.results.length - 1].isFinal;
          if (isFinal && finalTranscript.trim()) {
            setTimeout(() => {
              setAutoSubmitTrigger(Date.now());
            }, 500);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast.error('Voice input error. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Toggle voice input
  const toggleVoiceInput = (): void => {
    if (!recognitionRef.current) {
      toast.error('Voice input not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening...');
      } catch (error) {
        console.error('Error starting voice input:', error);
        toast.error('Failed to start voice input.');
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-submit when voice input completes
  useEffect(() => {
    if (autoSubmitTrigger > 0 && input.trim()) {
      handleSend();
    }
  }, [autoSubmitTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent): void => {
    if (
      e.target instanceof HTMLElement &&
      e.target.closest('.chat-header') &&
      !e.target.closest('button')
    ) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }

    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      setSize({
        width: Math.max(300, Math.min(600, size.width + deltaX)),
        height: Math.max(400, Math.min(800, size.height + deltaY)),
      });

      setResizeStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, position, size, resizeStart]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  // Handle send message
  const handleSend = async (): Promise<void> => {
    if (!input.trim()) return;

    // Stop voice input if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setCurrentOperation('default'); // Set initial operation state

    try {
      // Build context object for AI
      const context = {
        currentEmail: currentEmail
          ? {
              id: currentEmail.id,
              subject: currentEmail.subject,
              from: currentEmail.fromAddress as { name: string; email: string },
              snippet: currentEmail.snippet,
              receivedAt: currentEmail.receivedAt,
            }
          : undefined,
        currentFolder: currentFolder || undefined,
        selectedEmails: selectedEmails.length > 0 ? selectedEmails : undefined,
      };

      // Call real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Update operation state if function name is provided
      if (data.functionName) {
        setCurrentOperation(data.functionName);
      }

      // Check if this is a compose_email result
      if (
        data.functionResult?.success &&
        data.functionResult?.subject &&
        data.functionResult?.body
      ) {
        // Trigger compose window with AI-generated content
        const composeEvent = new CustomEvent('ai-compose-email', {
          detail: {
            to: data.functionResult.recipient || '',
            subject: data.functionResult.subject,
            body: data.functionResult.body,
          },
        });
        window.dispatchEvent(composeEvent);

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've drafted an email for you${data.functionResult.recipient ? ` to ${data.functionResult.recipient}` : ''}! Check the compose window that just opened. You can review and edit it before sending.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);

        return;
      }

      // Check if AI wants to perform an action that needs confirmation
      const needsConfirmation = data.functionCall && !data.executed;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || generateMockResponse(input),
        timestamp: new Date(),
        needsConfirmation,
        actionData: needsConfirmation ? data.functionCall : undefined,
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Store pending confirmation
      if (needsConfirmation) {
        setPendingConfirmation(data.functionCall);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to mock response on error
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
      setCurrentOperation(null); // Clear operation state
    }
  };

  // Handle confirmation (yes/no)
  const handleConfirm = async (confirmed: boolean): Promise<void> => {
    if (!pendingConfirmation) return;

    if (!confirmed) {
      const cancelMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Okay, I won't do that. What would you like me to do instead?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cancelMessage]);
      setPendingConfirmation(null);
      return;
    }

    // Execute the action
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionCall: pendingConfirmation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute action');
      }

      const data = await response.json();

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          data.message || 'Done! Is there anything else you need help with?',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, successMessage]);
      setPendingConfirmation(null);
      toast.success('Action completed successfully!');
    } catch (error) {
      console.error('Error executing action:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          'Sorry, I encountered an error while trying to do that. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Action failed. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Mock AI response (replace with real API)
  const generateMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('unread')) {
      return "You have 12 unread emails in your Inbox. The most recent is from Sarah Chen about 'Q4 Marketing Strategy Review'.";
    } else if (lowerQuery.includes('important')) {
      return 'Your most important emails are in the Inbox. You have 3 starred emails that need attention.';
    } else if (
      lowerQuery.includes('summarize') ||
      lowerQuery.includes('summary')
    ) {
      return "I can summarize any email for you! Just click the sparkles icon (✨) next to the sender's name, or tell me which email you'd like summarized.";
    } else if (lowerQuery.includes('draft') || lowerQuery.includes('reply')) {
      return 'I can help you draft a reply! Would you like me to generate a professional response to a specific email?';
    } else if (lowerQuery.includes('find') || lowerQuery.includes('search')) {
      return 'I can help you find emails! Try searching by sender, subject, date, or keywords. What are you looking for?';
    } else {
      return "I'm here to help with your emails! I can summarize messages, draft replies, find specific emails, extract action items, and more. What would you like to do?";
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render on mobile devices
  if (isMobile) {
    return null;
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2.5 rounded-lg shadow-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
        aria-label="Open AI Assistant"
      >
        <Sparkles size={18} />
        <span className="text-sm font-medium">Ask me anything</span>
      </button>
    );
  }

  return (
    <div
      ref={chatRef}
      className="fixed z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {/* Header - Draggable */}
      <div
        className="chat-header flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400" />
          <Sparkles size={16} className="text-gray-600 dark:text-white/60" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Ask me anything
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-white/50">
                {isTyping ? 'Typing...' : 'About your emails'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Close button */}
          <button
            onClick={() => {
              setIsOpen(false);
              if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
                setIsListening(false);
              }
            }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-black/20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2',
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10'
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <p
                className={cn(
                  'text-xs mt-1',
                  message.role === 'user'
                    ? 'text-white/70'
                    : 'text-gray-500 dark:text-white/50'
                )}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator with operation-specific message */}
        {currentOperation && (
          <div className="flex justify-start">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 border border-blue-200 dark:border-blue-800/50 max-w-[85%]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  {OPERATION_MESSAGES[currentOperation] ||
                    OPERATION_MESSAGES.default}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback typing indicator */}
        {isTyping && !currentOperation && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/10">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/10">
        {/* Confirmation buttons */}
        {pendingConfirmation && (
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => handleConfirm(true)}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ✓ Yes, do it
            </button>
            <button
              onClick={() => handleConfirm(false)}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ✗ Cancel
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 resize-none text-sm"
            rows={2}
            disabled={isListening}
          />
          <button
            onClick={toggleVoiceInput}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 flex items-center justify-center',
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white'
            )}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-white/50 mt-1.5">
          Press Enter to send • 🎤 for voice • Drag header to move
        </p>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute bottom-0.5 right-0.5 w-3 h-3 border-r-2 border-b-2 border-gray-300 dark:border-white/20 group-hover:border-primary transition-colors"></div>
      </div>
    </div>
  );
}
