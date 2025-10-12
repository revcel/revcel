import WidgetKitModule from '@/modules/widgetkit'
import { usePersistedStore } from '@/store/persisted'
import * as Sentry from '@sentry/react-native'
import * as QuickActions from 'expo-quick-actions'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { usePlacement, useUser } from 'expo-superwall'
import { useEffect } from 'react'
import { Alert } from 'react-native'

export default function App() {
    const { registerPlacement } = usePlacement()
    const { subscriptionStatus } = useUser()
    const { showPaywall, showLfo1 } = useLocalSearchParams<{
        showPaywall?: string
        showLfo1?: string
    }>()
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)

    useEffect(() => {
        if (subscriptionStatus.status !== 'INACTIVE') return

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

        QuickActions.isSupported().then((supported) => {
            if (!supported) return
            QuickActions.setItems([
                {
                    id: '0',
                    title: "Don't delete me ):",
                    subtitle: "Here's 50% off for life!",
                    icon: 'love',
                    params: { href: '/showLfo1=1' },
                },
            ])
        })
    }, [registerPlacement, subscriptionStatus.status])

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
    }

    if (showLfo1) {
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
    }

    return <Redirect href="/home" />
}
