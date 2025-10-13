import { fetchTeamDeployment, fetchTeamDeploymentBuildMetadata } from '@/api/queries'
import BottomGradient from '@/components/BottomGradient'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { formatBytes, formatDeploymentShortId } from '@/lib/format'
import { COLORS } from '@/theme/colors'
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Text, View } from 'react-native'

export default function DeploymentFunctions() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()

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

    const Placeholder = useMemo(() => {
        const emptyDeployment = buildPlaceholder({
            isLoading: deploymentQuery.isLoading,
            hasData: !!deploymentQuery.data,
            emptyLabel: 'Missing deployment',
            errorLabel: 'Error loading deployment',
            isError: deploymentQuery.isError,
        })

        if (emptyDeployment) return emptyDeployment

        const emptyFunctions = buildPlaceholder({
            isLoading: deploymentBuildMetadataQuery.isLoading,
            hasData: !!deploymentBuildMetadataQuery.data?.buildFunctions?.length,
            emptyLabel: 'No functions found',
            errorLabel: 'Error loading functions',
            isError: deploymentBuildMetadataQuery.isError,
        })

        return emptyFunctions
    }, [
        deploymentQuery.isLoading,
        deploymentQuery.data,
        deploymentQuery.isError,
        deploymentBuildMetadataQuery.isLoading,
        deploymentBuildMetadataQuery.data,
        deploymentBuildMetadataQuery.isError,
    ])

    return (
        <>
            <Stack.Screen
                // name="functions"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: `Functions (${formatDeploymentShortId(deploymentQuery.data)})`,
                }}
            />
            <FlashList
                data={deploymentBuildMetadataQuery.data?.buildFunctions}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl onRefresh={deploymentBuildMetadataQuery.refetch} />}
                ItemSeparatorComponent={() => (
                    <View style={{ height: 1, backgroundColor: COLORS.gray100 }} />
                )}
                overrideProps={
                    Placeholder && {
                        contentContainerStyle: {
                            flex: 1,
                        },
                    }
                }
                ListEmptyComponent={Placeholder}
                renderItem={({ item }) => {
                    const memorySize = item.type === 'lambda' ? item.lambda?.memorySize : 128
                    const runtime = item.type === 'lambda' ? item.lambda?.runtime : 'Edge'

                    return (
                        <View
                            style={{
                                padding: 16,
                                flexDirection: 'column',
                                gap: 20,
                            }}
                        >
                            <Text
                                style={{
                                    color: COLORS.gray1000,
                                    fontSize: 18,
                                    fontFamily: 'Geist',
                                }}
                            >
                                /{item.path}
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        gap: 4,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderWidth: 1,
                                        borderColor: COLORS.gray100,
                                    }}
                                >
                                    <Ionicons
                                        name="battery-full-outline"
                                        size={15}
                                        color={COLORS.gray900}
                                    />
                                    <Text
                                        style={{
                                            color: COLORS.gray900,
                                            fontSize: 14,
                                            textAlign: 'left',
                                            fontFamily: 'Geist',
                                        }}
                                        numberOfLines={1}
                                    >
                                        {runtime}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        gap: 4,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderWidth: 1,
                                        borderColor: COLORS.gray100,
                                    }}
                                >
                                    <FontAwesome5 name="memory" size={15} color={COLORS.gray900} />
                                    <Text
                                        style={{
                                            color: COLORS.gray900,
                                            fontSize: 14,
                                            textAlign: 'left',
                                            fontFamily: 'Geist',
                                        }}
                                        numberOfLines={1}
                                    >
                                        {memorySize} MB
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        gap: 4,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderWidth: 1,
                                        borderColor: COLORS.gray100,
                                    }}
                                >
                                    <MaterialIcons
                                        name="sd-storage"
                                        size={15}
                                        color={COLORS.gray900}
                                    />

                                    <Text
                                        style={{
                                            color: COLORS.gray900,
                                            fontSize: 14,
                                            textAlign: 'left',
                                            fontFamily: 'Geist',
                                        }}
                                        numberOfLines={1}
                                    >
                                        {formatBytes(item.size)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )
                }}
            />
            <BottomGradient />
        </>
    )
}
