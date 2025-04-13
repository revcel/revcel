import { usePersistedStore } from '@/store/persisted'
import { Redirect } from 'expo-router'

export default function App() {
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)

    if (connections.length === 0) {
        return <Redirect href="/login" />
    }

    if (!currentConnection) {
        usePersistedStore.setState({ currentConnection: connections[0] })
        throw new Error('Found connections but not current connection id.')
    }

    return <Redirect href="/home" />
}
