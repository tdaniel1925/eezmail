'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatBot(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
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
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial position on right side after mount
  useEffect(() => {
    setPosition({ x: window.innerWidth - 420, y: 20 });
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
        width: Math.max(300, Math.min(800, size.width + deltaX)),
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

    // TODO: Replace with actual AI API call
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
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

  // Floating button when minimized
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 flex items-center gap-3 group"
        aria-label="Open AI Chatbot"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="font-semibold text-lg">Ask Me Anything</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  const chatWidth = isMaximized ? '90vw' : `${size.width}px`;
  const chatHeight = isMaximized ? '90vh' : `${size.height}px`;
  const chatX = isMaximized ? '5vw' : `${position.x}px`;
  const chatY = isMaximized ? '5vh' : `${position.y}px`;

  return (
    <div
      ref={chatRef}
      className="fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
      style={{
        left: chatX,
        top: chatY,
        width: chatWidth,
        height: chatHeight,
        transition: isMaximized ? 'all 0.3s ease' : 'none',
      }}
    >
      {/* Header - Draggable */}
      <div
        className="chat-header flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Email AI Assistant</h3>
            <p className="text-xs text-white/80">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
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
                'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <p
                className={cn(
                  'text-xs mt-2',
                  message.role === 'user'
                    ? 'text-white/70'
                    : 'text-gray-500 dark:text-gray-400'
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
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
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your emails..."
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            rows={1}
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-gray-400 dark:border-gray-600 group-hover:border-purple-500 transition-colors"></div>
        </div>
      )}
    </div>
  );
}
