import { deleteWebhook } from '@/api/mutations'
import { fetchWebhook } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import type { Deployment } from '@/types/deployments'
import type { Project } from '@/types/projects'
import type { Team } from '@/types/teams'
import type { Cookie } from '@react-native-cookies/cookies'
import CookieManager from '@react-native-cookies/cookies'
import { type UseQueryResult, useQueries } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'

export function useDeploymentShortId(
    deployment: Deployment | Project['latestDeployments'][number] | undefined
) {
    const shortId = useMemo(() => {
        if (!deployment) return undefined

        return deployment.id.slice(0, 8)
    }, [deployment])

    return shortId
}

export function useBrowser() {
    const currentConnection = usePersistedStore((state) => state.currentConnection)

    const openBrowser = useCallback(
        async (url: string) => {
            const useWebkit = false

            console.log(
                'COOKIES',
                JSON.stringify(
                    Platform.OS === 'ios' ? await CookieManager.getAll(useWebkit) : '',
                    null,
                    2
                )
            )

            await CookieManager.clearAll(useWebkit)

            console.log(
                'COOKIES',
                JSON.stringify(
                    Platform.OS === 'ios' ? await CookieManager.getAll(useWebkit) : '',
                    null,
                    2
                )
            )

            const tokenCookie: Cookie = {
                name: 'authorization',
                value: `Bearer ${currentConnection?.apiToken!}`,
                domain: 'vercel.com',
                path: '/',
                secure: true,
                httpOnly: true,
                expires: '2026-03-22T13:00:50.148Z',
            }

            const loggedInCookie: Cookie = {
                name: 'isLoggedIn',
                value: '1',
                domain: 'vercel.com',
                path: '/',
                secure: true,
                httpOnly: false,
                expires: '2026-03-22T13:00:50.148Z',
            }

            await CookieManager.set('https://vercel.com', tokenCookie, useWebkit)
            await CookieManager.set('https://vercel.com', loggedInCookie, useWebkit)

            console.log(
                'COOKIES',
                JSON.stringify(
                    Platform.OS === 'ios' ? await CookieManager.getAll(useWebkit) : '',
                    null,
                    2
                )
            )

            await CookieManager.flush()

            router.push({
                pathname: '/browser',
                params: {
                    url: url,
                },
            })
        },
        [currentConnection?.apiToken]
    )

    return openBrowser
}

// gets all possible webhooks (all teams) and unregisters them if push notifications are disabled
export function useWebhookCheck(
    teamsQueries: UseQueryResult<{ teams: Team[]; connectionId: string }>[]
) {
    const [pushToken, setPushToken] = useState<string | null>(null)

    const isChecking = useRef(false)

    const proTeamIds = useMemo(() => {
        console.log('proTeamIds changing')
        const teams: { teamId: string; connectionId: string }[] = []

        for (const teamQuery of teamsQueries) {
            if (teamQuery.data?.teams) {
                for (const team of teamQuery.data.teams) {
                    if (team.id) {
                        teams.push({ teamId: team.id, connectionId: teamQuery.data.connectionId })
                    }
                }
            }
        }

        return teams
    }, [teamsQueries])

    const webhooksQueries = useQueries({
        queries: proTeamIds.map(({ teamId, connectionId }) => ({
            queryKey: ['webhook', teamId],
            queryFn: async () => {
                if (!pushToken) return null

                const webhook = await fetchWebhook({ connectionId, teamId, pushToken })

                if (!webhook) return null

                return {
                    ...webhook,
                    connectionId: connectionId,
                    teamId: teamId,
                }
            },
            enabled: !!pushToken,
        })),
    })

    useEffect(() => {
        if (webhooksQueries.length === 0) return

        if (isChecking.current) {
            console.log('[useWebhookCheck] already checking')
            return
        }

        isChecking.current = true

        async function disableWebhooks() {
            const validQueries = webhooksQueries.filter((q) => q.data)

            if (validQueries.length === 0) {
                console.log('[useWebhookCheck] no valid queries')
                return
            }

            for (const query of validQueries) {
                if (!query.data) continue // pleasing the compiler

                await deleteWebhook({
                    webhookId: query.data.id,
                    teamId: query.data.teamId,
                    connectionId: query.data.connectionId,
                })
            }

            await queryClient.resetQueries({ queryKey: ['webhook'] })
        }

        // check push notification status
        Notifications.getPermissionsAsync()
            .then(async ({ granted }) => {
                console.log('[disableWebhooks] granted', granted)
                if (!granted) {
                    console.log('[disableWebhooks] status not granted')
                    // disable webhooks for all teams
                    await disableWebhooks()
                    return
                }

                await Notifications.getDevicePushTokenAsync().then((token) => {
                    setPushToken(token.data)
                })
            })
            .catch((error) => {
                console.log('[disableWebhooks] error', error)
            })
            .finally(() => {
                isChecking.current = false
            })
    }, [webhooksQueries])
}

export function useNotificationHandler() {
    const notificationTapListener = useRef<Notifications.EventSubscription | null>(null)

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: false,
                shouldSetBadge: false,
            }),
        })

        notificationTapListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                if (!response?.notification?.request?.trigger) return

                const trigger = response.notification.request.trigger as Record<string, any>

                let projectId: string | undefined
                let userId: string | undefined
                let teamId: string | undefined
                let event: string | undefined

                if (Platform.OS === 'android') {
                    try {
                        const remoteMessage = trigger.remoteMessage

                        if (!remoteMessage) return

                        const extraData = JSON.parse(remoteMessage.data.extraData)

                        projectId = extraData.projectId
                        userId = extraData.userId
                        teamId = extraData.teamId
                        event = extraData.event
                    } catch {}
                } else {
                    const payload = trigger.payload

                    if (!payload) return

                    const extraData = payload.extraData

                    projectId = extraData.projectId
                    userId = extraData.userId
                    teamId = extraData.teamId
                    event = extraData.event
                }

                if (!projectId || !userId || !teamId || !event) return

                console.log('projectId', projectId)
                console.log('userId', userId)
                console.log('teamId', teamId)
                console.log('event', event)

                // switch team if needed

                router.push({
                    pathname: '/projects/[projectId]/(tabs)/home',
                    params: {
                        projectId,
                        teamId,
                        connectionId: userId,
                    },
                })
            }
        )
        return () => {
            if (notificationTapListener.current) {
                Notifications.removeNotificationSubscription(notificationTapListener.current)
            }
        }
    }, [])
}
