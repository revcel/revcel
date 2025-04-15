import { fetchTeamProjects } from '@/api/queries'
import DeploymentCard from '@/components/DeploymentCard'
import EmptyListComponent from '@/components/EmptyListComponent'
import ProjectFirewallCard from '@/components/ProjectFirewallCard'
import ProjectQuickActions from '@/components/ProjectQuickActions'
import { HeaderTouchableOpacity } from '@/components/HeaderTouchableOpacity'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Alert, RefreshControl, View } from 'react-native'

export default function ProjectHomeScreen() {
    const { projectId, connectionId, teamId } = useLocalSearchParams<{
        projectId: string
        connectionId?: string
        teamId?: string
    }>()
    console.log('[ProjectDetailScreen] projectId', projectId)
    const navigation = useNavigation()

    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = useMemo(() => currentConnection?.currentTeamId, [currentConnection])
    const switchConnection = usePersistedStore((state) => state.switchConnection)

    const acknowledged = usePersistedStore((state) => state.acknowledgments)
    const acknowledge = usePersistedStore((state) => state.acknowledge)

    const teamProjectsQuery = useQuery({
        queryKey: ['team', currentTeamId, 'projects'],
        queryFn: () => fetchTeamProjects(),
    })

    const project = useMemo(() => {
        return teamProjectsQuery.data?.find((project) => project.id === projectId)
    }, [teamProjectsQuery.data, projectId])

    const emptyListComponent = useMemo(() => {
        const emptyProject = EmptyListComponent({
            isLoading: teamProjectsQuery.isLoading,
            hasValue: !!project,
            emptyLabel: 'Missing project',
            error: teamProjectsQuery.error,
            errorLabel: 'Failed to fetch project',
        })

        return emptyProject
    }, [teamProjectsQuery.isLoading, project, teamProjectsQuery.error])

    useEffect(() => {
        // when navigating from widgets/notifications and the project is on a different connection/team
        if (connectionId && teamId && teamId !== currentTeamId) {
            // this is needed otherwise the existent query will use an invalid teamId/connectionId combination and have no/wrong data
            queryClient
                .resetQueries({
                    queryKey: ['team', currentTeamId, 'projects'],
                })
                .then(() => {
                    switchConnection({ connectionId, teamId })
                })
        }
    }, [connectionId, teamId, currentTeamId, switchConnection])

    useLayoutEffect(() => {
        if (project) {
            navigation.setOptions({
                title: project.name || 'Project',
                headerRight: () => (
                    <HeaderTouchableOpacity
                        style={{
                            backgroundColor: COLORS.gray200,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 16,
                            height: 32,
                            width: 32,
                        }}
                        onPress={() => {
                            if (!acknowledged.swipeLeftProject) {
                                acknowledge('swipeLeftProject')
                                Alert.alert('Quick Tip', 'You can swipe left to go back!', [
                                    { text: 'Good to know!', style: 'cancel' },
                                ])
                            }
                            router.back()
                        }}
                    >
                        <Ionicons name="close" size={18} color={COLORS.gray1000} />
                    </HeaderTouchableOpacity>
                ),
            })
        }
    }, [project, navigation, acknowledged, acknowledge])

    return (
        <>
            <Stack.Screen
                name="index"
                options={{
                    title: project?.name || 'Project',
                }}
            />
            <FlashList
                contentInsetAdjustmentBehavior="automatic"
                data={project?.latestDeployments}
                refreshControl={
                    <RefreshControl
                        tintColor={COLORS.successLight}
                        refreshing={teamProjectsQuery.isRefetching}
                        onRefresh={teamProjectsQuery.refetch}
                        // android
                        progressBackgroundColor={COLORS.backgroundSecondary}
                        colors={[COLORS.successLight]}
                    />
                }
                contentContainerStyle={
                    emptyListComponent
                        ? undefined
                        : {
                              paddingBottom: 40,
                          }
                }
                overrideProps={
                    emptyListComponent && {
                        contentContainerStyle: {
                            flex: 1,
                        },
                    }
                }
                ListHeaderComponent={() => (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            paddingBottom: 20,
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        <ProjectFirewallCard />
                        <ProjectQuickActions />
                    </View>
                )}
                ListEmptyComponent={emptyListComponent}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    // this is now needed due to overriding the `contentContainerStyle`
                    // setting padding inside pushes the cards to the right
                    <View style={{ paddingHorizontal: 16 }}>
                        <DeploymentCard
                            deployment={item}
                            onPress={() => {
                                router.push(`/deployments/${item.id}`)
                            }}
                        />
                    </View>
                )}
            />
        </>
    )
}
