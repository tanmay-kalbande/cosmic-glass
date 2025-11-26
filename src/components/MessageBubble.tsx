import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, Copy, Check, Edit2, RefreshCcw, Save, X, Bookmark, Download, Smile } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
  onSaveAsNote?: (content: string) => void;
}

const modelNames: Record<string, string> = {
  // Google Models
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemma-3-27b-it': 'Gemma 3 27B',
  // Mistral Models
  'mistral-large-latest': 'Mistral Large',
  'mistral-medium-latest': 'Mistral Medium',
  'mistral-small-latest': 'Mistral Small',
  'codestral-latest': 'Codestral',
  // Zhipu Models
  'glm-4.5-flash': 'GLM 4.5 Flash',
  // Groq Models
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'openai/gpt-oss-20b': 'GPT OSS 20B',
  // Cerebras Models
  'gpt-oss-120b': 'GPT OSS 120B',
  'qwen-3-235b-a22b-instruct-2507': 'Qwen 3 235B',
  'zai-glm-4.6': 'ZAI GLM 4.6',
};

// Memoized code block component to prevent unnecessary re-renders
const CodeBlock = React.memo(({ language, children }: { language: string; children: string; }) => {
  const [copied, setCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeContent]);

  return (
    <div className="relative my-3 text-sm will-change-transform rounded-lg overflow-hidden">
      <div className="absolute right-2 top-2 flex items-center gap-2 z-10">
        <span className="text-[11px] text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded font-medium">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="interactive-button p-1.5 bg-gray-800/80 rounded hover:bg-gray-700 text-gray-300 transition-colors touch-target"
          title={'Copy code'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="!bg-[#1a1a1a] rounded-lg !p-4 !pt-10 border border-white/5"
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
});

// Memoized streaming indicator to prevent layout shifts
const StreamingIndicator = React.memo(() => (
  <span className="inline-flex items-center ml-1">
    <span className="w-2 h-2 bg-[var(--color-text-placeholder)] rounded-full animate-pulse" />
  </span>
));

// Memoized action buttons - compact toolbar
const ActionButtons = React.memo(({ isUser, onRegenerate, onEdit, onCopy, onSaveNote, onExport, copied, noteSaved }: {
  isUser: boolean;
  onRegenerate?: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onSaveNote: () => void;
  onExport: () => void;
  copied: boolean;
  noteSaved: boolean;
}) => (
  <div className="flex items-center gap-1 mt-2 text-[var(--color-text-secondary)]">
    {!isUser && onRegenerate && (
      <button
        onClick={onRegenerate}
        className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        title={'Regenerate response'}
      >
        <RefreshCcw className="w-4 h-4" />
      </button>
    )}
    <button
      onClick={onCopy}
      className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      title={'Copy message'}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
    {!isUser && (
      <button
        onClick={onSaveNote}
        className={`p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] transition-colors ${noteSaved ? 'text-blue-400' : 'hover:text-[var(--color-text-primary)]'}`}
        title={'Save as Note'}
      >
        <Bookmark className="w-4 h-4" />
      </button>
    )}
    <button
      onClick={onEdit}
      className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      title={'Edit message'}
    >
      <Edit2 className="w-4 h-4" />
    </button>
  </div>
));

export function MessageBubble({
  message,
  isStreaming = false,
  onEditMessage,
  onRegenerateResponse,
  onSaveAsNote,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isEditing, setIsEditing] = useState(message.isEditing || false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoize display model to prevent unnecessary recalculations
  const displayModel = useMemo(() => {
    if (isUser || !message.model) return undefined;
    return modelNames[message.model] || 'AI Assistant';
  }, [isUser, message.model]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [message.content]);

  const handleSaveNote = useCallback(() => {
    if (onSaveAsNote) {
      onSaveAsNote(message.content);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500); // Visual feedback for 2.5s
    }
  }, [message.content, onSaveAsNote]);

  const handleExport = useCallback(() => {
    const blob = new Blob([message.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tutor-response-${message.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [message.content, message.id]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditContent(message.content);
  }, [message.content]);

  const handleSaveEdit = useCallback(() => {
    if (editContent.trim() !== message.content && onEditMessage) {
      onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, message.id, onEditMessage]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerateResponse) {
      onRegenerateResponse(message.id);
    }
  }, [message.id, onRegenerateResponse]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing, editContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Memoize markdown components to prevent re-creation on every render
  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match) {
        return (
          <CodeBlock
            language={match[1]}
            children={String(children)}
          />
        );
      } else {
        return (
          <code className="bg-[#1a1a1a] px-2 py-0.5 rounded text-[13px] font-mono border border-white/10" {...props}>
            {children}
          </code>
        );
      }
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="border-collapse border border-[var(--color-border)] w-full">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return (
        <th className="border border-[var(--color-border)] p-2 bg-[var(--color-sidebar)] font-semibold">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return <td className="border border-[var(--color-border)] p-2">{children}</td>;
    },
  }), []);

  return (
    <div className={`message-wrapper group w-full mb-6 ${isUser ? 'flex justify-start' : ''}`}>
      {/* User Message Structure */}
      {isUser ? (
        <div className="flex items-start gap-3 bg-[#2a2a2a] text-white rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
          {/* Avatar Inside */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[#E6E4DD] text-[#333333] mt-0.5 select-none">
            <Smile size={18} strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-w-[200px] min-h-[80px] p-2 bg-[#1a1a1a] border border-white/10 rounded-lg resize-none text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder={'Edit your message...'}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    disabled={editContent.trim() === message.content || !editContent.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-[15px] leading-relaxed font-medium break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* User Actions (Edit only) */}
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all"
              title="Edit"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
      ) : (
        /* Assistant Message Structure */
        <div className="w-full max-w-none pl-0">
          {displayModel && (
            <div className="text-[10px] text-[var(--color-text-secondary)] mb-1.5 font-medium tracking-wide uppercase select-none">
              {displayModel}
            </div>
          )}

          <div className="prose prose-invert max-w-none text-[16px] leading-relaxed text-[var(--color-text-primary)]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && <StreamingIndicator />}
          </div>

          {/* Assistant Actions - Lower Right */}
          {!isStreaming && message.content.length > 0 && (
            <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ActionButtons
                isUser={isUser}
                onRegenerate={onRegenerateResponse ? handleRegenerate : undefined}
                onEdit={handleEdit}
                onCopy={handleCopy}
                onSaveNote={handleSaveNote}
                onExport={handleExport}
                copied={copied}
                noteSaved={noteSaved}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
  );
}
