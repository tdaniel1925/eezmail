'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useChatbotContext } from './ChatbotContext';
import { EmailResultCard } from './EmailResultCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTemporary?: boolean;
  emails?: any[];
  contacts?: any[];
  usedInternetSearch?: boolean;
  searchResults?: any[];
  draft?: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    accountId: string;
    fromEmail: string;
  };
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

    // Add instant "thinking" acknowledgment
    const thinkingMessage: Message = {
      id: Date.now().toString() + '-thinking',
      role: 'assistant',
      content: '🤔 Thinking...',
      timestamp: new Date(),
      isTemporary: true,
    };
    setMessages((prev) => [...prev, thinkingMessage]);
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

      // Remove thinking message
      setMessages((prev) => prev.filter((m) => !m.isTemporary));

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
          setMessages((prev) =>
            prev.filter((m) => m.id !== executingMessage.id)
          );

          let resultContent = '';
          if (executeData.success) {
            // Handle draft generation
            if (executeData.draft) {
              const draftMessage: Message = {
                id: Date.now().toString() + '-draft',
                role: 'assistant',
                content: `✅ ${executeData.message}\n\nI've prepared an email draft for you to review. Click the button below to open it in the composer.`,
                timestamp: new Date(),
                draft: executeData.draft,
              };
              setMessages((prev) => [...prev, draftMessage]);
              toast.success('Draft ready for review!');
              return; // Skip generic rendering
            }
            // Format email results nicely
            else if (executeData.emails && executeData.emails.length > 0) {
              // Store emails in message for rendering as cards
              const resultMessage: Message = {
                id: Date.now().toString() + '-result',
                role: 'assistant',
                content: `✅ ${executeData.message}`,
                timestamp: new Date(),
                emails: executeData.emails,
              };
              setMessages((prev) => [...prev, resultMessage]);
              return; // Skip the generic content rendering
            }
            // Format contact results nicely
            else if (executeData.contacts && executeData.contacts.length > 0) {
              resultContent = `✅ ${executeData.message}\n\n`;
              executeData.contacts
                .slice(0, 10)
                .forEach((contact: any, idx: number) => {
                  resultContent += `${idx + 1}. **${contact.name || 'No name'}**\n   Email: ${contact.email}\n\n`;
                });
              if (executeData.contacts.length > 10) {
                resultContent += `...and ${executeData.contacts.length - 10} more`;
              }
            }
            // Generic success message
            else {
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
          setMessages((prev) =>
            prev.filter((m) => m.id !== executingMessage.id)
          );

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
          usedInternetSearch: data.usedInternetSearch || false,
          searchResults: data.searchResults || undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Show a toast if internet search was used
        if (data.usedInternetSearch) {
          toast.success('🌐 Enhanced answer with internet search results');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove thinking message on error
      setMessages((prev) => prev.filter((m) => !m.isTemporary));
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
    <div className="flex h-full flex-col">
      <h3 className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
        AI Chat
      </h3>

      {/* Context Indicator */}
      {currentEmail && (
        <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-xs text-blue-700 dark:border-gray-700 dark:bg-blue-900/20 dark:text-blue-400">
          📧 Viewing: {currentEmail.subject}
        </div>
      )}

      {/* Messages - Now takes all available space */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                'max-w-[85%] rounded-lg text-sm',
                message.role === 'user'
                  ? 'bg-primary px-3 py-2 text-white'
                  : message.emails && message.emails.length > 0
                    ? 'w-full space-y-2'
                    : 'bg-gray-100 px-3 py-2 text-gray-900 dark:bg-gray-800 dark:text-white'
              )}
            >
              {/* Text content */}
              {message.content && (
                <div
                  className={cn(
                    message.emails &&
                      message.emails.length > 0 &&
                      'mb-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800'
                  )}
                >
                  {message.content}
                </div>
              )}

              {/* Email cards */}
              {message.emails && message.emails.length > 0 && (
                <div className="space-y-2">
                  {message.emails.slice(0, 5).map((email: any) => (
                    <EmailResultCard
                      key={email.id}
                      email={email}
                      onOpen={(id) => {
                        window.location.href = `/dashboard/inbox?emailId=${id}`;
                      }}
                      onReply={(id) => {
                        toast.info('Reply feature coming soon!');
                      }}
                      onForward={(id) => {
                        toast.info('Forward feature coming soon!');
                      }}
                      onArchive={(id) => {
                        toast.info('Archive feature coming soon!');
                      }}
                    />
                  ))}
                  {message.emails.length > 5 && (
                    <p className="rounded-lg bg-gray-100 px-3 py-2 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      ...and {message.emails.length - 5} more email
                      {message.emails.length - 5 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Draft preview button */}
              {message.draft && (
                <button
                  onClick={() => {
                    // Open email composer with pre-filled data
                    const composerEvent = new CustomEvent(
                      'open-email-composer',
                      {
                        detail: {
                          to: message.draft.to,
                          subject: message.draft.subject,
                          body: message.draft.body,
                          cc: message.draft.cc,
                          bcc: message.draft.bcc,
                        },
                      }
                    );
                    window.dispatchEvent(composerEvent);
                    toast.success('Opening draft in composer...');
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
                >
                  <Mail className="h-4 w-4" />
                  Open in Composer
                </button>
              )}
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

      {/* Input - Fixed at bottom with larger textarea */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything... (Press Enter to send, Shift+Enter for new line)"
            rows={3}
            className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            disabled={isTyping}
          />
          <div className="flex flex-col space-y-1">
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
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
