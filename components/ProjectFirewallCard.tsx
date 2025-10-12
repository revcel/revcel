import { toggleFirewall } from '@/api/mutations'
import { fetchProjectFirewallMetrics, fetchTeamProjects } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useGlobalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Text, View } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'

export default function ProjectFirewallCard() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = useMemo(() => currentConnection?.currentTeamId, [currentConnection])

    const [isWorking, setIsWorking] = useState(false)

    const teamProjectsQuery = useQuery({
        queryKey: ['team', currentTeamId, 'projects'],
        queryFn: () => fetchTeamProjects(),
        enabled: !!currentTeamId,
    })

    const project = useMemo(() => {
        return teamProjectsQuery.data?.find((project) => project.id === projectId)
    }, [teamProjectsQuery.data, projectId])

    const metricsQuery = useQuery({
        queryKey: ['project', projectId, 'firewall', 'metrics'],
        queryFn: () => fetchProjectFirewallMetrics({ projectId }),
        enabled: !!projectId,
    })

    // const attackModeMutation = useMutation({
    //     mutationFn: toggleFirewall,
    //     onSuccess: () => {
    //         // we cannot use mutations in ContextMenu, if the mutation is not inside a view contained by the Context Menu
    //         // NSInternalInconsistencyException: RCTComponentViewRegistry: Attempt to recycle a mounted view.
    //         // teamProjectsQuery.refetch()
    //         queryClient.invalidateQueries({ queryKey: ['team', currentTeamId, 'projects'] })
    //     },
    //     onError: (error) => {
    //         Alert.alert('Error', error.message)
    //     },
    // })

    const allowed = metricsQuery.data?.find((metric) => metric.wafAction === 'allow')?.value
    const denied = metricsQuery.data?.find((metric) => metric.wafAction === 'deny')?.value
    const challenged = metricsQuery.data?.find((metric) => metric.wafAction === 'challenge')?.value

    console.log('metrics', JSON.stringify(metricsQuery.data, null, 2))

    if (metricsQuery.isLoading) {
        return (
            <View
                style={{
                    width: '100%',
                    height: 120,
                    flexDirection: 'column',
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    padding: 12,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Firewall</Text>
                <ActivityIndicator style={{ flex: 1 }} size="small" color={COLORS.success} />
            </View>
        )
    }

    if (metricsQuery.isError) {
        return (
            <View
                style={{
                    width: '100%',
                    height: 120,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    padding: 12,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.errorLighter }}>
                    Error fetching firewall metrics or rules.
                </Text>
            </View>
        )
    }

    return (
        <ContextMenu
            dropdownMenuMode={true}
            actions={[
                {
                    title: project?.security?.attackModeEnabled
                        ? 'Disable Attack Mode'
                        : 'Enable Attack Mode',
                    destructive: !project?.security?.attackModeEnabled,
                },
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                Alert.alert(
                    'Are you sure?',
                    `This will ${
                        project?.security?.attackModeEnabled ? 'disable' : 'enable'
                    } the firewall for ${project?.name}.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: project?.security?.attackModeEnabled ? 'Disable' : 'Enable',
                            style: 'destructive',
                            onPress: async () => {
                                // await attackModeMutation.mutateAsync({
                                //     projectId,
                                //     attackModeEnabled: !project?.security?.attackModeEnabled,
                                // })

                                setIsWorking(true)

                                try {
                                    await toggleFirewall({
                                        projectId,
                                        attackModeEnabled: !project?.security?.attackModeEnabled,
                                    })

                                    queryClient.invalidateQueries({
                                        queryKey: ['team', currentTeamId, 'projects'],
                                    })
                                } catch (error) {
                                    // @ts-ignore
                                    Alert.alert('Error', error.message)
                                } finally {
                                    setIsWorking(false)
                                }
                            },
                        },
                    ]
                )
            }}
        >
            <View
                style={{
                    width: '100%',
                    height: 120,
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: 'column',
                    gap: 10,
                }}
            >
                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Firewall</Text>

                    {project?.security?.attackModeEnabled && (
                        <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                    )}

                    {/* //! using && instead of ternary operator crashes the app */}
                    {isWorking ? (
                        <ActivityIndicator size="small" color={COLORS.gray1000} />
                    ) : undefined}
                </View>

                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.gray1000 }}>
                            {allowed?.toLocaleString() || '—'}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.success }}>
                            Allowed
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.gray1000 }}>
                            {denied?.toLocaleString() || '—'}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.error }}>
                            Denied
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.gray1000 }}>
                            {challenged?.toLocaleString() || '—'}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.warning }}>
                            Challenged
                        </Text>
                    </View>
                </View>
            </View>
        </ContextMenu>
    )
}
