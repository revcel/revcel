import { create } from 'zustand'

interface StoreState {
    logsSelectedAttributes: Record<string, string[]>
    setLogsSelectedAttributes: (logsSelectedAttributes: Record<string, string[]>) => void
}

export const useStore = create<StoreState>()((set, get) => ({
    logsSelectedAttributes: {
        level: [],
    },
    setLogsSelectedAttributes: (logsSelectedAttributes: Record<string, string[]>) => {
        set({ logsSelectedAttributes })
    },
}))
