import WidgetKitModule from '@/modules/widgetkit'
import { usePersistedStore } from '@/store/persisted'
import * as Sentry from '@sentry/react-native'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { usePlacement, useUser } from 'expo-superwall'
import { Alert } from 'react-native'

export default function App() {
    const { registerPlacement } = usePlacement()
    const { subscriptionStatus } = useUser()
    const { showPaywall } = useLocalSearchParams<{ showPaywall?: string }>()
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)

    if (connections.length === 0) {
        return <Redirect href="/login" />
    }

    if (!currentConnection) {
        usePersistedStore.setState({ currentConnection: connections[0] })
        Sentry.captureException(new Error('Found connections but not current connection id.'))
    }

    if (showPaywall) {
        registerPlacement({
            placement: 'TapWidget',
            feature: () => {
                WidgetKitModule.setIsSubscribed(true)
                Alert.alert(
                    'Congrats, you can now go to your homescreen and search for "Rev" widgets'
                )
            },
        }).catch((error) => {
            Sentry.captureException(error)
            console.error('Error registering TapWidget', error)
            Alert.alert('Error', 'Something went wrong, please try again.')
        })
    } else if (subscriptionStatus.status === 'INACTIVE') {
        setTimeout(() => {
            registerPlacement({
                placement: 'LifetimeOffer_1',
                feature: () => {
                    WidgetKitModule.setIsSubscribed(true)
                    Alert.alert('Congrats, you unlocked lifetime access to Rev.')
                },
            }).catch((error) => {
                console.error('Error registering LifetimeOffer_1', error)
                Sentry.captureException(error)
            })
        }, 1000)
    }

    return <Redirect href="/home" />
}
