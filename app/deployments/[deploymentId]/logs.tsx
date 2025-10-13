import { fetchTeamDeployment, fetchTeamDeploymentBuildMetadata } from '@/api/queries'
import BottomGradient from '@/components/BottomGradient'
import { SelectableText } from '@/components/SelectableText'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { formatDeploymentShortId } from '@/lib/format'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Platform, Text, TouchableOpacity, View } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'

export default function DeploymentLogs() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()

    const [viewMode, setViewMode] = useState<'normal' | 'expanded' | 'copy'>('normal')
    const [searchString, setSearchString] = useState('')

    const deploymentQuery = useQuery({
        queryKey: ['deployment', deploymentId],
        queryFn: () => fetchTeamDeployment({ deploymentId }),
        enabled: !!deploymentId,
    })

    const deploymentBuildMetadataQuery = useQuery({
        queryKey: ['deployment', deploymentId, 'buildMetadata'],
        queryFn: () => fetchTeamDeploymentBuildMetadata({ deployment: deploymentQuery.data! }),
        enabled: !!deploymentQuery.data,
    })

    const filteredLogs = useMemo(() => {
        if (!deploymentBuildMetadataQuery.data) return []
        if (!searchString) return deploymentBuildMetadataQuery.data.buildLogs

        return deploymentBuildMetadataQuery.data.buildLogs.filter((log) =>
            log.text.toLowerCase().includes(searchString.toLowerCase())
        )
    }, [deploymentBuildMetadataQuery.data, searchString])

    const combinedLogText = useMemo(() => {
        return filteredLogs.map((log) => log.text).join('\n')
    }, [filteredLogs])

    const Placeholder = useMemo(() => {
        const emptyDeployment = buildPlaceholder({
            isLoading: deploymentQuery.isLoading,
            hasData: !!deploymentQuery.data,
            emptyLabel: 'Missing deployment',
            isError: deploymentQuery.isError,
            errorLabel: 'Failed to fetch deployment',
        })

        if (emptyDeployment) {
            return emptyDeployment
        }

        const emptyBuildMetadata = buildPlaceholder({
            isLoading: deploymentBuildMetadataQuery.isLoading,
            hasData: !!deploymentBuildMetadataQuery.data?.buildLogs.length,
            emptyLabel: 'No logs found',
            isError: deploymentBuildMetadataQuery.isError,
            errorLabel: 'Failed to fetch logs',
        })

        return emptyBuildMetadata
    }, [
        deploymentQuery.isLoading,
        deploymentQuery.data,
        deploymentQuery.isError,
        deploymentBuildMetadataQuery.isLoading,
        deploymentBuildMetadataQuery.data?.buildLogs.length,
        deploymentBuildMetadataQuery.isError,
    ])

    return (
        <>
            <Stack.Screen
                // name="logs"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: `Logs (${formatDeploymentShortId(deploymentQuery.data)})`,
                    headerRight: () => (
                        <ContextMenu
                            dropdownMenuMode={true}
                            actions={[
                                {
                                    title: 'Normal Mode',
                                    disabled: viewMode === 'normal',
                                    systemIcon: 'text.alignleft',
                                },
                                {
                                    title: 'Expanded Mode',
                                    disabled: viewMode === 'expanded',
                                    systemIcon: 'text.append',
                                },
                                {
                                    title: 'Copy Mode',
                                    disabled: viewMode === 'copy',
                                    systemIcon: 'doc.on.clipboard',
                                },
                            ]}
                            onPress={(e) => {
                                if (e.nativeEvent.name === 'Normal Mode') {
                                    setViewMode('normal')
                                    return
                                }

                                if (e.nativeEvent.name === 'Expanded Mode') {
                                    setViewMode('expanded')
                                    return
                                }

                                if (e.nativeEvent.name === 'Copy Mode') {
                                    setViewMode('copy')
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
                    headerSearchBarOptions: {
                        placeholder: 'Search logs',
                        hideWhenScrolling: true,
                        textColor: COLORS.gray1000,
                        autoCapitalize: 'none',
                        onChangeText: (event: any) => setSearchString(event.nativeEvent.text),
                        // autoFocus: false,
                    },
                }}
            />
            {viewMode === 'copy' ? (
                <SelectableText text={combinedLogText} />
            ) : (
                <FlashList
                    data={filteredLogs}
                    extraData={viewMode}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl onRefresh={deploymentBuildMetadataQuery.refetch} />
                    }
                    overrideProps={
                        Placeholder
                            ? {
                                  contentContainerStyle: {
                                      flex: 1,
                                  },
                              }
                            : Platform.select({
                                  android: {
                                      contentContainerStyle: {
                                          paddingBottom: 40,
                                      },
                                  },
                              })
                    }
                    ListEmptyComponent={Placeholder}
                    ItemSeparatorComponent={() => (
                        <View style={{ height: viewMode === 'expanded' ? 16 : 8 }} />
                    )}
                    renderItem={({ item: log }) => (
                        <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
                            <Text
                                style={{
                                    color: COLORS.gray900,
                                    marginRight: 8,
                                    fontVariant: ['tabular-nums'],
                                    fontFamily: 'Geist',
                                }}
                            >
                                {format(log.created, 'HH:mm:ss')}
                            </Text>
                            <Text
                                style={{
                                    color: COLORS.gray1000,
                                    flex: 1,
                                    fontFamily: 'Geist',
                                }}
                                numberOfLines={viewMode === 'expanded' ? undefined : 1}
                            >
                                {log.text}
                            </Text>
                        </View>
                    )}
                />
            )}
            <BottomGradient />
        </>
    )
}
