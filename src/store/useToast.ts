import { create } from "zustand";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, type?: ToastItem["type"]) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, type = "success") => {
    const id = `t_${Math.random().toString(36).slice(2, 9)}`;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().remove(id), 3200);
  },
  remove: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m: string) => useToast.getState().push(m, "success"),
  error: (m: string) => useToast.getState().push(m, "error"),
  info: (m: string) => useToast.getState().push(m, "info"),
};
