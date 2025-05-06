import WidgetKitModule from '@/modules/widgetkit'
import { usePersistedStore } from '@/store/persisted'
import Superwall from '@superwall/react-native-superwall'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { Alert } from 'react-native'

export default function App() {
    const { showPaywall } = useLocalSearchParams<{ showPaywall?: string }>()
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)

    if (connections.length === 0) {
        return <Redirect href="/login" />
    }

    if (!currentConnection) {
        usePersistedStore.setState({ currentConnection: connections[0] })
        if (__DEV__) {
            throw new Error('Found connections but not current connection id.')
        }
    }

    if (showPaywall) {
        Superwall.shared
            .register({
                placement: 'TapWidget',
                feature: () => {
                    WidgetKitModule.setIsSubscribed(true)
                },
            })
            .catch((error) => {
                console.error('Error registering TapWidget', error)
                Alert.alert('Error', 'Something went wrong, please try again.')
            })
    }

    return <Redirect href="/home" />
}
