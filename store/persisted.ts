import { mmkvStorage } from '@/lib/storage'
import WidgetKitModule from '@/modules/widgetkit'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Connection {
    id: string
    apiToken: string
    currentTeamId: string | null
}

interface PersistedStoreState {
    connections: Connection[]
    currentConnection: Connection | null
    switchConnection: ({
        connectionId,
        teamId,
    }: {
        connectionId: string
        teamId?: string
    }) => void
    removeConnection: (connectionId: string) => void
    addConnection: (connection: Connection) => void

    acknowledgments: {
        swipeLeftProject: boolean
        swipeLeftBrowser: boolean
        swipeLeftv0: boolean
        swipeLeftDomains: boolean
    }

    hasSeenOnboarding: boolean
    acknowledge: (type: keyof PersistedStoreState['acknowledgments']) => void

    installationTs: number
}

export const usePersistedStore = create<PersistedStoreState>()(
    persist(
        (set, get) => ({
            connections: [],
            currentConnection: null,
            removeConnection: (connectionId: string) => {
                WidgetKitModule.removeConnection(connectionId)
                const newConnections = get().connections.filter((c) => c.id !== connectionId)

                set({
                    connections: newConnections,
                    currentConnection: newConnections[0] || null,
                })
            },
            addConnection: (connection: Connection) => {
                WidgetKitModule.addConnection(connection)
                set((state) => ({ connections: [...state.connections, connection] }))
            },
            switchConnection: ({
                connectionId,
                teamId,
            }: { connectionId: string; teamId?: string }) => {
                const state = get()

                const connection = state.connections.find((c) => c.id === connectionId)
                if (!connection) return

                const newConnection = {
                    ...connection,
                    currentTeamId: teamId || connection.currentTeamId,
                }

                const newConnections = state.connections.map((c) =>
                    c.id === newConnection.id ? newConnection : c
                )

                set({
                    connections: newConnections,
                    currentConnection: newConnection,
                })

                // queryClient.invalidateQueries()
            },

            hasSeenOnboarding: false,

            acknowledgments: {
                swipeLeftProject: false,
                swipeLeftBrowser: false,
                swipeLeftv0: false,
                swipeLeftDomains: false,
            },
            acknowledge(type: keyof PersistedStoreState['acknowledgments']) {
                set((state) => ({
                    acknowledgments: {
                        ...state.acknowledgments,
                        [type]: true,
                    },
                }))
            },

            installationTs: Date.now(),
        }),
        {
            name: 'rev-persisted-store',
            storage: createJSONStorage(() => mmkvStorage),
            version: 1,
        }
    )
)
