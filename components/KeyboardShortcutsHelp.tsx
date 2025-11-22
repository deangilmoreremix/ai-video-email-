import React from 'react';
import { getShortcuts, ShortcutConfig } from '../services/keyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ onClose }) => {
  const shortcuts = getShortcuts();

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutConfig[]>);

  const formatKey = (key: string): string => {
    return key
      .replace('mod', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
      .replace('shift', '⇧')
      .replace('alt', '⌥')
      .replace('ctrl', 'Ctrl')
      .replace('left', '←')
      .replace('right', '→')
      .replace('up', '↑')
      .replace('down', '↓')
      .replace('space', 'Space')
      .replace('+', ' + ');
  };

  const categoryNames: Record<string, string> = {
    recording: 'Recording',
    editing: 'Editing',
    navigation: 'Navigation',
    general: 'General',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
            <p className="text-gray-400 text-sm mt-1">Speed up your workflow with these shortcuts</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No keyboard shortcuts configured
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                    {categoryNames[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
                      >
                        <span className="text-gray-300">{shortcut.description}</span>
                        <kbd className="px-3 py-1 bg-gray-700 text-white text-sm font-mono rounded border border-gray-600">
                          {formatKey(shortcut.key)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-2">Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Press <kbd className="px-2 py-0.5 bg-gray-700 text-white text-xs rounded">?</kbd> anytime to see this dialog</li>
              <li>Most shortcuts work when focused on the main content area</li>
              <li>Some shortcuts may not work while typing in text fields</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
