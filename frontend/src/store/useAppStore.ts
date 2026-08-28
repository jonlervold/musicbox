import { create } from "zustand";

type AppStore = {
  code: string;
  setCode: (value: string) => void;
  folder: string;
  setFolder: (value: string) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  code: "",
  setCode: (value) => set({ code: value }),
  folder: "",
  setFolder: (value) => set({ folder: value }),
}));

