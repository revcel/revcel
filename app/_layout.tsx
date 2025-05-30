import { queryClient } from '@/lib/query'
import { storage } from '@/lib/storage'
import { COLORS } from '@/theme/colors'
import * as Sentry from '@sentry/react-native'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { isRunningInExpoGo } from 'expo'
import { activateKeepAwakeAsync } from 'expo-keep-awake'
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'

const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: !isRunningInExpoGo(),
})

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: __DEV__ ? 'development' : 'production',
    integrations: [navigationIntegration],
    enableNativeFramesTracking: !isRunningInExpoGo(),
})

const mmkvPersister = createSyncStoragePersister({
    storage: {
        getItem: (key) => {
            const value = storage.getString(key)
            return value ?? null
        },
        setItem: (key, value) => {
            storage.set(key, value)
        },
        removeItem: (key) => {
            storage.delete(key)
        },
    },
})

// const clearStorage = () => {
//     storage.clearAll()
//     queryClient.clear()
// }

function RootLayout() {
    const commonHeaderStyle = {
        headerTransparent: Platform.OS === 'ios',
        headerStyle: {
            backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.gray1000,
        headerShadowVisible: false,
    }

    const commonContentStyle = {
        contentStyle: {
            backgroundColor: COLORS.background,
        },
    }

    const ref = useNavigationContainerRef()

    useEffect(() => {
        if (ref?.current) {
            navigationIntegration.registerNavigationContainer(ref)
        }
    }, [ref])

    useEffect(() => {
        SplashScreen.hide()
        activateKeepAwakeAsync()
    }, [])

    return (
        <GestureHandlerRootView>
            <KeyboardProvider>
                <SystemBars />
                <PersistQueryClientProvider
                    client={queryClient}
                    persistOptions={{
                        persister: mmkvPersister,
                        dehydrateOptions: {
                            shouldDehydrateQuery: (query) => query.state.data !== undefined,
                        },
                    }}
                >
                    <Stack
                        screenOptions={{
                            navigationBarHidden: true,
                        }}
                    >
                        <Stack.Screen
                            name="login/index"
                            options={{
                                title: 'Login',
                                headerShown: false,
                                // gestureEnabled: false,
                                // animation: 'none',
                                presentation: 'modal',
                                ...commonContentStyle,
                                autoHideHomeIndicator: true,
                            }}
                        />

                        <Stack.Screen
                            name="home/index"
                            options={{
                                title: 'Home',
                                headerShown: false,
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                                autoHideHomeIndicator: true,
                            }}
                        />

                        <Stack.Screen
                            name="browser/index"
                            options={{
                                title: 'Browser',
                                headerShown: false,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="notifications/index"
                            options={{
                                title: 'Notifications',
                                headerShown: true,
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="v0/index"
                            options={{
                                title: 'v0',
                                headerShown: false,
                                ...commonContentStyle,
                                autoHideHomeIndicator: true,
                            }}
                        />

                        <Stack.Screen
                            name="projects/all"
                            options={{
                                title: 'My Projects',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                                presentation: 'modal',
                            }}
                        />

                        <Stack.Screen
                            name="projects/[projectId]/(tabs)"
                            options={{
                                title: 'Project',
                                headerShown: false,
                                animation: 'fade',
                                animationDuration: 120,
                                animationMatchesGesture: true,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="projects/[projectId]/observability"
                            options={{
                                title: 'Observability',
                                headerShown: true,
                                headerLargeTitle: true,
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="deployments/[deploymentId]/index"
                            options={{
                                title: 'Deployment',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="deployments/[deploymentId]/source"
                            options={{
                                title: 'Source',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="deployments/[deploymentId]/output"
                            options={{
                                title: 'Output',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="deployments/[deploymentId]/functions"
                            options={{
                                title: 'Functions',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="deployments/[deploymentId]/logs"
                            options={{
                                title: 'Logs',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                                autoHideHomeIndicator: true,
                            }}
                        />

                        <Stack.Screen
                            name="deployments/[deploymentId]/domains"
                            options={{
                                title: 'Domains',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                            }}
                        />

                        <Stack.Screen
                            name="logs/details"
                            options={{
                                title: 'Log Details',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                                presentation: 'modal',
                            }}
                        />

                        <Stack.Screen
                            name="logs/filters"
                            options={{
                                title: 'Log Filters',
                                ...commonHeaderStyle,
                                ...commonContentStyle,
                                presentation: 'modal',
                            }}
                        />
                    </Stack>
                </PersistQueryClientProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    )
}

export default RootLayout
