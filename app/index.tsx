import WidgetKitModule from '@/modules/widgetkit'
import { usePersistedStore } from '@/store/persisted'
import * as Sentry from '@sentry/react-native'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { usePlacement } from 'expo-superwall'
import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'

export default function App() {
    const { registerPlacement } = usePlacement()
    const { showPaywall, showLfo1 } = useLocalSearchParams<{
        showPaywall?: string
        showLfo1?: string
    }>()

    const hasSeenOnboarding = usePersistedStore((state) => state.hasSeenOnboarding)
    const connections = usePersistedStore((state) => state.connections)
    const isLoggedIn = hasSeenOnboarding && connections.length > 0

    // Placements are side effects: run them once per deep link, never during render
    const shownPlacementRef = useRef<string | null>(null)

    useEffect(() => {
        if (!isLoggedIn) return

        const placement = showPaywall ? 'TapWidget' : showLfo1 ? 'LifetimeOffer_1_Show' : null
        if (!placement || shownPlacementRef.current === placement) return
        shownPlacementRef.current = placement

        registerPlacement({
            placement,
            feature: () => {
                WidgetKitModule.setIsSubscribed(true)
                Alert.alert(
                    'Congrats!',
                    placement === 'TapWidget'
                        ? 'You can now go to your homescreen and search for "Rev" widgets'
                        : 'You unlocked lifetime access to Rev.'
                )
            },
        }).catch((error) => {
            Sentry.captureException(error)
            console.error(`Error registering ${placement}`, error)
            if (placement === 'TapWidget') {
                Alert.alert('Error', 'Something went wrong, please try again.')
            }
        })
    }, [isLoggedIn, showPaywall, showLfo1, registerPlacement])

    if (!hasSeenOnboarding) {
        return <Redirect href="/onboard" />
    }

    if (connections.length === 0) {
        return <Redirect href="/login" />
    }

    return <Redirect href="/home" />
}
