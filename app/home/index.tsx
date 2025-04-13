import { fetchAllTeams, fetchTeamAvatar, fetchTeamProjects, fetchUserInfo } from '@/api/queries'
import ApiStatus from '@/components/ApiStatus'
import BottomGradient from '@/components/BottomGradient'
import DeploymentCard from '@/components/DeploymentCard'
import ProjectCard from '@/components/ProjectCard'
import { useNotificationHandler, useWebhookCheck } from '@/lib/hooks'
import { queryClient } from '@/lib/query'
import { storage } from '@/lib/storage'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import CookieManager, { type Cookie } from '@react-native-cookies/cookies'
import { useQueries, useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useNavigation } from 'expo-router'
import { SquircleView } from 'expo-squircle-view'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Image, Platform } from 'react-native'
import {
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { SvgUri } from 'react-native-svg'

export default function HomeScreen() {
    const navigation = useNavigation()
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = useMemo(() => currentConnection?.currentTeamId, [currentConnection])
    const removeConnection = usePersistedStore((state) => state.removeConnection)
    const switchConnection = usePersistedStore((state) => state.switchConnection)
    const { width: windowWidth } = useWindowDimensions()

    const usersQueries = useQueries({
        queries: connections.map((connection) => ({
            queryKey: ['user', connection.id],
            queryFn: async () => {
                const user = await fetchUserInfo({ connectionId: connection.id })
                return user
            },
            enabled: !!connection,
        })),
    })

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

    const teamProjectsQuery = useQuery({
        queryKey: ['team', currentTeamId, 'projects'],
        queryFn: () => fetchTeamProjects(),
        enabled: !!currentTeamId,
    })

    const teamAvatarQuery = useQuery({
        queryKey: ['team', currentTeamId, 'avatar'],
        queryFn: () => fetchTeamAvatar(),
        enabled: !!currentTeamId,
    })

    const currentUser = useMemo(() => {
        return usersQueries.find((u) => u.data?.uid === currentConnection?.id)?.data
    }, [usersQueries, currentConnection?.id])

    const currentUserTeams = useMemo(() => {
        return (
            teamsQueries.find((t) => t.data?.connectionId === currentUser?.uid)?.data?.teams || []
        )
    }, [currentUser, teamsQueries])

    const currentTeam = useMemo(() => {
        if (!currentTeamId || !currentUserTeams || currentUserTeams.length === 0) return undefined
        console.log('[currentTeam] currentUserTeams', JSON.stringify(currentUserTeams, null, 2))
        const team = currentUserTeams?.find((t) => t.id === currentTeamId)
        return team
    }, [currentUserTeams, currentTeamId])

    const latestDeployment = useMemo(() => {
        // return DUMMY_PROJECTS[3].latestDeployments[0]
        const projectWithLatestDeployment = teamProjectsQuery.data?.find(
            (project) => project.latestDeployments.length > 0
        )

        return projectWithLatestDeployment?.latestDeployments[0]
    }, [teamProjectsQuery.data])

    useEffect(() => {
        // this is needed on first login, and when switching connections (not accounts/teams/workspaces)
        // to pick an accountId from the received ones
        // console.log('currentTeamId', currentTeamId)
        if (!currentTeamId && currentUserTeams?.length > 0) {
            switchConnection({ connectionId: currentUser?.uid!, teamId: currentUserTeams[0].id })
        }

        // sets a new team if the user lost access to the current one
        if (currentTeam && !currentUserTeams?.find((team) => team.id === currentTeamId)) {
            for (const team of currentUserTeams) {
                switchConnection({ connectionId: currentUser?.uid!, teamId: team.id })
                break
            }
        }
    }, [currentTeamId, currentUserTeams, currentUser, switchConnection, currentTeam])

    const latestProjects = useMemo(() => {
        if (!teamProjectsQuery.data) return []

        if (windowWidth < 744) {
            return teamProjectsQuery.data?.slice(0, 5)
        }

        if (windowWidth < 1024) {
            return teamProjectsQuery.data?.slice(0, 8)
        }

        if (windowWidth < 1280) {
            return teamProjectsQuery.data?.slice(0, 11)
        }

        return teamProjectsQuery.data?.slice(0, 14)
    }, [teamProjectsQuery.data, windowWidth])

    const cardWidth = useMemo(() => {
        if (windowWidth < 744) {
            return '47.5%'
        }

        if (windowWidth < 1024) {
            return '31.6%'
        }

        if (windowWidth < 1280) {
            return '23.6%'
        }

        return '18.9%'
    }, [windowWidth])

    useLayoutEffect(() => {
        if (!currentUser) return
        if (!currentTeam) return

        navigation.setOptions({
            headerShown: true,
            title: currentTeam?.name,
            // title: "G's Projects",
            headerLargeTitle: true,
            headerLeft: () => (
                <ContextMenu
                    dropdownMenuMode={true}
                    actions={[
                        ...usersQueries.map((u) => ({
                            title: u.data?.username!,
                            subtitle: u.data?.email,
                            inlineChildren: true,
                            actions: [
                                ...(teamsQueries
                                    .filter((t) => t.data)
                                    .filter((t) => t.data!.connectionId === u.data?.uid)
                                    .map((t) => t.data!.teams)
                                    .flatMap((teams) =>
                                        teams.map((team) => ({
                                            title: team.name,
                                            destructive: false,
                                            disabled: team.id === currentTeamId,
                                        }))
                                    ) || []),

                                {
                                    title: 'Remove Connection',
                                    systemIcon: 'trash',
                                    destructive: true,
                                },
                            ],
                        })),
                        {
                            title: 'Notifications',
                            systemIcon: 'bell',
                            destructive: false,
                        },
                        {
                            title: 'Add Connection',
                            systemIcon: 'plus',
                            destructive: false,
                        },
                    ]}
                    onPress={(e) => {
                        if (e.nativeEvent.name === 'Remove Connection') {
                            const [userPath] = e.nativeEvent.indexPath // [userPath, actionPath]

                            Alert.alert(
                                'Remove Connection',
                                'Are you sure you want to remove this connection?',
                                [
                                    {
                                        text: 'Remove',
                                        onPress: () => {
                                            // we can  use the same index because they get displayed in the same order
                                            const connectionId = usersQueries[userPath].data?.uid
                                            if (!connectionId) return

                                            removeConnection(connectionId)

                                            // if we had 1 connection before, we will have none
                                            if (connections.length === 1) {
                                                storage.clearAll()
                                                router.dismissAll()
                                                router.replace('/login')
                                                queryClient.clear()
                                                return
                                            }
                                        },
                                        style: 'destructive',
                                    },
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                    },
                                ]
                            )

                            return
                        }

                        if (e.nativeEvent.name === 'Add Connection') {
                            router.push('/login')
                            return
                        }

                        if (e.nativeEvent.name === 'Notifications') {
                            router.push('/notifications')
                            return
                        }

                        const [userPath, teamPath] = e.nativeEvent.indexPath
                        const selectedUser = usersQueries[userPath].data
                        const selectedTeam = teamsQueries
                            .find((t) => t.data?.connectionId === selectedUser?.uid)
                            ?.data?.teams.at(teamPath)

                        if (!selectedTeam || !selectedUser) return

                        if (selectedTeam.id !== currentTeamId) {
                            switchConnection({
                                connectionId: selectedUser.uid,
                                teamId: selectedTeam.id,
                            })
                            return
                        }
                    }}
                >
                    <TouchableOpacity
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            overflow: 'hidden',
                            marginRight: 10,
                        }}
                    >
                        {teamAvatarQuery.data ? (
                            <SvgUri
                                uri={teamAvatarQuery.data}
                                style={{
                                    flex: 1,
                                }}
                            />
                        ) : (
                            <View style={{ flex: 1, backgroundColor: COLORS.successDark }} />
                        )}
                        {/* <Image
                            source={{
                                uri: 'https://pbs.twimg.com/media/F98EicKawAAR4ha.png',
                            }}
                            style={{
                                flex: 1,
                            }}
                        /> */}
                    </TouchableOpacity>
                </ContextMenu>
            ),
            headerRight: () => (
                <TouchableOpacity
                    onPress={async () => {
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

                        router.push('/v0')
                    }}
                >
                    <Image source={require('@/assets/v0.png')} style={{ width: 32, height: 16 }} />
                </TouchableOpacity>
            ),
        })
    }, [
        navigation,
        currentTeamId,
        currentTeam,
        currentUser,
        usersQueries,
        teamsQueries,
        teamAvatarQuery.data,
        currentConnection?.apiToken,
        removeConnection,
        switchConnection,
        connections.length,
    ])

    useNotificationHandler()
    useWebhookCheck(teamsQueries)

    if (!currentTeam || !currentUser) return null

    return (
        <>
            <ScrollView
                style={{
                    flex: 1,
                }}
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: 40,
                    // gap: 12,
                }}
                refreshControl={
                    <RefreshControl
                        tintColor={COLORS.successLight}
                        refreshing={teamProjectsQuery.isRefetching}
                        onRefresh={() => {
                            queryClient.invalidateQueries({ queryKey: ['apiStatus'] })
                            teamProjectsQuery.refetch()
                        }}
                        // android
                        progressBackgroundColor={COLORS.backgroundSecondary}
                        colors={[COLORS.successLight]}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
            >
                <View style={{ flexDirection: 'column', paddingHorizontal: 16, gap: 20 }}>
                    {/* Latest Deployment */}
                    {latestDeployment && (
                        <DeploymentCard
                            deployment={latestDeployment}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                                router.push(`/deployments/${latestDeployment.id}`)
                            }}
                            disableActiveBorder={true}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: COLORS.blue600,
                                    // backgroundColor: '#ff00ff05',
                                    textAlign: 'center',
                                    paddingTop: 16,
                                }}
                            >
                                Tap to view deployment details →
                            </Text>
                        </DeploymentCard>
                    )}

                    {/* Recent Projects + View All Projects */}
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 18,
                            // backgroundColor: 'blue',
                        }}
                    >
                        {latestProjects.map((project) => (
                            <ProjectCard project={project} key={project.id} />
                        ))}

                        <SquircleView
                            borderRadius={12}
                            style={{
                                width: cardWidth,
                                height: 180,
                                backgroundColor: COLORS.gray200,
                                elevation: 3,
                                overflow: 'hidden',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                                    router.push('/projects/all')
                                }}
                            >
                                <Ionicons
                                    name="arrow-forward-circle-outline"
                                    size={32}
                                    color={COLORS.gray1000}
                                />
                                <Text style={{ color: COLORS.gray1000 }}>View All Projects</Text>
                            </TouchableOpacity>
                        </SquircleView>
                    </View>

                    <View style={{ paddingTop: 16 }}>
                        <ApiStatus />
                    </View>
                </View>
            </ScrollView>

            <BottomGradient />
        </>
    )
}

/*
<Text style={{ fontSize: 14, color: COLORS.gray1000 }}>
	{formatDistanceToNow(new Date('2025-02-06T12:00:00Z'), {
		addSuffix: true,
	}).replace('about ', '')}
</Text>
*/
