'use client';

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
  Lightbulb,
  Users,
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { AttachmentList } from './AttachmentList';
import { TemplateModal } from './TemplateModal';
import { SchedulePicker } from './SchedulePicker';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AudioVisualizer } from './AudioVisualizer';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { WritingCoach } from './WritingCoach';
import { AIAssistantMenu } from './AIAssistantMenu';
import { RecipientInput } from './RecipientInput';
import {
  GroupRecipientSelector,
  type SelectedGroup,
} from './GroupRecipientSelector';
import { useState } from 'react';

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
}

export function EmailComposerModal(props: EmailComposerModalProps) {
  // Internal state for Writing Coach
  const [showWritingCoach, setShowWritingCoach] = useState(false);

  // Group selection state
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<SelectedGroup[]>([]);

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
          width: props.isMinimized ? '300px' : '95%',
          maxWidth: props.isMinimized ? '300px' : '1000px',
          height: props.isMinimized ? '60px' : '85vh',
          maxHeight: props.isMinimized ? '60px' : '700px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#FF4C5A] px-4 py-3 text-white dark:border-gray-700">
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

              {/* Writing Coach Sidebar */}
              {showWritingCoach && (
                <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                  <WritingCoach
                    content={props.body}
                    onClose={() => setShowWritingCoach(false)}
                  />
                </div>
              )}
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
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Split Send Button */}
                  <div className="relative inline-flex">
                    <button
                      onClick={props.handleSend}
                      disabled={props.isSending}
                      className="flex items-center space-x-2 rounded-l-md bg-[#FF4C5A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#FF3545] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span>{props.isSending ? 'Sending...' : 'Send'}</span>
                    </button>
                    <button
                      onClick={() => props.setShowSendMenu(!props.showSendMenu)}
                      disabled={props.isSending}
                      className="rounded-r-md border-l border-white/20 bg-[#FF4C5A] px-2 py-2 text-white transition-colors hover:bg-[#FF3545] disabled:cursor-not-allowed disabled:opacity-50"
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
                      <div className="absolute bottom-full mb-2 left-0 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <button
                          onClick={() => {
                            props.handleSend();
                            props.setShowSendMenu(false);
                          }}
                          className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Send className="h-4 w-4" />
                          <span>Send now</span>
                        </button>
                        <button
                          onClick={() => {
                            props.setShowSchedulePicker(true);
                            props.setShowSendMenu(false);
                          }}
                          className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Schedule send...</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={props.fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={props.handleFileSelect}
                  />

                  {/* Toolbar buttons with text labels */}
                  <button
                    onClick={() => props.fileInputRef.current?.click()}
                    disabled={props.isUploading}
                    className="flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>Attach</span>
                  </button>

                  <button
                    onClick={() => props.setShowTemplateModal(true)}
                    className="flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white bg-[#FF4C5A] hover:bg-[#FF3545] transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Template</span>
                  </button>

                  {/* Dictate to AI Button - Voice to Full Email */}
                  <button
                    onClick={props.handleDictationToggle}
                    className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      props.isDictating
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
                    }`}
                    title="Speak about your email and AI will write it for you"
                  >
                    {props.isDictating ? (
                      <>
                        <MicOff className="h-4 w-4 animate-pulse" />
                        <span>Stop AI</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        <span>Dictate to AI</span>
                      </>
                    )}
                  </button>

                  {/* AI Assistant Menu - Consolidated AI Tools */}
                  <AIAssistantMenu
                    onExpandText={props.handleAIWriter}
                    onFixGrammar={props.handleRemix}
                    onToggleCoach={() => setShowWritingCoach(!showWritingCoach)}
                    isCoachOpen={showWritingCoach}
                    isAIWriting={props.isAIWriting}
                    isRemixing={props.isRemixing}
                    disabled={!props.body}
                  />

                  {/* Record Audio Button */}
                  <AnimatedButton
                    variant={
                      props.isRecordingVoiceMessage ? 'ripple' : 'particles'
                    }
                    onClick={props.onVoiceModeToggle}
                    disabled={props.isUploadingVoice}
                    loading={props.isUploadingVoice}
                    icon={
                      props.isRecordingVoiceMessage ? (
                        <MicOff className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )
                    }
                    className={`text-sm ${props.isRecordingVoiceMessage ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'}`}
                    title={
                      props.isRecordingVoiceMessage
                        ? 'Stop recording audio message'
                        : 'Record an audio message to attach to the email'
                    }
                  >
                    {props.isUploadingVoice
                      ? 'Uploading...'
                      : props.isRecordingVoiceMessage
                        ? 'Stop'
                        : 'Record Audio'}
                  </AnimatedButton>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {props.saveStatus === 'saving' && (
                    <span>Saving draft...</span>
                  )}
                  {props.saveStatus === 'saved' && (
                    <span className="text-green-600">Draft saved</span>
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
