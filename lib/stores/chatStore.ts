import { create } from "zustand";
import { Channel, Message } from "@/lib/types/database";

interface ChatState {
  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChannel: null,
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
