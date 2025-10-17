'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { sendEmailAction } from '@/lib/chat/actions';
import { EmailComposerModal } from './EmailComposerModal';
import { saveDraft, deleteDraft } from '@/lib/email/draft-actions';
import { scheduleEmail } from '@/lib/email/scheduler-actions';
import { EmojiClickData } from 'emoji-picker-react';

// Define Attachment type locally
interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string;
  url?: string;
  progress?: number;
  error?: string;
}

// Speech Recognition API types
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

// TipTap Editor interface (minimal type for what we use)
interface TipTapEditor {
  commands: {
    clearContent: () => boolean;
    setContent: (content: string) => boolean;
  };
}

// Helper type for accessing Speech Recognition API from window
type SpeechRecognitionConstructor = new () => CustomSpeechRecognition;

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'compose' | 'reply' | 'forward';
  initialData?: {
    to?: string;
    subject?: string;
    body?: string;
  };
}

export function EmailComposer({
  isOpen,
  onClose,
  mode = 'compose',
  initialData,
}: EmailComposerProps): JSX.Element | null {
  const [to, setTo] = useState(initialData?.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [isAIWriting, setIsAIWriting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>(''); // Show real-time transcript
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const dictationRecognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dictationTextRef = useRef<string>(''); // Store dictated text separately
  const dictationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<TipTapEditor | null>(null); // Store TipTap editor instance for direct updates
  const isProcessingDictationRef = useRef<boolean>(false); // Prevent multiple calls to handleStopDictation

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Clear all fields when composer opens (fresh start every time)
  useEffect(() => {
    if (isOpen && !initialData) {
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setDraftId(null);
      setSaveStatus('idle');
      setShowCc(false);
      setShowBcc(false);

      // Clear the editor directly
      if (editorRef.current) {
        editorRef.current.commands.clearContent();
      }
    }
  }, [isOpen, initialData]);

  // Handler functions (defined before useEffects that use them)
  const handleSend = useCallback(async (): Promise<void> => {
    if (!to || !subject || !body) {
      toast.warning('Please fill in all required fields (To, Subject, Body)');
      return;
    }

    setIsSending(true);

    try {
      // Call the actual send email action
      const result = await sendEmailAction({
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        body,
        attachments: attachments.map((att) => ({
          id: att.id,
          name: att.name,
          size: att.size,
          type: att.type,
          data: att.data || '',
        })),
        isHtml: true,
      });

      if (result.success) {
        // Delete draft if it exists
        if (draftId) {
          await deleteDraft(draftId);
        }

        // Reset and close
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setAttachments([]);
        setDraftId(null);
        setSaveStatus('idle');
        onClose();

        toast.success(
          `Email ${mode === 'reply' ? 'reply' : 'sent'} successfully!`
        );
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [to, subject, body, cc, bcc, attachments, mode, draftId, onClose]);

  const handleClose = useCallback(async (): Promise<void> => {
    // Always clear all fields when closing
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setDraftId(null);
    setSaveStatus('idle');
    setShowCc(false);
    setShowBcc(false);

    // Clear the editor directly
    if (editorRef.current) {
      editorRef.current.commands.clearContent();
    }

    onClose();
  }, [onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter: Send email
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }

      // Cmd/Ctrl + S: Manual save draft
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        // Draft is auto-saved, just show a toast
        toast.success('Draft saved');
      }

      // Escape: Close composer (with confirmation if has content)
      if (
        e.key === 'Escape' &&
        !showEmojiPicker &&
        !showTemplateModal &&
        !showSchedulePicker
      ) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isMinimized,
    showEmojiPicker,
    showTemplateModal,
    showSchedulePicker,
    handleSend,
    handleClose,
  ]);

  // Initialize speech recognition for dictation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognitionAPI =
        windowWithSpeech.SpeechRecognition ||
        windowWithSpeech.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true; // Keep listening
        recognition.interimResults = true; // Real-time text
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          // Process all results from the beginning to ensure we capture everything
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update stored text with ALL final transcripts
          if (finalTranscript.trim()) {
            dictationTextRef.current = finalTranscript.trim();
            console.log(
              '🎤 Captured text so far:',
              dictationTextRef.current.length,
              'chars'
            );
          }

          // Show live transcript (final + interim)
          const fullTranscript = (finalTranscript + interimTranscript).trim();
          if (fullTranscript) {
            setLiveTranscript(fullTranscript);
            console.log(
              '📝 Live display:',
              fullTranscript.substring(0, 100) + '...'
            );
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Dictation error:', event.error);
          setIsDictating(false);

          if (event.error === 'not-allowed') {
            toast.error(
              'Microphone permission denied. Please allow microphone access.'
            );
          } else if (event.error === 'no-speech') {
            toast.warning('No speech detected. Try again.');
          } else {
            toast.error(`Dictation error: ${event.error}`);
          }
        };

        // Set optional event handlers (might not be in all TypeScript definitions)
        const recognitionWithEvents = recognition as CustomSpeechRecognition;
        recognitionWithEvents.onstart = () => {
          console.log('🎤 Speech recognition started');
        };

        recognitionWithEvents.onend = () => {
          console.log('🎤 Speech recognition ended');
          setIsDictating(false);
          setLiveTranscript('');
        };

        dictationRecognitionRef.current = recognitionWithEvents;
      } else {
        console.warn('Speech Recognition not supported in this browser');
      }
    }
  }, []);

  // Update fields when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.to) setTo(initialData.to);
      if (initialData.subject) setSubject(initialData.subject);
      if (initialData.body) setBody(initialData.body);
    }
  }, [initialData]);

  // Disabled auto-loading drafts to prevent old text appearing
  // Users can manually load drafts from the Templates button instead
  // useEffect(() => {
  //   const loadRecentDraft = async () => {
  //     if (
  //       isOpen &&
  //       !initialData?.to &&
  //       !initialData?.subject &&
  //       !initialData?.body
  //     ) {
  //       const result = await getRecentDraft();
  //       if (result.success && result.draft) {
  //         const draft = result.draft;
  //         setDraftId(draft.id);
  //         setTo(draft.to || '');
  //         setCc(draft.cc || '');
  //         setBcc(draft.bcc || '');
  //         setSubject(draft.subject || '');
  //         setBody(draft.body || '');
  //         if (draft.attachments && Array.isArray(draft.attachments)) {
  //           setAttachments(draft.attachments as Attachment[]);
  //         }
  //         setSaveStatus('saved');
  //       }
  //     }
  //   };
  //
  //   loadRecentDraft();
  // }, [isOpen, initialData]);

  // Auto-save draft with debouncing
  useEffect(() => {
    // Don't auto-save if composer is closed or minimized
    if (!isOpen || isMinimized) return;

    // Don't auto-save if nothing is entered
    if (!to && !subject && !body && attachments.length === 0) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (debounce for 2 seconds)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');

      const result = await saveDraft({
        draftId: draftId || undefined,
        draftData: {
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          body,
          attachments: attachments.map((att) => ({
            id: att.id,
            name: att.name,
            size: att.size,
            type: att.type,
            data: att.data || '',
          })),
          mode,
        },
      });

      if (result.success && result.draftId) {
        setDraftId(result.draftId);
        setSaveStatus('saved');

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } else {
        setSaveStatus('idle');
        console.error('Failed to save draft:', result.error);
      }
    }, 2000); // 2 second debounce

    // Cleanup function
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    to,
    cc,
    bcc,
    subject,
    body,
    attachments,
    isOpen,
    isMinimized,
    mode,
    draftId,
  ]);

  // Auto-focus body when composer opens
  useEffect(() => {
    if (isOpen && !isMinimized && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSchedule = async (scheduledFor: Date): Promise<void> => {
    if (!to || !subject || !body) {
      toast.warning('Please fill in all required fields (To, Subject, Body)');
      return;
    }

    setIsSending(true);

    try {
      const result = await scheduleEmail({
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        body,
        attachments: attachments.map((att) => ({
          id: att.id,
          name: att.name,
          size: att.size,
          type: att.type,
          data: att.data || '',
        })),
        scheduledFor,
      });

      if (result.success) {
        // Delete draft if it exists
        if (draftId) {
          await deleteDraft(draftId);
        }

        // Reset and close
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setAttachments([]);
        setDraftId(null);
        setSaveStatus('idle');
        onClose();

        const formattedDate = scheduledFor.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        toast.success(`Email scheduled for ${formattedDate}`);
      } else {
        toast.error(result.error || 'Failed to schedule email');
      }
    } catch (error) {
      console.error('Failed to schedule email:', error);
      toast.error('Failed to schedule email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRemix = async (): Promise<void> => {
    if (!body.trim()) {
      toast.warning('Please write some text to remix');
      return;
    }

    setIsRemixing(true);

    try {
      // Strip HTML tags for AI processing
      const plainText = body.replace(/<[^>]*>/g, '');

      const response = await fetch('/api/ai/remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: plainText,
          subject,
          recipientEmail: to,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remix text');
      }

      const data = await response.json();

      if (data.success && data.rewrittenText) {
        // Convert plain text to HTML with ONE blank line between sections
        const htmlContent = data.rewrittenText
          .split('\n\n')
          .filter((para: string) => para.trim()) // Remove empty paragraphs
          .map((para: string) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('<p></p>'); // ONE blank paragraph (not <br>) between sections

        // Update editor directly via commands if available
        if (editorRef.current) {
          editorRef.current.commands.setContent(htmlContent);
        }
        setBody(htmlContent || data.rewrittenText);
        toast.success('✨ Text remixed! Fixed spelling, grammar & structure');
      }
    } catch (error) {
      console.error('Error remixing text:', error);
      toast.error('Failed to remix text. Please try again.');
    } finally {
      setIsRemixing(false);
    }
  };

  const handleDictationToggle = async (): Promise<void> => {
    if (!dictationRecognitionRef.current) {
      toast.error(
        'Voice dictation not supported in this browser. Try Chrome or Edge.'
      );
      return;
    }

    if (isDictating) {
      // Manual stop (user clicked again)
      handleStopDictation();
    } else {
      try {
        // Clear previous dictation
        dictationTextRef.current = '';
        setLiveTranscript('');
        isProcessingDictationRef.current = false; // Reset flag when starting new dictation

        console.log('🎤 Starting speech recognition...');

        // Start listening
        dictationRecognitionRef.current.start();
        setIsDictating(true);
        toast.success(
          "🎤 Start speaking... I'll stop automatically when you're done"
        );
      } catch (error) {
        console.error('Error starting dictation:', error);
        toast.error(
          'Failed to start voice input. Please check microphone permissions.'
        );
        setIsDictating(false);
        dictationTextRef.current = '';
        setLiveTranscript('');
      }
    }
  };

  // Handle silence detection (called by AudioVisualizer)
  const handleSilenceDetected = () => {
    console.log('🔇 Silence detected, stopping dictation...');
    handleStopDictation();
  };

  // Stop dictation and process with AI
  const handleStopDictation = async () => {
    // Prevent multiple calls (from AudioVisualizer AND speech recognition onend)
    if (isProcessingDictationRef.current) {
      console.log('⚠️ Already processing dictation, skipping duplicate call');
      return;
    }

    isProcessingDictationRef.current = true;

    if (dictationTimeoutRef.current) {
      clearTimeout(dictationTimeoutRef.current);
    }

    try {
      if (dictationRecognitionRef.current) {
        dictationRecognitionRef.current.stop();
      }
    } catch (e) {
      console.error('Error stopping recognition:', e);
    }

    setIsDictating(false);

    // Wait a moment for final text to be captured
    await new Promise((resolve) => setTimeout(resolve, 500));

    const transcribedText = dictationTextRef.current.trim();
    console.log('🔍 Final captured text:', transcribedText);
    console.log('📊 Text length:', transcribedText.length, 'characters');
    setLiveTranscript('');

    if (transcribedText.length > 5) {
      toast.info('✨ AI is writing your email from voice...');
      setIsAIWriting(true);

      try {
        const response = await fetch('/api/ai/compose-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: transcribedText,
            context: {
              to,
              subject: subject || undefined,
            },
          }),
        });

        if (!response.ok) throw new Error('Failed to generate email');

        const data = await response.json();

        if (data.success && data.body) {
          // Convert to HTML with ONE blank line between sections
          const htmlContent = data.body
            .split('\n\n')
            .filter((para: string) => para.trim()) // Remove empty paragraphs
            .map((para: string) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
            .join('<p></p>'); // ONE blank paragraph (not <br>) between sections

          // Update editor directly via commands if available
          if (editorRef.current) {
            editorRef.current.commands.setContent(htmlContent);
          }
          setBody(htmlContent);
          if (data.subject && !subject) {
            setSubject(data.subject);
          }
          toast.success('📧 Email written from your voice!');
        } else {
          toast.error('Failed to generate email');
        }
      } catch (error) {
        console.error('Error generating email:', error);
        toast.error('Failed to write email from voice. Try typing manually.');
      } finally {
        setIsAIWriting(false);
        dictationTextRef.current = '';
        isProcessingDictationRef.current = false; // Reset flag
      }
    } else {
      toast.warning(
        'Not enough words captured. Speak for at least a few seconds.'
      );
      dictationTextRef.current = '';
      isProcessingDictationRef.current = false; // Reset flag
    }
  };

  // AI Writer Button: Expand brief text into full email
  const handleAIWriter = async (): Promise<void> => {
    if (!body.trim()) {
      toast.warning('Please write a brief description of your email first');
      return;
    }

    const plainText = body.replace(/<[^>]*>/g, '').trim();

    if (plainText.length < 10) {
      toast.warning('Please write at least a few words for AI to work with');
      return;
    }

    setIsAIWriting(true);

    try {
      toast.info('✨ AI is expanding your text into a full email...');

      const response = await fetch('/api/ai/compose-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: plainText,
          context: {
            to,
            subject: subject || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();

      if (data.success && data.body) {
        // Convert to HTML with ONE blank line between sections
        const htmlContent = data.body
          .split('\n\n')
          .filter((para: string) => para.trim()) // Remove empty paragraphs
          .map((para: string) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('<p></p>'); // ONE blank paragraph (not <br>) between sections

        // Update editor directly via commands if available
        if (editorRef.current) {
          editorRef.current.commands.setContent(htmlContent);
        }
        setBody(htmlContent);
        if (data.subject && !subject) {
          setSubject(data.subject);
        }
        toast.success('✨ AI expanded your text into a full email!');
      } else {
        toast.error('Failed to generate email');
      }
    } catch (error) {
      console.error('Error with AI Writer:', error);
      toast.error('Failed to expand text. Try AI Remix to polish instead.');
    } finally {
      setIsAIWriting(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(Array.from(files));
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]): Promise<void> => {
    for (const file of files) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Add file with initial progress
      const newAttachment: Attachment = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
      };

      setAttachments((prev) => [...prev, newAttachment]);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress (real implementation would use XMLHttpRequest)
        const progressInterval = setInterval(() => {
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === tempId &&
              att.progress !== undefined &&
              att.progress < 90
                ? { ...att, progress: att.progress + 10 }
                : att
            )
          );
        }, 100);

        const response = await fetch('/api/attachments/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        // Update with final data
        setAttachments((prev) =>
          prev.map((att) =>
            att.id === tempId
              ? {
                  id: data.id,
                  name: data.name,
                  size: data.size,
                  type: data.type,
                  data: data.data,
                  progress: 100,
                }
              : att
          )
        );

        // Remove progress after a moment
        setTimeout(() => {
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === data.id ? { ...att, progress: undefined } : att
            )
          );
        }, 500);
      } catch (error) {
        console.error('Error uploading file:', error);
        setAttachments((prev) =>
          prev.map((att) =>
            att.id === tempId
              ? { ...att, progress: undefined, error: 'Upload failed' }
              : att
          )
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  const handleRemoveAttachment = (id: string): void => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleDrop = (event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData): void => {
    // Append emoji to body
    setBody((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSelectTemplate = (
    templateSubject: string,
    templateBody: string
  ): void => {
    setSubject(templateSubject);
    setBody(templateBody);
    toast.success('Template applied successfully');
  };

  if (!isOpen || !mounted) return null;

  return (
    <EmailComposerModal
      to={to}
      setTo={setTo}
      cc={cc}
      setCc={setCc}
      bcc={bcc}
      setBcc={setBcc}
      subject={subject}
      setSubject={setSubject}
      body={body}
      setBody={setBody}
      showCc={showCc}
      setShowCc={setShowCc}
      showBcc={showBcc}
      setShowBcc={setShowBcc}
      isMinimized={isMinimized}
      setIsMinimized={setIsMinimized}
      isSending={isSending}
      mode={mode}
      attachments={attachments}
      handleRemoveAttachment={handleRemoveAttachment}
      fileInputRef={fileInputRef}
      handleFileSelect={handleFileSelect}
      isUploading={isUploading}
      isDragging={isDragging}
      handleDrop={handleDrop}
      handleDragOver={handleDragOver}
      handleDragLeave={handleDragLeave}
      showEmojiPicker={showEmojiPicker}
      setShowEmojiPicker={setShowEmojiPicker}
      handleEmojiClick={handleEmojiClick}
      showTemplateModal={showTemplateModal}
      setShowTemplateModal={setShowTemplateModal}
      handleSelectTemplate={handleSelectTemplate}
      showSchedulePicker={showSchedulePicker}
      setShowSchedulePicker={setShowSchedulePicker}
      showSendMenu={showSendMenu}
      setShowSendMenu={setShowSendMenu}
      saveStatus={saveStatus}
      handleSend={handleSend}
      handleSchedule={handleSchedule}
      handleClose={handleClose}
      handleRemix={handleRemix}
      handleDictationToggle={handleDictationToggle}
      handleAIWriter={handleAIWriter}
      isDictating={isDictating}
      isRemixing={isRemixing}
      isAIWriting={isAIWriting}
      liveTranscript={liveTranscript}
      handleSilenceDetected={handleSilenceDetected}
      onEditorReady={(editor) => (editorRef.current = editor)}
    />
  );
}
