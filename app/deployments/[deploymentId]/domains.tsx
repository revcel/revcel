import { fetchTeamDeployment } from '@/api/queries'
import { formatDeploymentShortId } from '@/lib/format'
import { useBrowser } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

export default function Deployment() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()
    const openBrowser = useBrowser()

    const deploymentQuery = useQuery({
        queryKey: ['deployment', deploymentId],
        queryFn: () => fetchTeamDeployment({ deploymentId }),
        enabled: !!deploymentId,
    })

    const aliases = useMemo(() => {
        return (
            deploymentQuery.data?.alias
                .filter((alias) =>
                    deploymentQuery.data.meta.branchAlias
                        ? !alias.includes(deploymentQuery.data.meta.branchAlias)
                        : true
                )
                // is this needed if we have the next line?
                .filter((alias) => alias !== deploymentQuery.data.url)
                .filter((alias) => alias.includes('vercel.app'))
        )
    }, [deploymentQuery.data])

    const domains = useMemo(() => {
        return deploymentQuery.data?.alias.filter((alias) => !alias.includes('vercel.app'))
    }, [deploymentQuery.data])

    if (deploymentQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.success} />
            </View>
        )
    }

    if (!deploymentQuery.data) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>Missing deployment</Text>
            </View>
        )
    }

    if (!domains?.length && !aliases?.length) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>No domains found</Text>
            </View>
        )
    }

    return (
        <>
            <Stack.Screen
                // name="domains"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: `Domains (${formatDeploymentShortId(deploymentQuery.data)})`,
                }}
            />
            <ScrollView
                style={{ flex: 1, backgroundColor: COLORS.background }}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        tintColor={COLORS.successLight}
                        refreshing={deploymentQuery.isRefetching}
                        onRefresh={deploymentQuery.refetch}
                        // android
                        progressBackgroundColor={COLORS.backgroundSecondary}
                        colors={[COLORS.successLight]}
                    />
                }
                contentContainerStyle={{ gap: 20, flexDirection: 'column' }}
            >
                {domains && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            padding: 16,
                            width: '100%',
                        }}
                    >
                        <Text style={{ flex: 2, color: COLORS.gray900, fontSize: 16 }}>
                            Domains
                        </Text>
                        <View
                            style={{
                                flex: 3,
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            {domains?.map((domain) => (
                                <TouchableOpacity
                                    key={domain}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 8,
                                        backgroundColor: COLORS.gray100,
                                        borderRadius: 10,
                                    }}
                                    onPress={() => {
                                        openBrowser(`https://${domain}`)
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: COLORS.gray1000,
                                            fontSize: 16,
                                        }}
                                    >
                                        {domain}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {aliases && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            padding: 16,
                            width: '100%',
                        }}
                    >
                        <Text style={{ flex: 2, color: COLORS.gray900, fontSize: 16 }}>
                            Aliases
                        </Text>
                        <View
                            style={{
                                flex: 3,
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            {aliases?.map((alias) => (
                                <TouchableOpacity
                                    key={alias}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 8,
                                        backgroundColor: COLORS.gray100,
                                        borderRadius: 10,
                                    }}
                                    onPress={() => {
                                        openBrowser(`https://${alias}`)
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: COLORS.gray1000,
                                            fontSize: 16,
                                        }}
                                    >
                                        {alias}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        padding: 16,
                        width: '100%',
                    }}
                >
                    <Text style={{ flex: 2, color: COLORS.gray900, fontSize: 16 }}>
                        Branch Link
                    </Text>

                    <TouchableOpacity
                        style={{
                            flex: 3,

                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            backgroundColor: COLORS.gray100,
                            borderRadius: 10,
                        }}
                        onPress={() => {
                            openBrowser(`https://${deploymentQuery.data.meta.branchAlias}`)
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.gray1000,
                                fontSize: 16,
                            }}
                        >
                            {deploymentQuery.data.meta.branchAlias}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        padding: 16,
                        width: '100%',
                    }}
                >
                    <Text style={{ flex: 2, color: COLORS.gray900, fontSize: 16 }}>
                        Commit Link
                    </Text>

                    <TouchableOpacity
                        style={{
                            flex: 3,

                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            backgroundColor: COLORS.gray100,
                            borderRadius: 10,
                        }}
                        onPress={() => {
                            openBrowser(`https://${deploymentQuery.data.url}`)
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.gray1000,
                                fontSize: 16,
                            }}
                        >
                            {deploymentQuery.data.url}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    )
}
