'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatBot(): JSX.Element {
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || generateMockResponse(input),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
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
            <p className="text-xs text-gray-500 dark:text-white/50">
              {isTyping ? 'Typing...' : 'About your emails'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>
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

        {isTyping && (
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
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 resize-none text-sm"
            rows={2}
          />
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
          Press Enter to send • Drag header to move
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
