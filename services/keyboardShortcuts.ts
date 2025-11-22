import Mousetrap from 'mousetrap';

export interface ShortcutConfig {
  key: string;
  action: () => void;
  description: string;
  category: 'recording' | 'editing' | 'navigation' | 'general';
}

const shortcuts: ShortcutConfig[] = [];

export function registerShortcut(config: ShortcutConfig): void {
  Mousetrap.bind(config.key, (e) => {
    e.preventDefault();
    config.action();
    return false;
  });
  shortcuts.push(config);
}

export function unregisterShortcut(key: string): void {
  Mousetrap.unbind(key);
  const index = shortcuts.findIndex(s => s.key === key);
  if (index > -1) {
    shortcuts.splice(index, 1);
  }
}

export function getShortcuts(): ShortcutConfig[] {
  return shortcuts;
}

export function initializeDefaultShortcuts(callbacks: {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onPlayPause?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleFullscreen?: () => void;
  onHelp?: () => void;
}): void {
  if (callbacks.onStartRecording) {
    registerShortcut({
      key: 'r',
      action: callbacks.onStartRecording,
      description: 'Start recording',
      category: 'recording',
    });
  }

  if (callbacks.onStopRecording) {
    registerShortcut({
      key: 'shift+r',
      action: callbacks.onStopRecording,
      description: 'Stop recording',
      category: 'recording',
    });
  }

  if (callbacks.onPlayPause) {
    registerShortcut({
      key: 'space',
      action: callbacks.onPlayPause,
      description: 'Play/Pause video',
      category: 'editing',
    });
  }

  if (callbacks.onSeekForward) {
    registerShortcut({
      key: 'right',
      action: callbacks.onSeekForward,
      description: 'Seek forward 5 seconds',
      category: 'editing',
    });
  }

  if (callbacks.onSeekBackward) {
    registerShortcut({
      key: 'left',
      action: callbacks.onSeekBackward,
      description: 'Seek backward 5 seconds',
      category: 'editing',
    });
  }

  if (callbacks.onSave) {
    registerShortcut({
      key: 'mod+s',
      action: callbacks.onSave,
      description: 'Save project',
      category: 'general',
    });
  }

  if (callbacks.onUndo) {
    registerShortcut({
      key: 'mod+z',
      action: callbacks.onUndo,
      description: 'Undo',
      category: 'editing',
    });
  }

  if (callbacks.onRedo) {
    registerShortcut({
      key: 'mod+shift+z',
      action: callbacks.onRedo,
      description: 'Redo',
      category: 'editing',
    });
  }

  if (callbacks.onToggleFullscreen) {
    registerShortcut({
      key: 'f',
      action: callbacks.onToggleFullscreen,
      description: 'Toggle fullscreen',
      category: 'general',
    });
  }

  if (callbacks.onHelp) {
    registerShortcut({
      key: '?',
      action: callbacks.onHelp,
      description: 'Show keyboard shortcuts',
      category: 'general',
    });
  }
}

export function cleanupShortcuts(): void {
  Mousetrap.reset();
  shortcuts.length = 0;
}
