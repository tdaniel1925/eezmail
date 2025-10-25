'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Paperclip,
  AtSign,
  Minimize2,
  Maximize2,
  Sparkles,
  Mic,
  MicOff,
  FileText,
  Clock,
  Play,
  Pause,
  Wand2,
  PenTool,
  Users,
  CalendarClock,
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { AttachmentList } from './AttachmentList';
import { TemplateModal } from './TemplateModal';
import { SchedulePicker } from './SchedulePicker';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AudioVisualizer } from './AudioVisualizer';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { WritingCoach } from './WritingCoach';
import { RecipientInput } from './RecipientInput';
import {
  GroupRecipientSelector,
  type SelectedGroup,
} from './GroupRecipientSelector';

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

interface EmailComposerModalProps {
  to: string;
  setTo: (value: string) => void;
  cc: string;
  setCc: (value: string) => void;
  bcc: string;
  setBcc: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
  onEditorReady: (editor: any) => void;
  showCc: boolean;
  setShowCc: (value: boolean) => void;
  showBcc: boolean;
  setShowBcc: (value: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
  isSending: boolean;
  mode: 'compose' | 'reply' | 'forward';
  attachments: Attachment[];
  handleRemoveAttachment: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  isDragging: boolean;
  handleDrop: (event: React.DragEvent) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: () => void;
  showTemplateModal: boolean;
  setShowTemplateModal: (value: boolean) => void;
  handleSelectTemplate: (subject: string, body: string) => void;
  showSchedulePicker: boolean;
  setShowSchedulePicker: (value: boolean) => void;
  showSendMenu: boolean;
  setShowSendMenu: (value: boolean) => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  handleSend: () => void;
  handleSchedule: (scheduledFor: Date) => void;
  handleClose: () => void;
  handleRemix: () => void;
  handleDictationToggle: () => void;
  handleAIWriter: () => void;
  isDictating: boolean;
  isRemixing: boolean;
  isAIWriting: boolean;
  liveTranscript: string;
  handleSilenceDetected: () => void;
  // Voice message props
  isVoiceMode: boolean;
  voiceMessage: {
    url: string;
    duration: number;
    size: number;
    format: string;
  } | null;
  isUploadingVoice: boolean;
  onVoiceModeToggle: () => void;
  onVoiceRecordingComplete: (result: {
    blob: Blob;
    duration: number;
    size: number;
    format: string;
    url: string;
  }) => void;
  onRemoveVoiceMessage: () => void;
  isRecordingVoiceMessage: boolean;
  voiceRecordingDuration: number;
  maxVoiceRecordingDuration: number;
  isPlayingVoiceMessage: boolean;
  onPlayVoiceMessage: () => void;
  handleVoiceMessageSilenceDetected: () => void;
  // Writing Coach props
  showWritingCoach: boolean;
  setShowWritingCoach: (value: boolean) => void;
  coachWidth: number;
  setCoachWidth: (value: number) => void;
}

export function EmailComposerModal(props: EmailComposerModalProps) {
  // Tab state for composer tabs
  const [activeTab, setActiveTab] = useState<
    'compose' | 'templates' | 'scheduled'
  >('compose');

  // Group selection state
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<SelectedGroup[]>([]);

  // Resizing state for Writing Coach
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize for Writing Coach
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    // Calculate new width based on mouse position
    // The width is from the right edge of the window
    const newWidth = window.innerWidth - e.clientX;

    // Clamp width between 200px and 600px
    const clampedWidth = Math.max(200, Math.min(600, newWidth));
    props.setCoachWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, props.coachWidth]);

  const handleSelectGroups = (groups: SelectedGroup[]) => {
    setSelectedGroups(groups);

    // Extract all member emails and add to "To" field
    const allEmails = groups.flatMap((g) => g.memberEmails).filter(Boolean);
    const currentEmails = props.to
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const newEmails = allEmails.filter(
      (email) => !currentEmails.includes(email)
    );

    if (newEmails.length > 0) {
      const updatedTo =
        currentEmails.length > 0
          ? `${props.to}, ${newEmails.join(', ')}`
          : newEmails.join(', ');
      props.setTo(updatedTo);
    }
  };

  const handleRemoveGroup = (groupId: string) => {
    const group = selectedGroups.find((g) => g.id === groupId);
    if (!group) return;

    setSelectedGroups((prev) => prev.filter((g) => g.id !== groupId));

    // Remove group emails from "To" field
    const currentEmails = props.to
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const updatedEmails = currentEmails.filter(
      (email) => !group.memberEmails.includes(email)
    );
    props.setTo(updatedEmails.join(', '));
  };

  return createPortal(
    <div>
      {/* Backdrop */}
      {!props.isMinimized && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
          onClick={props.handleClose}
        />
      )}

      {/* Composer Window */}
      <div
        className="fixed flex flex-col overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl dark:bg-gray-900"
        style={{
          zIndex: 9999,
          bottom: props.isMinimized ? '0' : '5%',
          right: props.isMinimized ? '20px' : '50%',
          transform: props.isMinimized ? 'none' : 'translateX(50%)',
          width: props.isMinimized ? '300px' : '90%',
          maxWidth: props.isMinimized ? '300px' : '900px',
          height: props.isMinimized ? '60px' : '85vh',
          maxHeight: props.isMinimized ? '60px' : '700px',
        }}
      >
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          {/* Title Bar */}
          <div className="flex items-center justify-between bg-[#FF4C5A] px-4 py-3 text-white">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">
                {props.mode === 'reply'
                  ? 'Reply'
                  : props.mode === 'forward'
                    ? 'Forward'
                    : 'New Message'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => props.setIsMinimized(!props.isMinimized)}
                className="rounded p-1 hover:bg-white/20 transition-colors"
              >
                {props.isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={props.handleClose}
                className="rounded p-1 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs with Attach Button */}
          <div className="flex items-center justify-between gap-1 bg-gray-50 dark:bg-gray-800/50 px-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('compose')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'compose'
                    ? 'border-[#FF4C5A] text-[#FF4C5A] dark:text-[#FF4C5A]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Compose email"
              >
                <FileText className="h-4 w-4" />
                <span>Compose</span>
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'templates'
                    ? 'border-[#FF4C5A] text-[#FF4C5A] dark:text-[#FF4C5A]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Browse email templates"
              >
                <FileText className="h-4 w-4" />
                <span>Templates</span>
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'scheduled'
                    ? 'border-[#FF4C5A] text-[#FF4C5A] dark:text-[#FF4C5A]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="View scheduled emails"
              >
                <CalendarClock className="h-4 w-4" />
                <span>Scheduled</span>
              </button>
            </div>

            {/* Attach Button (moved to tabs area) */}
            <div className="flex items-center">
              {/* Hidden file input */}
              <input
                ref={props.fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={props.handleFileSelect}
              />
              <button
                onClick={() => props.fileInputRef.current?.click()}
                disabled={props.isUploading}
                className="inline-flex items-center gap-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Attach</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body (hidden when minimized) */}
        {!props.isMinimized && (
          <>
            {/* Recipients Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {/* Selected Groups Display */}
              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-3">
                  {selectedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: group.color }}
                    >
                      <Users className="h-3 w-3" />
                      <span>
                        {group.name} ({group.memberCount})
                      </span>
                      <button
                        onClick={() => handleRemoveGroup(group.id)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* To Field */}
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                <label className="w-16 text-sm text-gray-600 dark:text-gray-400">
                  To:
                </label>
                <RecipientInput
                  value={props.to}
                  onChange={props.setTo}
                  placeholder="recipient@example.com"
                />
                <div className="flex items-center space-x-2 text-sm ml-2">
                  {/* Group Selector Button */}
                  <button
                    onClick={() => setShowGroupSelector(true)}
                    className="flex items-center gap-1 text-[#FF4C5A] hover:text-[#FF4C5A]/80 transition-colors"
                    title="Select groups"
                    type="button"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  {!props.showCc && (
                    <button
                      onClick={() => props.setShowCc(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                      title="Add Cc"
                      type="button"
                    >
                      <AtSign className="h-3.5 w-3.5" />
                      <span>Cc</span>
                    </button>
                  )}
                  {!props.showBcc && (
                    <button
                      onClick={() => props.setShowBcc(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                      title="Add Bcc"
                      type="button"
                    >
                      <AtSign className="h-3.5 w-3.5" />
                      <span>Bcc</span>
                    </button>
                  )}
                </div>
              </div>

              {props.showCc && (
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                  <label className="w-16 text-sm text-gray-600 dark:text-gray-400">
                    Cc:
                  </label>
                  <RecipientInput
                    value={props.cc}
                    onChange={props.setCc}
                    placeholder="cc@example.com"
                  />
                </div>
              )}

              {props.showBcc && (
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                  <label className="w-16 text-sm text-gray-600 dark:text-gray-400">
                    Bcc:
                  </label>
                  <RecipientInput
                    value={props.bcc}
                    onChange={props.setBcc}
                    placeholder="bcc@example.com"
                  />
                </div>
              )}

              <div className="flex items-center px-4 py-2">
                <label className="w-20 text-sm text-gray-600 dark:text-gray-400">
                  Subject:
                </label>
                <input
                  type="text"
                  value={props.subject}
                  onChange={(e) => props.setSubject(e.target.value)}
                  placeholder="Subject"
                  className="flex-1 border-none bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-white"
                />
              </div>
            </div>

            {/* Drag and Drop Overlay */}
            {props.isDragging && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
                <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
                  <Paperclip className="mx-auto h-12 w-12 text-blue-500" />
                  <p className="mt-4 text-lg font-semibold">
                    Drop files here to attach
                  </p>
                </div>
              </div>
            )}

            {/* Editor Section with Writing Coach */}
            <div className="flex flex-1 overflow-hidden">
              {/* Editor */}
              <div
                className="flex-1 overflow-y-auto px-4 py-3"
                onDrop={props.handleDrop}
                onDragOver={props.handleDragOver}
                onDragLeave={props.handleDragLeave}
              >
                <RichTextEditor
                  value={props.body}
                  onChange={props.setBody}
                  onEditorReady={props.onEditorReady}
                />
              </div>

              {/* Writing Coach Sidebar - COMMENTED OUT */}
              {/* {props.showWritingCoach && (
                <div 
                  className="relative border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 flex-shrink-0"
                  style={{ width: `${props.coachWidth}px` }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/50 transition-colors z-10"
                    onMouseDown={handleMouseDown}
                  />
                  
                  <WritingCoach
                    content={props.body}
                    onClose={() => props.setShowWritingCoach(false)}
                  />
                </div>
              )} */}
            </div>

            {/* Audio Visualizer + Live Transcript (when dictating) */}
            {props.isDictating && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <AudioVisualizer
                  isActive={props.isDictating}
                  onSilenceDetected={props.handleSilenceDetected}
                  silenceThreshold={3500}
                  volumeThreshold={20}
                />
                {props.liveTranscript && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                      What you're saying:
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {props.liveTranscript}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Attachments Section */}
            {props.attachments.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <AttachmentList
                  attachments={props.attachments}
                  onRemove={props.handleRemoveAttachment}
                />
              </div>
            )}

            {/* Voice Message Recording (when recording voice message) */}
            {props.isRecordingVoiceMessage && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recording Voice Message...
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.floor(props.voiceRecordingDuration / 60)}:
                    {String(props.voiceRecordingDuration % 60).padStart(2, '0')}{' '}
                    / {Math.floor(props.maxVoiceRecordingDuration / 60)}:
                    {String(props.maxVoiceRecordingDuration % 60).padStart(
                      2,
                      '0'
                    )}
                  </span>
                </div>
                <AudioVisualizer
                  isActive={props.isRecordingVoiceMessage}
                  onSilenceDetected={props.handleVoiceMessageSilenceDetected}
                  silenceThreshold={3500}
                  volumeThreshold={20}
                />
              </div>
            )}

            {/* Voice Message Playback (after recording) */}
            {props.voiceMessage && !props.isRecordingVoiceMessage && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={props.onPlayVoiceMessage}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      {props.isPlayingVoiceMessage ? (
                        <Pause className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      ) : (
                        <Play className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      )}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Voice Message
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.floor(props.voiceMessage.duration / 60)}:
                        {String(props.voiceMessage.duration % 60).padStart(
                          2,
                          '0'
                        )}{' '}
                        • {(props.voiceMessage.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={props.onRemoveVoiceMessage}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/80 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left Side - Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Primary Send Button Group */}
                  <div className="relative inline-flex rounded-lg shadow-sm hover:shadow-md transition-all">
                    <button
                      onClick={props.handleSend}
                      disabled={props.isSending}
                      className="flex items-center gap-2 rounded-l-lg bg-gradient-to-br from-[#FF4C5A] via-[#FF4C5A] to-[#FF3545] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    >
                      <Send className="h-4 w-4" />
                      <span>{props.isSending ? 'Sending...' : 'Send'}</span>
                    </button>
                    <button
                      onClick={() => props.setShowSendMenu(!props.showSendMenu)}
                      disabled={props.isSending}
                      className="rounded-r-lg border-l border-white/20 bg-gradient-to-br from-[#FF4C5A] via-[#FF4C5A] to-[#FF3545] px-2.5 py-2.5 text-white transition-all hover:bg-[#FF3545] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Send Menu Dropdown */}
                    {props.showSendMenu && (
                      <div className="absolute bottom-full mb-2 left-0 w-56 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-lg shadow-2xl dark:border-gray-700 dark:bg-gray-800/95 overflow-hidden">
                        <button
                          onClick={() => {
                            props.handleSend();
                            props.setShowSendMenu(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors"
                        >
                          <Send className="h-4 w-4 text-[#FF4C5A]" />
                          <div>
                            <div className="font-medium">Send now</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Send immediately
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            props.setShowSchedulePicker(true);
                            props.setShowSendMenu(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors"
                        >
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">Schedule send</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Pick a time to send
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

                  {/* AI Tools Group */}
                  <div className="flex items-center gap-2">
                    {/* AI Remix Button */}
                    <button
                      onClick={props.handleRemix}
                      disabled={!props.body || props.isRemixing}
                      className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all shadow-sm hover:shadow bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 border border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Rewrite any text into a professional email"
                    >
                      {props.isRemixing ? (
                        <>
                          <Wand2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Remixing...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          <span className="hidden sm:inline">AI Remix</span>
                        </>
                      )}
                    </button>

                    {/* AI Writer Button */}
                    <button
                      onClick={props.handleAIWriter}
                      disabled={!props.body || props.isAIWriting}
                      className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all shadow-sm hover:shadow bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 border border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Expand brief notes into a full email"
                    >
                      {props.isAIWriting ? (
                        <>
                          <PenTool className="h-4 w-4 animate-pulse" />
                          <span className="hidden sm:inline">Writing...</span>
                        </>
                      ) : (
                        <>
                          <PenTool className="h-4 w-4" />
                          <span className="hidden sm:inline">AI Writer</span>
                        </>
                      )}
                    </button>

                    {/* AI Dictation Button */}
                    <button
                      onClick={props.handleDictationToggle}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all shadow-sm hover:shadow ${
                        props.isDictating
                          ? 'bg-red-500 text-white hover:bg-red-600 border border-red-600'
                          : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 border border-purple-600'
                      }`}
                      title="Speak naturally and AI will compose a professional email for you"
                    >
                      {props.isDictating ? (
                        <>
                          <MicOff className="h-4 w-4 animate-pulse" />
                          <span className="hidden sm:inline">Stop</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Dictate</span>
                        </>
                      )}
                    </button>

                    {/* Voice Message Button */}
                    <button
                      onClick={props.onVoiceModeToggle}
                      disabled={props.isUploadingVoice}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all shadow-sm hover:shadow ${
                        props.isRecordingVoiceMessage
                          ? 'bg-red-500 text-white hover:bg-red-600 border border-red-600 animate-pulse'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 border border-blue-600'
                      }`}
                      title={
                        props.isRecordingVoiceMessage
                          ? 'Stop recording voice message'
                          : 'Record a voice message to attach as an audio file'
                      }
                    >
                      {props.isRecordingVoiceMessage ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {props.isUploadingVoice
                          ? 'Uploading...'
                          : props.isRecordingVoiceMessage
                            ? 'Recording'
                            : 'Voice Msg'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right Side - Status Info */}
                <div className="flex items-center gap-4 text-xs font-medium">
                  {/* Save Status */}
                  {props.saveStatus === 'saving' && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {props.saveStatus === 'saved' && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Saved</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={props.showTemplateModal}
        onClose={() => props.setShowTemplateModal(false)}
        onSelect={props.handleSelectTemplate}
      />

      {/* Schedule Picker Modal */}
      <SchedulePicker
        isOpen={props.showSchedulePicker}
        onClose={() => props.setShowSchedulePicker(false)}
        onSchedule={props.handleSchedule}
      />

      {/* Group Recipient Selector Modal */}
      <GroupRecipientSelector
        open={showGroupSelector}
        onOpenChange={setShowGroupSelector}
        onSelectGroups={handleSelectGroups}
        selectedGroupIds={selectedGroups.map((g) => g.id)}
      />
    </div>,
    document.body
  );
}
