'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useChatbotContext } from './ChatbotContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

export function ChatInterface(): JSX.Element {
  const { currentEmail, currentFolder } = useChatbotContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your AI email assistant. I can help you understand emails, draft responses, find messages, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript + ' ');
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast.error('Voice input error. Please try again.');
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: input.trim(),
            },
          ],
          context: {
            currentEmail: currentEmail
              ? {
                  id: currentEmail.id,
                  subject: currentEmail.subject,
                  from: currentEmail.fromAddress?.email,
                }
              : null,
            currentFolder: currentFolder || 'inbox',
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Check if AI wants to call a function
      if (data.functionCall) {
        const { name, arguments: args } = data.functionCall;

        // Show what function is being executed
        const executingMessage: Message = {
          id: Date.now().toString() + '-executing',
          role: 'assistant',
          content: `🔄 Executing: ${name}...`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, executingMessage]);

        try {
          // Execute the function
          const executeResponse = await fetch('/api/chat/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: name,
              arguments: args,
            }),
          });

          const executeData = await executeResponse.json();

          // Remove the "executing" message and show results
          setMessages((prev) => prev.filter((m) => m.id !== executingMessage.id));

          let resultContent = '';
          if (executeData.success) {
            if (executeData.emails && executeData.emails.length > 0) {
              // Format email results nicely
              resultContent = `✅ ${executeData.message}\n\n`;
              executeData.emails.slice(0, 5).forEach((email: any, idx: number) => {
                const from = typeof email.fromAddress === 'string' 
                  ? email.fromAddress 
                  : email.fromAddress?.name || email.fromAddress?.email || 'Unknown';
                const date = new Date(email.receivedAt).toLocaleDateString();
                resultContent += `${idx + 1}. **${email.subject}**\n   From: ${from}\n   Date: ${date}\n   ${email.bodyPreview || ''}...\n\n`;
              });
              if (executeData.emails.length > 5) {
                resultContent += `...and ${executeData.emails.length - 5} more`;
              }
            } else {
              resultContent = `✅ ${executeData.message || 'Action completed successfully'}`;
            }
          } else {
            resultContent = `⚠️ ${executeData.message || executeData.error}`;
          }

          const resultMessage: Message = {
            id: Date.now().toString() + '-result',
            role: 'assistant',
            content: resultContent,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, resultMessage]);
        } catch (error) {
          console.error('Function execution error:', error);
          
          // Remove executing message
          setMessages((prev) => prev.filter((m) => m.id !== executingMessage.id));
          
          const errorMessage: Message = {
            id: Date.now().toString() + '-error',
            role: 'assistant',
            content: `❌ Failed to execute ${name}. Please try again or use the UI.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // Regular text response
        const assistantMessage: Message = {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: data.response || 'Sorry, I could not process that request.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      toast.info('Listening... Speak now');
    }
  };

  return (
    <div className="flex flex-col">
      <h3 className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
        AI Chat
      </h3>

      {/* Context Indicator */}
      {currentEmail && (
        <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-xs text-blue-700 dark:border-gray-700 dark:bg-blue-900/20 dark:text-blue-400">
          📧 Viewing: {currentEmail.subject}
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 space-y-3 overflow-y-auto p-4"
        style={{ maxHeight: '400px' }}
      >
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
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">AI is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            disabled={isTyping}
          />
          <button
            onClick={toggleVoiceInput}
            className={cn(
              'rounded-md p-2 transition-colors',
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="rounded-md bg-primary p-2 text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
