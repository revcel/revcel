import { usePersistedStore } from '@/store/persisted'
import { Redirect, useLocalSearchParams } from 'expo-router'

export default function App() {
    const { showPaywall } = useLocalSearchParams<{ showPaywall?: string }>()
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)

    if (connections.length === 0) {
        return <Redirect href="/login" />
    }

    if (!currentConnection) {
        usePersistedStore.setState({ currentConnection: connections[0] })
        throw new Error('Found connections but not current connection id.')
    }

    if (showPaywall) {
        console.log('showPaywall', showPaywall)
        // show paywall
    }

    return <Redirect href="/home" />
}
