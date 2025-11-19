import { create } from 'zustand'

type Toast = {
  id: string
  message: string
  type?: 'info'|'success'|'error'|'warning'
}

type ConfirmState = {
  open: boolean
  message?: string
  resolve?: (v: boolean) => void
}

type PromptState = {
  open: boolean
  message?: string
  resolve?: (v: string | null) => void
}

type UiState = {
  toasts: Toast[]
  confirm: ConfirmState
  prompt: PromptState
  theme: 'light' | 'dark'
  initTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  notify: (message: string, type?: Toast['type']) => void
  confirmDialog: (message: string) => Promise<boolean>
  promptDialog: (message: string) => Promise<string | null>
  _removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set: any, get: any) => ({
  toasts: [],
  confirm: { open: false },
  prompt: { open: false },
  theme: 'light',
  initTheme: () => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme: 'light' | 'dark' = saved === 'light' || saved === 'dark' ? (saved as any) : (prefersDark ? 'dark' : 'light');
      get().setTheme(theme);
    } catch (_) {
      // no-op in non-browser
    }
  },
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    } catch (_) {
      // ignore if document not available
    }
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  notify: (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    set((s: UiState) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get()._removeToast(id), 4000);
  },
  _removeToast: (id: string) => set((s: UiState) => ({ toasts: s.toasts.filter((t: Toast) => t.id !== id) })),
  confirmDialog: (message: string) => {
    return new Promise<boolean>((resolve: (v: boolean) => void) => {
      set({ confirm: { open: true, message, resolve } });
    });
  },
  promptDialog: (message: string) => {
    return new Promise<string | null>((resolve: (v: string | null) => void) => {
      set({ prompt: { open: true, message, resolve } });
    });
  },
}));

export default useUiStore
