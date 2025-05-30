import {
    cancelDeployment,
    deleteDeployment,
    promoteDeployment,
    redeployDeployment,
    rollbackDeployment,
} from '@/api/mutations'
import {
    fetchProductionDeployment,
    fetchTeamDeployment,
    fetchTeamDeploymentBuildMetadata,
} from '@/api/queries'
import { formatDeploymentShortId, formatFrameworkName } from '@/lib/format'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
    formatDuration as formatDateFnsDuration,
    formatDistanceToNow,
    intervalToDuration,
} from 'date-fns'
import * as Haptics from 'expo-haptics'
import { type Href, router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import ContextMenu, { type ContextMenuAction } from 'react-native-context-menu-view'

export default function Deployment() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()
    const navigation = useNavigation()
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = useMemo(() => currentConnection?.currentTeamId, [currentConnection])

    const [isWorking, setIsWorking] = useState(false)

    const deploymentQuery = useQuery({
        queryKey: ['deployment', deploymentId],
        queryFn: () => fetchTeamDeployment({ deploymentId }),
    })

    const deployment = useMemo(() => deploymentQuery.data, [deploymentQuery.data])

    const productionDeploymentQuery = useQuery({
        queryKey: ['project', deployment?.projectId, 'productionDeployment'],
        queryFn: () => fetchProductionDeployment({ projectId: deployment?.projectId! }),
        enabled: !!deployment,
    })

    const rollbackMutation = useMutation({
        mutationFn: () =>
            rollbackDeployment({ id: deployment?.id!, projectId: deployment?.projectId! }),
        onMutate: () => {
            setIsWorking(true)
        },
        onSettled: () => {
            setIsWorking(false)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team', currentTeamId, 'projects'] })
            deploymentQuery.refetch()
            productionDeploymentQuery.refetch()
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteDeployment(deployment?.id!),
        onMutate: () => {
            setIsWorking(true)
        },
        onSettled: () => {
            setIsWorking(false)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deployment', deploymentId] })
            queryClient.refetchQueries({
                queryKey: ['team', currentTeamId, 'projects'],
            })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const promoteMutation = useMutation({
        mutationFn: () =>
            promoteDeployment({ id: deployment?.id!, projectId: deployment?.projectId! }),
        onMutate: () => {
            setIsWorking(true)
        },
        onSettled: () => {
            setIsWorking(false)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team', currentTeamId, 'projects'] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const redeployMutation = useMutation({
        mutationFn: () =>
            redeployDeployment({
                id: deployment?.id!,
                // @ts-ignore
                target: deployment?.target!,
                projectName: deployment?.project.name!,
            }),
        onMutate: () => {
            setIsWorking(true)
        },
        onSettled: () => {
            setIsWorking(false)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team', currentTeamId, 'projects'] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const cancelMutation = useMutation({
        mutationFn: () => cancelDeployment(deployment?.id!),
        onMutate: () => {
            setIsWorking(true)
        },
        onSettled: () => {
            setIsWorking(false)
        },
        onSuccess: () => {
            deploymentQuery.refetch()
            queryClient.invalidateQueries({ queryKey: ['team', currentTeamId, 'projects'] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const deploymentBuildMetadataQuery = useQuery({
        queryKey: ['deployment', deploymentId, 'buildMetadata'],
        queryFn: () => fetchTeamDeploymentBuildMetadata({ deployment: deploymentQuery.data! }),
        enabled: !!deploymentQuery.data,
    })

    useLayoutEffect(() => {
        if (!deployment) return
        const headerActions: ContextMenuAction[] = []

        // @ts-ignore
        if (
            deployment.readyState === 'READY' &&
            productionDeploymentQuery.data?.deployment.id !== deployment.id &&
            ['preview', 'development'].includes(deployment.target || '')
        ) {
            headerActions.push({
                title: 'Promote',
            })
        }

        if (['READY', 'CANCELED', 'ERROR'].includes(deployment.readyState)) {
            headerActions.push({
                title: 'Re-deploy',
            })
        }

        if (['QUEUED', 'INITIALIZING', 'BUILDING'].includes(deployment.readyState)) {
            headerActions.push({
                title: 'Cancel',
                destructive: true,
            })
        }

        // @ts-ignore
        if (
            deployment.readyState === 'READY' &&
            productionDeploymentQuery?.data?.deployment.id !== deployment?.id
        ) {
            headerActions.push({
                title: 'Rollback',
            })
        }

        if (!['QUEUED', 'INITIALIZING', 'BUILDING'].includes(deployment.readyState)) {
            headerActions.push({
                title: 'Delete',
                destructive: true,
            })
        }

        navigation.setOptions({
            headerShown: true,
            headerLargeTitle: true,
            title: formatDeploymentShortId(deployment),
            headerRight: isWorking
                ? () => <ActivityIndicator size="small" color={COLORS.gray1000} />
                : () => (
                      <ContextMenu
                          dropdownMenuMode={true}
                          actions={headerActions}
                          onPress={(e) => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

                              if (e.nativeEvent.name === 'Promote') {
                                  Alert.alert(
                                      'Promote',
                                      'Are you sure you want to promote this deployment?',
                                      [
                                          { text: 'Cancel', style: 'cancel' },
                                          {
                                              text: 'Promote',
                                              onPress: () => {
                                                  promoteMutation.mutate()
                                              },
                                          },
                                      ]
                                  )
                                  return
                              }
                              if (e.nativeEvent.name === 'Re-deploy') {
                                  Alert.alert(
                                      'Confirm',
                                      'Are you sure you want to re-deploy this deployment?',
                                      [
                                          { text: 'Cancel', style: 'cancel' },
                                          {
                                              text: 'Re-deploy',
                                              onPress: () => redeployMutation.mutate(),
                                          },
                                      ]
                                  )
                                  return
                              }
                              if (e.nativeEvent.name === 'Cancel') {
                                  Alert.alert(
                                      'Cancel',
                                      'Are you sure you want to cancel this deployment?',
                                      [
                                          { text: 'Back', style: 'cancel' },
                                          {
                                              text: 'Cancel',
                                              style: 'destructive',
                                              onPress: () => cancelMutation.mutate(),
                                          },
                                      ]
                                  )
                                  return
                              }
                              if (e.nativeEvent.name === 'Rollback') {
                                  Alert.alert(
                                      'Rollback',
                                      'Are you sure you want to rollback this deployment?',
                                      [
                                          { text: 'Cancel', style: 'cancel' },
                                          {
                                              text: 'Rollback',
                                              onPress: () => rollbackMutation.mutate(),
                                          },
                                      ]
                                  )
                                  return
                              }
                              if (e.nativeEvent.name === 'Delete') {
                                  Alert.alert(
                                      'Delete',
                                      'Are you sure you want to delete this deployment?',
                                      [
                                          { text: 'Cancel', style: 'cancel' },
                                          {
                                              text: 'Delete',
                                              style: 'destructive',
                                              onPress: () => deleteMutation.mutate(),
                                          },
                                      ]
                                  )
                                  return
                              }
                          }}
                      >
                          <TouchableOpacity
                              style={{
                                  backgroundColor: COLORS.gray200,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  borderRadius: 16,
                                  height: 32,
                                  width: 32,
                              }}
                          >
                              <Ionicons
                                  name="ellipsis-horizontal-sharp"
                                  size={18}
                                  color={COLORS.gray1000}
                              />
                          </TouchableOpacity>
                      </ContextMenu>
                  ),
        })
    }, [
        navigation,
        deployment,
        productionDeploymentQuery.data,
        isWorking,
        cancelMutation.mutate,
        rollbackMutation.mutate,
        deleteMutation.mutate,
        promoteMutation.mutate,
        redeployMutation.mutate,
    ])

    if (deploymentQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.success} />
            </View>
        )
    }

    if (!deployment) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>No deployment found</Text>
            </View>
        )
    }

    // console.log('deployment', JSON.stringify(deployment, null, 2))

    const formatDuration = (start: number, end: number) => {
        const duration = intervalToDuration({ start, end })
        return formatDateFnsDuration(duration, { format: ['minutes', 'seconds'] })
    }

    return (
        <>
            <ScrollView
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 20, flexDirection: 'column' }}
                refreshControl={
                    <RefreshControl
                        tintColor={COLORS.successLight}
                        refreshing={deploymentQuery.isRefetching}
                        onRefresh={() => {
                            deploymentQuery.refetch()
                            // deploymentScreenshotQuery.refetch()
                        }}
                        // android
                        progressBackgroundColor={COLORS.backgroundSecondary}
                        colors={[COLORS.successLight]}
                    />
                }
            >
                <View
                    style={{
                        flexDirection: 'column',
                        gap: 0,
                    }}
                >
                    {/* {deploymentScreenshotQuery.data && (
                        <Image
                            source={{ uri: deploymentScreenshotQuery.data }}
                            style={{ width: '100%', height: 200 }}
                        />
                    )} */}

                    {deployment.readyState === 'READY' && (
                        <Image
                            source={{
                                uri: `https://vercel.com/api/screenshot?dark=1&deploymentId=${deployment.id}&teamId=${currentTeamId}&withStatus=1`,
                                headers: {
                                    Authorization: `Bearer ${currentConnection?.apiToken}`,
                                },
                            }}
                            style={{
                                width: '100%',
                                height: 275,
                                resizeMode: 'contain',
                            }}
                        />
                    )}
                    <InfoRow
                        label="Status"
                        icon="checkmark-circle-outline"
                        value={deployment.readyState}
                        backgroundColor={COLORS.gray100}
                    />
                    <InfoRow
                        label="Created"
                        icon="calendar-outline"
                        value={formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
                    />
                    <InfoRow
                        label="Framework"
                        icon="color-wand-outline"
                        value={formatFrameworkName(deployment.project.framework)}
                        backgroundColor={COLORS.gray100}
                    />
                    <InfoRow
                        label="Region"
                        icon="globe-outline"
                        value={deployment.regions.join(', ')}
                    />
                    <InfoRow
                        label="Commit"
                        icon="git-commit-outline"
                        value={deployment.meta.githubCommitMessage || 'No commit'}
                        backgroundColor={COLORS.gray100}
                    />
                    <InfoRow
                        label="Branch"
                        icon="git-branch-outline"
                        value={
                            // should use `githubCommitRef` every time
                            deployment.gitSource?.ref ||
                            deployment.meta.githubCommitRef ||
                            'No branch'
                        }
                    />
                    <InfoRow
                        label="Duration"
                        icon="timer-outline"
                        value={formatDuration(deployment.buildingAt, deployment.ready)}
                        backgroundColor={COLORS.gray100}
                    />

                    {deployment.readyState === 'READY' && (
                        <ButtonRow
                            label="Domains"
                            icon="link-outline"
                            route={`/deployments/${deploymentId}/domains`}
                        />
                    )}

                    {deployment.readyState === 'READY' && (
                        <ButtonRow
                            label="Source"
                            icon="folder-outline"
                            route={`/deployments/${deploymentId}/source`}
                            backgroundColor={COLORS.gray100}
                        />
                    )}

                    {deployment.readyState === 'READY' && (
                        <ButtonRow
                            label="Output"
                            icon="folder-open-outline"
                            route={`/deployments/${deploymentId}/output`}
                        />
                    )}

                    {deployment.readyState === 'READY' && (
                        <ButtonRow
                            label="Functions"
                            icon="code-slash-outline"
                            route={`/deployments/${deploymentId}/functions`}
                            backgroundColor={COLORS.gray100}
                        />
                    )}

                    <ButtonRow
                        label="Logs"
                        icon="terminal-outline"
                        route={`/deployments/${deploymentId}/logs`}
                    />
                </View>
            </ScrollView>
        </>
    )
}

function InfoRow({
    label,
    icon,
    value,
    backgroundColor,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    value: string
    backgroundColor?: string
}) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                width: '100%',
                backgroundColor: backgroundColor,
            }}
        >
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon} size={20} color="#666" />
                <Text style={{ color: '#666', fontSize: 14 }}>{label}</Text>
            </View>
            <View style={{ flex: 3, alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text
                    style={{
                        color: COLORS.gray1000,
                        fontSize: 14,
                        textAlign: 'right',
                    }}
                    numberOfLines={2}
                >
                    {value}
                </Text>
            </View>
        </View>
    )
}

function ButtonRow({
    label,
    icon,
    route,
    backgroundColor,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    route: Href
    backgroundColor?: string
}) {
    return (
        <TouchableOpacity
            onPress={() => router.push(route)}
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                width: '100%',
                backgroundColor: backgroundColor,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon} size={20} color="#666" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#666' }}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#666" />
        </TouchableOpacity>
    )
}
