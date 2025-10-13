import {
    fetchObservabilityColdStart,
    fetchObservabilityCpuThrottle,
    fetchObservabilityMemory,
    fetchObservabilityRouteSummary,
    fetchObservabilityTTFB,
} from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import RefreshControl from '@/components/base/RefreshControl'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import { useGlobalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'

export default function ProjectObservabilityScreen() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()

    const ttfbQuery = useQuery({
        queryKey: ['project', projectId, 'observability', 'ttfb'],
        queryFn: () => fetchObservabilityTTFB({ projectId, summaryOnly: true }),
        enabled: !!projectId,
    })

    const memoryQuery = useQuery({
        queryKey: ['project', projectId, 'observability', 'memory'],
        queryFn: () => fetchObservabilityMemory({ projectId, summaryOnly: true }),
        enabled: !!projectId,
    })

    const cpuThrottleQuery = useQuery({
        queryKey: ['project', projectId, 'observability', 'cpuThrottle'],
        queryFn: () => fetchObservabilityCpuThrottle({ projectId, summaryOnly: true }),
        enabled: !!projectId,
    })

    const coldStartQuery = useQuery({
        queryKey: ['project', projectId, 'observability', 'coldStart'],
        queryFn: () => fetchObservabilityColdStart({ projectId, summaryOnly: true }),
        enabled: !!projectId,
    })

    const routesQuery = useQuery({
        queryKey: ['project', projectId, 'observability', 'routes'],
        queryFn: () => fetchObservabilityRouteSummary({ projectId, summaryOnly: true }),
        enabled: !!projectId,
    })

    const ttfb = useMemo(() => {
        const avg = ttfbQuery.data?.avgTtfb
        const p75 = ttfbQuery.data?.p75Ttfb
        const p95 = ttfbQuery.data?.p95Ttfb

        return {
            avg: avg ? `${Math.round(avg)}ms` : '—',
            p75: p75 ? `${Math.round(p75)}ms` : '—',
            p95: p95 ? `${Math.round(p95)}ms` : '—',
        }
    }, [ttfbQuery.data])

    const memory = useMemo(() => {
        const max = memoryQuery.data?.maxMemory
        const provisioned = memoryQuery.data?.provisioned

        return {
            max: max ? `${Math.round(max)}MB` : '—',
            provisioned: provisioned ? `${Math.round(provisioned)}MB` : '—',
        }
    }, [memoryQuery.data])

    const cpuThrottle = useMemo(() => {
        const average = cpuThrottleQuery.data?.cpuThrottleMsAvg
        const p75 = cpuThrottleQuery.data?.cpuThrottleMsP75
        const p95 = cpuThrottleQuery.data?.cpuThrottleMsP95

        return {
            average: average ? `${Math.round(average)}ms` : '—',
            p75: p75 ? `${Math.round(p75)}ms` : '—',
            p95: p95 ? `${Math.round(p95)}ms` : '—',
        }
    }, [cpuThrottleQuery.data])

    const coldStart = useMemo(() => {
        const value = coldStartQuery.data?.find((item) => item.functionStartType === 'cold')?.value
        return value ? `${Math.round(value)}%` : '—'
    }, [coldStartQuery.data])

    const hotStart = useMemo(() => {
        const cold = coldStartQuery.data?.find((item) => item.functionStartType === 'cold')?.value
        return cold ? `${Math.round(100 - cold)}%` : '—'
    }, [coldStartQuery.data])

    if (
        ttfbQuery.isLoading ||
        memoryQuery.isLoading ||
        cpuThrottleQuery.isLoading ||
        coldStartQuery.isLoading ||
        routesQuery.isLoading
    ) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
            </View>
        )
    }

    if (
        ttfbQuery.error ||
        memoryQuery.error ||
        cpuThrottleQuery.error ||
        coldStartQuery.error ||
        routesQuery.error
    ) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: COLORS.gray1000,
                        fontFamily: 'Geist',
                    }}
                >
                    Error fetching observability data
                </Text>
            </View>
        )
    }

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
                gap: 12,
                flexDirection: 'column',
                paddingHorizontal: 16,
                paddingBottom: 64, // mostly needed for android
            }}
            refreshControl={
                <RefreshControl
                    // refreshing={false} // this is handled above before returning
                    onRefresh={async () => {
                        await Promise.all([
                            ttfbQuery.refetch(),
                            memoryQuery.refetch(),
                            cpuThrottleQuery.refetch(),
                            coldStartQuery.refetch(),
                            routesQuery.refetch(),
                        ])
                    }}
                />
            }
        >
            {/* TTFB */}
            <View
                style={{
                    flexDirection: 'column',
                    padding: 12,
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    gap: 20,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    Time To First Byte
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {ttfb.avg}
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            Average
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {ttfb.p75}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            P75
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {ttfb.p95}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            P95
                        </Text>
                    </View>
                </View>
            </View>

            {/* Memory */}
            <View
                style={{
                    flexDirection: 'column',
                    padding: 12,
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    gap: 20,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    Memory
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {memory.max}
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            Average
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {memory.provisioned}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            Provisioned
                        </Text>
                    </View>
                </View>
            </View>

            {/* CPU Throttle */}
            <View
                style={{
                    flexDirection: 'column',
                    padding: 12,
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    gap: 20,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    CPU Throttle
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {cpuThrottle.average}
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            Average
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {cpuThrottle.p75}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            P75
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {cpuThrottle.p95}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            P95
                        </Text>
                    </View>
                </View>
            </View>

            {/* Cold Start */}
            <View
                style={{
                    flexDirection: 'column',
                    padding: 12,
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    gap: 20,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    Cold Starts
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {coldStart}
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            Cold
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.gray200,
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '900',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            {hotStart}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                textAlign: 'center',
                                fontFamily: 'Geist',
                            }}
                        >
                            Hot
                        </Text>
                    </View>
                </View>
            </View>

            {/* Routes */}
            <View
                style={{
                    flexDirection: 'column',
                    padding: 12,
                    backgroundColor: COLORS.gray200,
                    borderRadius: 10,
                    gap: 12,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    Routes
                </Text>

                {routesQuery.data?.map((route) => (
                    <View
                        key={route.route}
                        style={{
                            backgroundColor: COLORS.gray300,
                            padding: 12,
                            borderRadius: 8,
                            gap: 8,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: COLORS.gray1000,
                                fontFamily: 'Geist',
                            }}
                        >
                            {route.route}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '900',
                                        color: COLORS.gray1000,
                                        textAlign: 'center',
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    {route.p75DurationMS ? `${route.p75DurationMS}ms` : 'No data'}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: COLORS.gray1000,
                                        textAlign: 'center',
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    P75 Duration
                                </Text>
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '900',
                                        color: COLORS.gray1000,
                                        textAlign: 'center',
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    {route.invocations ?? 'No data'}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: COLORS.gray1000,
                                        textAlign: 'center',
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    Invocations
                                </Text>
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '900',
                                        color: COLORS.gray1000,
                                        textAlign: 'center',
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    {route.errors ?? 'No data'}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: COLORS.gray1000,
                                        textAlign: 'center',
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    Errors
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                {(!routesQuery.data || routesQuery.data.length === 0) && (
                    <Text
                        style={{
                            fontSize: 16,
                            color: COLORS.gray1000,
                            textAlign: 'center',
                            padding: 20,
                            fontFamily: 'Geist',
                        }}
                    >
                        No routes data available
                    </Text>
                )}
            </View>
        </ScrollView>
    )
}
