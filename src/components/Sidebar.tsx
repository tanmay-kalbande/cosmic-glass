import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, MessageSquare, Settings, Trash2, X, ChevronLeft, ChevronRight,
  Search, Pin, Edit, Book, GitBranch
} from 'lucide-react';
import { Conversation, Note, Flowchart, AIModel } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  notes: Note[];
  flowcharts: Flowchart[];
  activeView: 'chat' | 'note' | 'flowchart';
  currentConversationId: string | null;
  currentNoteId: string | null;
  currentFlowchartId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string | null) => void;
  onSelectNote: (id: string | null) => void;
  onSelectFlowchart: (id: string | null) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onDeleteFlowchart: (id: string) => void;
  onOpenSettings: () => void;
  settings: { selectedModel: AIModel };
  onModelChange: (model: AIModel) => void;
  onCloseSidebar: () => void;
  isSidebarOpen: boolean;
  isFolded?: boolean;
  onToggleFold?: () => void;
}

export function Sidebar({
  conversations,
  notes,
  flowcharts,
  activeView,
  currentConversationId,
  currentNoteId,
  currentFlowchartId,
  onNewConversation,
  onSelectConversation,
  onSelectNote,
  onSelectFlowchart,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteNote,
  onDeleteFlowchart,
  onOpenSettings,
  settings,
  onModelChange,
  onCloseSidebar,
  isFolded = false,
  onToggleFold,
  isSidebarOpen
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [view, setView] = useState<'chats' | 'notes' | 'flowcharts'>('chats');

  useEffect(() => {
    if (activeView === 'chat') setView('chats');
    else if (activeView === 'note') setView('notes');
    else if (activeView === 'flowchart') setView('flowcharts');
  }, [activeView]);

  const models = [
    { id: 'gpt-oss-120b', icon: '/openai.svg', name: 'GPT-OSS 120B' },
    { id: 'llama-3.3-70b-versatile', icon: '/meta-color.svg', name: 'Llama 3.3 70B' },
    { id: 'mistral-large-latest', icon: '/mistral-color.svg', name: 'Mistral Large' },
    { id: 'mistral-medium-latest', icon: '/mistral-color.svg', name: 'Mistral Medium' },
    { id: 'gemini-2.5-flash', icon: '/gemini-color.svg', name: 'Gemini 2.5 Flash' },
    { id: 'gemma-3-27b-it', icon: '/gemini-color.svg', name: 'Gemma 3 27B' },
    { id: 'zai-glm-4.6', icon: '/zhipu-color.svg', name: 'ZAI GLM 4.6' },
    { id: 'glm-4.5-flash', icon: '/zhipu-color.svg', name: 'GLM 4.5 Flash' },
  ];

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => sortedConversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())), [sortedConversations, searchQuery]);
  const filteredNotes = useMemo(() => notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())), [notes, searchQuery]);
  const filteredFlowcharts = useMemo(() => flowcharts.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase())), [flowcharts, searchQuery]);

  const handleStartEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') setEditingId(null);
  };

  const handleViewChange = (newView: 'chats' | 'notes' | 'flowcharts') => {
    setView(newView);
    setSearchQuery('');
    if (newView === 'chats') onSelectConversation(sortedConversations[0]?.id || null);
    else if (newView === 'notes') onSelectNote(null);
    else onSelectFlowchart(null);
  };

  const sidebarClasses = `glass-panel flex flex-col h-full border-r border-[var(--color-border)] sidebar transition-all duration-300 ease-in-out fixed lg:static z-50 ${isSidebarOpen ? 'sidebar-open' : 'hidden lg:flex'} ${isFolded ? 'w-14' : 'w-64'}`;

  return (
    <aside className={sidebarClasses}>
      <div className="p-2 border-b border-[var(--color-border)] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {!isFolded && (
            <a href="/" className="flex items-center gap-2.5 group px-2">
              <img src="/coze.svg" alt="Mono Logo" className="w-6 h-6" />
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:opacity-80 transition-opacity">Mono</h1>
            </a>
          )}
          <div className="flex items-center gap-1">
            <button onClick={onOpenSettings} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg" title="Settings"><Settings className="w-5 h-5" /></button>
            {onToggleFold && <button onClick={onToggleFold} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg hidden lg:block" title={isFolded ? 'Expand' : 'Collapse'}>{isFolded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}</button>}
            <button onClick={onCloseSidebar} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg lg:hidden" title="Close sidebar"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <button onClick={onNewConversation} className={`w-full flex items-center ${isFolded ? 'justify-center' : 'justify-start'} gap-2 px-3 py-2 bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] rounded-lg text-[var(--color-accent-text)] shadow-sm font-semibold btn-shine`}>
          <Plus className="w-4 h-4" />
          {!isFolded && <span>New chat</span>}
        </button>
      </div>

      {view === 'chats' && (
        <div className="p-2 border-b border-[var(--color-border)]">
          {isFolded ? (
            <div className="flex justify-center">
              <button className="p-2 bg-[var(--color-card)] rounded-lg" title={models.find(m => m.id === settings.selectedModel)?.name}><img src={models.find(m => m.id === settings.selectedModel)?.icon || '/coze.svg'} alt="" className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">AI Model</p>
              <div className="grid grid-cols-2 gap-2">
                {models.map(model => (
                  <button key={model.id} onClick={() => onModelChange(model.id as AIModel)} className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 border transform hover:scale-105 active:scale-100 ${settings.selectedModel === model.id ? 'bg-[var(--color-card)] border-[var(--color-border)] text-white scale-105' : 'bg-transparent border-transparent hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-white'}`} title={model.name}>
                    <img src={model.icon} alt={model.name} className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-semibold truncate w-full text-left">{model.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 flex flex-col">
        {!isFolded && <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${view}...`} className="w-full bg-[var(--color-card)] border border-transparent focus:border-[var(--color-border)] rounded-lg pl-9 pr-3 py-1.5 text-sm placeholder:text-[var(--color-text-placeholder)] focus:outline-none" /></div>}
        
        {view === 'chats' && (
          <div className="space-y-1">
            {filteredConversations.length > 0 ? filteredConversations.map(c => (
              <div key={c.id} onClick={() => onSelectConversation(c.id)} className={`group relative flex items-center gap-2 ${isFolded ? 'justify-center p-2.5' : 'p-2'} rounded-lg cursor-pointer transition-colors ${activeView === 'chat' && currentConversationId === c.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-[var(--color-text-primary)]'}`} title={c.title}>
                {isFolded ? <div className="relative"><MessageSquare className="w-5 h-5" />{c.isPinned && <Pin className="w-2.5 h-2.5 absolute -top-1 -right-1 text-yellow-400" />}</div> : <>
                  <div className="relative flex-shrink-0"><MessageSquare className="w-4 h-4" />{c.isPinned && <Pin className="w-2.5 h-2.5 absolute -top-1 -right-1 text-yellow-400" />}</div>
                  {activeView === 'chat' && currentConversationId === c.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-400 rounded-r-full" />}
                  {editingId === c.id ? <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onBlur={handleSaveEdit} onKeyDown={handleKeyDown} className="flex-1 text-sm bg-transparent border-b border-[var(--color-border)] outline-none" autoFocus onClick={e => e.stopPropagation()} /> : <div className="flex-1 min-w-0 text-sm font-medium truncate">{c.title}</div>}
                  <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[var(--color-sidebar)] pl-8 pr-1.5"><button onClick={e => { e.stopPropagation(); onTogglePinConversation(c.id);}} className="p-1 rounded hover:bg-[var(--color-border)]" title={c.isPinned ? 'Unpin' : 'Pin'}><Pin className="w-3.5 h-3.5" /></button><button onClick={e => { e.stopPropagation(); handleStartEditing(c); }} className="p-1 rounded hover:bg-[var(--color-border)]" title="Rename"><Edit className="w-3.5 h-3.5" /></button><button onClick={e => { e.stopPropagation(); onDeleteConversation(c.id); }} className="p-1 rounded hover:bg-red-900/30 text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button></div>
                </>}
              </div>
            )) : <div className="text-center py-8 px-4"><MessageSquare className="w-12 h-12 mx-auto text-gray-500 mb-3" /><p className="text-sm text-gray-500">{searchQuery ? 'No chats found' : 'No conversations yet'}</p></div>}
          </div>
        )}
        
        {/* Other views (Notes, Flowcharts) */}
      </div>

      <div className="p-2 border-t border-[var(--color-border)]">
        <div className={`${isFolded ? 'space-y-1 flex flex-col' : 'grid grid-cols-3 gap-1'}`}>
          <button onClick={() => handleViewChange('chats')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition-colors ${view === 'chats' ? 'text-white bg-[var(--color-card)]' : 'text-gray-400 hover:text-white hover:bg-[var(--color-card)]'}`} title="Chats"><MessageSquare className="w-5 h-5" />{!isFolded && <span className="text-xs font-semibold">Chats</span>}</button>
          <button onClick={() => handleViewChange('notes')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition-colors ${view === 'notes' ? 'text-white bg-[var(--color-card)]' : 'text-gray-400 hover:text-white hover:bg-[var(--color-card)]'}`} title="Notes"><Book className="w-5 h-5" />{!isFolded && <span className="text-xs font-semibold">Notes</span>}</button>
          <button onClick={() => handleViewChange('flowcharts')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition-colors ${view === 'flowcharts' ? 'text-white bg-[var(--color-card)]' : 'text-gray-400 hover:text-white hover:bg-[var(--color-card)]'}`} title="Flowcharts"><GitBranch className="w-5 h-5" />{!isFolded && <span className="text-xs font-semibold">Flows</span>}</button>
        </div>
      </div>
    </aside>
  );
}
