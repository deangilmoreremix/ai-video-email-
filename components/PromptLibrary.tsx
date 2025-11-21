import React, { useState, useEffect } from 'react';
import {
  getPromptHistory,
  getFavoritePrompts,
  getSavedPrompts,
  getPublicPrompts,
  toggleFavoritePrompt,
  saveSavedPrompt,
  deleteSavedPrompt,
  deletePromptHistoryItem,
  incrementSavedPromptUsage,
  searchPrompts,
  PromptHistory,
  SavedPrompt
} from '../services/promptStorageService';
import { generatePromptSuggestions, PROMPT_CATEGORIES, PromptCategory, PromptSuggestion } from '../services/promptService';

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  onClose: () => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelectPrompt, onClose }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'saved' | 'public' | 'suggestions'>('history');
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<SavedPrompt[]>([]);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [favorites, setFavorites] = useState<PromptHistory[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [promptToSave, setPromptToSave] = useState('');
  const [saveTitle, setSaveTitle] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading data for tab:', activeTab, 'category:', selectedCategory);
      if (activeTab === 'history') {
        const data = await getPromptHistory(50, selectedCategory !== 'all' ? selectedCategory : undefined);
        setHistory(data);
        const favs = await getFavoritePrompts();
        setFavorites(favs);
      } else if (activeTab === 'saved') {
        const data = await getSavedPrompts(selectedCategory !== 'all' ? selectedCategory : undefined);
        setSaved(data);
      } else if (activeTab === 'public') {
        const data = await getPublicPrompts(selectedCategory !== 'all' ? selectedCategory : undefined);
        console.log('Public prompts loaded:', data.length);
        setPublicPrompts(data);
      } else if (activeTab === 'suggestions' && selectedCategory !== 'all') {
        const data = await generatePromptSuggestions(selectedCategory);
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const results = await searchPrompts(searchTerm);
      if (activeTab === 'saved') {
        setSaved(results);
      } else if (activeTab === 'public') {
        setPublicPrompts(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, currentState: boolean) => {
    const success = await toggleFavoritePrompt(id, !currentState);
    if (success) {
      loadData();
    }
  };

  const handleSavePrompt = async () => {
    if (!saveTitle.trim() || !promptToSave.trim()) return;

    const tags = saveTags.split(',').map(t => t.trim()).filter(t => t);
    const result = await saveSavedPrompt({
      title: saveTitle,
      prompt_text: promptToSave,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      tags,
      is_public: isPublic
    });

    if (result) {
      setSaveDialogOpen(false);
      setPromptToSave('');
      setSaveTitle('');
      setSaveTags('');
      setIsPublic(false);
      loadData();
    }
  };

  const handleDeleteSaved = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      const success = await deleteSavedPrompt(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (confirm('Are you sure you want to delete this history item?')) {
      const success = await deletePromptHistoryItem(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleUsePrompt = async (prompt: string, savedId?: string) => {
    if (savedId) {
      await incrementSavedPromptUsage(savedId);
    }
    onSelectPrompt(prompt);
    onClose();
  };

  const openSaveDialog = (prompt: string) => {
    setPromptToSave(prompt);
    setSaveDialogOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Prompt Library</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              My Prompts
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'public'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Community
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'suggestions'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Examples
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search prompts..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 text-sm font-medium"
              >
                Search
              </button>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Categories</option>
              {PROMPT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {favorites.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-3">⭐ Favorites</h3>
                      <div className="space-y-3">
                        {favorites.map(item => (
                          <PromptHistoryCard
                            key={item.id}
                            item={item}
                            onUse={(prompt) => handleUsePrompt(prompt)}
                            onToggleFavorite={handleToggleFavorite}
                            onSave={openSaveDialog}
                            onDelete={handleDeleteHistory}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent History</h3>
                  {history.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No prompt history yet</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map(item => (
                        <PromptHistoryCard
                          key={item.id}
                          item={item}
                          onUse={(prompt) => handleUsePrompt(prompt)}
                          onToggleFavorite={handleToggleFavorite}
                          onSave={openSaveDialog}
                          onDelete={handleDeleteHistory}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Saved Tab */}
              {activeTab === 'saved' && (
                <div className="space-y-3">
                  {saved.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No saved prompts yet</p>
                  ) : (
                    saved.map(item => (
                      <SavedPromptCard
                        key={item.id}
                        item={item}
                        onUse={(prompt) => handleUsePrompt(prompt, item.id)}
                        onDelete={handleDeleteSaved}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Public Tab */}
              {activeTab === 'public' && (
                <div className="space-y-3">
                  {publicPrompts.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No public prompts available</p>
                  ) : (
                    publicPrompts.map(item => (
                      <SavedPromptCard
                        key={item.id}
                        item={item}
                        onUse={(prompt) => handleUsePrompt(prompt, item.id)}
                        isPublic
                      />
                    ))
                  )}
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <div className="space-y-3">
                  {selectedCategory === 'all' ? (
                    <p className="text-center text-gray-500 py-8">Select a category to see examples</p>
                  ) : suggestions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No suggestions available</p>
                  ) : (
                    suggestions.map((item, index) => (
                      <SuggestionCard
                        key={index}
                        item={item}
                        onUse={() => handleUsePrompt(item.prompt)}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Save Dialog */}
        {saveDialogOpen && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Save Prompt</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Title</label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="My awesome prompt"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    placeholder="sales, demo, product"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="is-public" className="text-sm text-gray-300">
                    Make public (share with community)
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={!saveTitle.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 disabled:opacity-50 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PromptHistoryCard: React.FC<{
  item: PromptHistory;
  onUse: (prompt: string) => void;
  onToggleFavorite: (id: string, currentState: boolean) => void;
  onSave: (prompt: string) => void;
  onDelete: (id: string) => void;
}> = ({ item, onUse, onToggleFavorite, onSave, onDelete }) => {
  const promptToUse = item.improved_prompt || item.original_prompt;

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {item.category && (
            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
              {item.category}
            </span>
          )}
          {item.quality_score && (
            <span className="text-xs ml-2 text-yellow-400">
              Score: {item.quality_score}/100
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleFavorite(item.id, item.is_favorite)}
            className="text-xl hover:scale-110 transition-transform"
          >
            {item.is_favorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-gray-400 hover:text-red-400 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-3">{promptToUse}</p>

      <div className="flex gap-2">
        <button
          onClick={() => onUse(promptToUse)}
          className="px-3 py-1 text-xs bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 font-medium"
        >
          Use
        </button>
        <button
          onClick={() => onSave(promptToUse)}
          className="px-3 py-1 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Save
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {new Date(item.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

const SavedPromptCard: React.FC<{
  item: SavedPrompt;
  onUse: (prompt: string) => void;
  onDelete?: (id: string) => void;
  isPublic?: boolean;
}> = ({ item, onUse, onDelete, isPublic }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-white">{item.title}</h4>
          <div className="flex gap-2 mt-1">
            {item.category && (
              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                {item.category}
              </span>
            )}
            {item.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {isPublic && <span className="text-xs text-gray-500">🌐</span>}
          <span className="text-xs text-gray-500">Used {item.usage_count}×</span>
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="text-gray-400 hover:text-red-400 ml-2"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-3">{item.prompt_text}</p>

      <button
        onClick={() => onUse(item.prompt_text)}
        className="px-3 py-1 text-xs bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 font-medium"
      >
        Use This Prompt
      </button>
    </div>
  );
};

const SuggestionCard: React.FC<{
  item: PromptSuggestion;
  onUse: () => void;
}> = ({ item, onUse }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-white">{item.title}</h4>
          <p className="text-xs text-gray-400 mt-1">{item.description}</p>
        </div>
        <span className="text-xs text-gray-500">{item.estimatedLength}s</span>
      </div>

      <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg my-3">
        {item.prompt}
      </p>

      <button
        onClick={onUse}
        className="px-3 py-1 text-xs bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 font-medium"
      >
        Use This Example
      </button>
    </div>
  );
};
