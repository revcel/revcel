import { registerWebhook } from '@/api/mutations'
import { fetchAllTeams, fetchTeamAvatar, fetchWebhook } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import type { Team } from '@/types/teams'
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueries } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    Switch,
    Text,
    View,
} from 'react-native'
import { SvgUri } from 'react-native-svg'
import { useDebouncedCallback } from 'use-debounce'

export default function NotificationsScreen() {
    const connections = usePersistedStore((state) => state.connections)

    const [hasPushEnabled, setHasPushEnabled] = useState(false)
    const [pushToken, setPushToken] = useState<string | null>(null)

    const teamsQueries = useQueries({
        queries: connections.map((connection) => ({
            queryKey: ['teams', connection.id],
            queryFn: async () => {
                const { teams } = await fetchAllTeams({ connectionId: connection.id })
                return {
                    connectionId: connection.id,
                    teams: teams,
                }
            },
            enabled: !!connection,
        })),
    })

    const dataForTeamId = useMemo(() => {
        const teamMap: Record<string, Team & { connectionId: string }> = {}

        for (const teamQuery of teamsQueries) {
            if (teamQuery.data?.teams) {
                for (const team of teamQuery.data.teams) {
                    if (team.id) {
                        teamMap[team.id] = {
                            ...team,
                            connectionId: teamQuery.data.connectionId,
                        }
                    }
                }
            }
        }

        return teamMap
    }, [teamsQueries])

    const proTeamIds = useMemo(() => {
        return Object.values(dataForTeamId)
            .filter((team) => team.billing.plan === 'pro')
            .map((team) => team.id)
    }, [dataForTeamId])

    useEffect(() => {
        Notifications.getPermissionsAsync().then(async ({ granted }) => {
            if (!granted) return

            await Notifications.getDevicePushTokenAsync().then((token) => {
                setPushToken(token.data)
                setHasPushEnabled(true)
                // making sure it gets refreshed
                setTimeout(() => {
                    queryClient.resetQueries({ queryKey: ['webhook'] })
                }, 1000)
            })
        })
    }, [])

    const enablePush = useCallback(async () => {
        const { status: currentStatus, canAskAgain } =
            await Notifications.getPermissionsAsync().catch(() => {
                return { status: undefined, canAskAgain: false }
            })

        if (!currentStatus) return

        if (currentStatus === Notifications.PermissionStatus.GRANTED) {
            await Notifications.getDevicePushTokenAsync().then(
                (token) => {
                    setPushToken(token.data)
                    setHasPushEnabled(true)
                },
                () => {
                    Alert.alert('Push notifications could not be enabled', 'Please try again later')
                }
            )
            return
        }

        if (!canAskAgain) {
            Alert.alert(
                'Push notifications are not enabled',
                'Please enable push notifications in your device settings'
            )
            return
        }

        const { granted } = await Notifications.requestPermissionsAsync().catch(() => {
            return { granted: false }
        })

        if (!granted) return

        await Notifications.getDevicePushTokenAsync().then(
            (token) => {
                setPushToken(token.data)
                setHasPushEnabled(true)
            },
            () => {
                Alert.alert('Push notifications could not be enabled', 'Please try again later')
            }
        )
    }, [])

    return (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{ flex: 1 }}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={() => {
                        queryClient.resetQueries({ queryKey: ['webhook'] })
                    }}
                    // android
                    progressBackgroundColor={COLORS.backgroundSecondary}
                    colors={[COLORS.successLight]}
                />
            }
        >
            <View style={{ marginTop: 20 }}>
                {proTeamIds.map((teamId, teamIndex) => (
                    <TeamRow
                        key={teamId}
                        team={dataForTeamId[teamId]}
                        hasPushEnabled={hasPushEnabled}
                        enablePush={enablePush}
                        pushToken={pushToken}
                        backgroundColor={teamIndex % 2 === 0 ? 'transparent' : COLORS.gray100}
                    />
                ))}
            </View>
        </ScrollView>
    )
}

function TeamRow({
    team,
    hasPushEnabled,
    enablePush,
    pushToken,
    backgroundColor,
}: {
    team: Team & { connectionId: string }
    hasPushEnabled: boolean
    enablePush: () => Promise<void>
    pushToken: string | null
    backgroundColor: string
}) {
    const [enabledEvents, setEnabledEvents] = useState<string[]>([])

    const teamAvatarQuery = useQuery({
        queryKey: ['team', team.id, 'avatar'],
        queryFn: () => fetchTeamAvatar({ connectionId: team.connectionId, teamId: team.id }),
    })

    const webhookQuery = useQuery({
        queryKey: ['webhook', team.id],
        queryFn: async () => {
            if (!pushToken) return null

            const webhook = await fetchWebhook({
                connectionId: team.connectionId,
                teamId: team.id,
                pushToken: pushToken,
            })

            console.log(
                '[webhookQuery] webhook for team',
                team.id,
                JSON.stringify(webhook, null, 2)
            )

            if (!webhook) return null

            return {
                ...webhook,
                connectionId: team.connectionId,
                teamId: team.id,
            }
        },
    })

    const registerWebhookMutation = useMutation({
        mutationFn: async () => {
            if (!pushToken) return

            await registerWebhook({
                connectionId: team.connectionId,
                teamId: team.id,
                events: enabledEvents,
                pushToken: pushToken,
            })
        },
        onSuccess: () => {
            webhookQuery.refetch()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    useEffect(() => {
        // biome-ignore lint/style/useExplicitLengthCheck: <explanation>
        if (!webhookQuery.data?.events?.length) return
        setEnabledEvents(webhookQuery.data.events)
    }, [webhookQuery.data])

    const registerWebhookDebounced = useDebouncedCallback(async () => {
        await registerWebhookMutation.mutateAsync()
    }, 1000)

    const toggleEvent = useCallback(
        async (event: string) => {
            if (!hasPushEnabled || !pushToken) {
                await enablePush()
                return
            }

            setEnabledEvents((prev) =>
                prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
            )
            registerWebhookDebounced()
        },
        [registerWebhookDebounced, hasPushEnabled, enablePush, pushToken]
    )

    // when event changes
    // check if push notifications are enabled, if not ask for permission
    // delete existing vercel webhook
    // create new vercel webhook
    // update worker data (send push token if necessary)
    // reset webhook query

    return (
        <View style={{ flexDirection: 'column', gap: 20, backgroundColor, padding: 14 }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            overflow: 'hidden',
                        }}
                    >
                        {teamAvatarQuery.data && (
                            <SvgUri
                                uri={teamAvatarQuery.data}
                                style={{
                                    flex: 1,
                                }}
                            />
                        )}
                    </View>
                    <Text style={{ fontSize: 24, color: COLORS.gray1000 }}>{team.name}</Text>
                </View>

                {registerWebhookMutation.isPending && (
                    <ActivityIndicator size="small" color={COLORS.gray1000} />
                )}
            </View>

            <View style={{ flexDirection: 'column', gap: 10 }}>
                {Object.entries(LABEL_FOR_EVENT).map(([event, label]) => (
                    <View
                        key={event}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                        }}
                    >
                        <View style={{ flexDirection: 'column', gap: 2 }}>
                            <Text
                                style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.gray1000 }}
                            >
                                {label}
                            </Text>

                            <Text style={{ fontSize: 14, color: COLORS.gray900 }}>{event}</Text>
                        </View>

                        <Switch
                            value={enabledEvents.includes(event)}
                            onValueChange={() => toggleEvent(event)}
                            trackColor={{
                                true: COLORS.success,
                                false: undefined,
                            }}
                            thumbColor={Platform.OS === 'android' ? COLORS.successDark : undefined}
                        />
                    </View>
                ))}
            </View>
        </View>
    )
}

const LABEL_FOR_EVENT = {
    'deployment.created': 'Deployment Created',
    'deployment.error': 'Deployment Error',
    'deployment.canceled': 'Deployment Canceled',
    'deployment.succeeded': 'Deployment Succeeded',
    'deployment.promoted': 'Deployment Promoted',
    'project.created': 'Project Created',
    'project.removed': 'Project Removed',
    'firewall.attack': 'Attack Detected',
}
