'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Mail, Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your easeMail support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          context: {
            mode: 'support',
            previousMessages: messages.slice(-5), // Last 5 messages for context
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again or contact us directly using the information in the sidebar.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-primary" />
            Support & Help Center
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Get instant help from our AI assistant or contact our support team
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-white/70'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl rounded-lg px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contact Information
        </h2>

        {/* Phone Support */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Phone className="text-primary mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                24/7 Phone Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Available 24 hours a day, 7 days a week
              </p>
              <a
                href="tel:+18005551234"
                className="text-primary hover:underline font-medium"
              >
                1-800-555-1234
              </a>
            </div>
          </div>
        </div>

        {/* Email Support */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Mail className="text-primary mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Email Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                We typically respond within 4 hours
              </p>
              <a
                href="mailto:support@easemail.com"
                className="text-primary hover:underline font-medium"
              >
                support@easemail.com
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Quick Links
          </h3>
          <div className="space-y-2">
            <a
              href="/dashboard/settings?tab=help"
              className="block text-sm text-primary hover:underline"
            >
              Help Center & FAQs
            </a>
            <a
              href="/dashboard/settings"
              className="block text-sm text-primary hover:underline"
            >
              Account Settings
            </a>
            <a
              href="https://docs.easemail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-primary hover:underline"
            >
              Documentation
            </a>
          </div>
        </div>

        {/* Support Hours Note */}
        <div className="mt-6 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-900 dark:text-blue-200">
            <strong>Note:</strong> While phone support is available 24/7, email
            responses during business hours (9 AM - 6 PM EST) are typically
            faster.
          </p>
        </div>
      </div>
    </div>
  );
}
