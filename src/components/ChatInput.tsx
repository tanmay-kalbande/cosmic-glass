import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, PlusCircle, Square, ClipboardCheck, GitBranch, Loader2, ChevronDown, Settings, Clock, Paperclip, ArrowUp, Plus } from 'lucide-react';
import type { AIModel } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isQuizLoading: boolean;
  isFlowchartLoading: boolean;
  disabled?: boolean;
  onStopGenerating: () => void;
  onGenerateQuiz: () => void;
  onGenerateFlowchart: () => void;
  canGenerateQuiz: boolean;
  canGenerateFlowchart: boolean;
  currentModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

// Model names mapping for display
const modelDisplayNames: Record<AIModel, string> = {
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemma-3-27b-it': 'Gemma 3',
  'mistral-large-latest': 'Mistral Large',
  'mistral-medium-latest': 'Mistral Medium',
  'mistral-small-latest': 'Mistral Small',
  'codestral-latest': 'Codestral',
  'glm-4.5-flash': 'GLM 4.5',
  'llama-3.3-70b-versatile': 'Llama 3.3',
  'openai/gpt-oss-20b': 'GPT OSS 20B',
  'gpt-oss-120b': 'GPT OSS 120B',
  'qwen-3-235b-a22b-instruct-2507': 'Qwen 3',
  'zai-glm-4.6': 'ZAI GLM 4.6',
};

export function ChatInput({
  onSendMessage,
  isLoading,
  isQuizLoading,
  isFlowchartLoading,
  disabled = false,
  onStopGenerating,
  onGenerateQuiz,
  onGenerateFlowchart,
  canGenerateQuiz,
  canGenerateFlowchart,
  currentModel,
  onModelChange
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showModelDropdown || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelDropdown, showMobileMenu]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(prev => `${prev}${prev ? '\n' : ''}${text}`);
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
    setShowMobileMenu(false);
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className="chat-input px-4 pb-4 pt-2">
      {/* Stop generating button */}
      {isLoading && (
        <div className="flex justify-center mb-2">
          <button
            onClick={onStopGenerating}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-gray-600 transition-all touch-target shadow-sm"
          >
            <Square className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Stop generating</span>
          </button>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl lg:rounded-3xl shadow-sm focus-within:ring-1 focus-within:ring-[var(--color-border)] transition-all"
      >
        {/* Left Actions */}
        <div className="flex items-center gap-1 pb-1 pl-1">

          {/* Mobile Menu Button (Visible only on mobile) */}
          <div className="relative lg:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Mobile Dropdown Menu */}
            {showMobileMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl p-2 min-w-[180px] z-50 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handlePlusClick}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors w-full text-left"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Attach File</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onGenerateQuiz(); setShowMobileMenu(false); }}
                  disabled={!canGenerateQuiz || isQuizLoading || isLoading}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left ${!canGenerateQuiz ? 'opacity-50 cursor-not-allowed text-[var(--color-text-placeholder)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}
                >
                  {isQuizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                  <span>Generate Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onGenerateFlowchart(); setShowMobileMenu(false); }}
                  disabled={!canGenerateFlowchart || isFlowchartLoading || isLoading}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left ${!canGenerateFlowchart ? 'opacity-50 cursor-not-allowed text-[var(--color-text-placeholder)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}
                >
                  {isFlowchartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                  <span>Generate Flowchart</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Actions (Hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={handlePlusClick}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              type="button"
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
              title="Timer"
            >
              <Clock className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onGenerateQuiz}
              disabled={!canGenerateQuiz || isQuizLoading || isLoading}
              className={`p-2 rounded-full transition-colors ${!canGenerateQuiz ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              title="Generate Quiz"
            >
              {isQuizLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={onGenerateFlowchart}
              disabled={!canGenerateFlowchart || isFlowchartLoading || isLoading}
              className={`p-2 rounded-full transition-colors ${!canGenerateFlowchart ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              title="Generate Flowchart"
            >
              {isFlowchartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GitBranch className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json"
          className="hidden"
        />

        {/* Text area */}
        <div className="flex-1 min-w-0 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            disabled={disabled || isLoading}
            className="w-full max-h-[120px] bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] resize-none text-base leading-relaxed"
            rows={1}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 pb-1 pr-1">
          {/* Model Selector */}
          {currentModel && onModelChange && (
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              >
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{modelDisplayNames[currentModel]}</span>
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 max-h-64 overflow-y-auto z-50 min-w-[200px]">
                  {(Object.keys(modelDisplayNames) as AIModel[]).map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        onModelChange(model);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${model === currentModel
                        ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                      {modelDisplayNames[model]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send button */}
          <button
            type="submit"
            disabled={!canSend || isLoading}
            className={`p-2 rounded-full transition-all duration-200 ${!canSend || isLoading
              ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-placeholder)] cursor-not-allowed'
              : 'bg-[var(--color-accent)] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            title={'Send message'}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
