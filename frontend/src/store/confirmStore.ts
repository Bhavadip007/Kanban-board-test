import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: ((value: boolean) => void) | null;
  open: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  resolve: null,

  open: ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, title, message, confirmLabel, cancelLabel, resolve });
    }),

  close: (result) => {
    const { resolve } = get();
    resolve?.(result);
    set({ isOpen: false, resolve: null });
  },
}));

export const confirmAction = (options: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) => useConfirmStore.getState().open(options);
