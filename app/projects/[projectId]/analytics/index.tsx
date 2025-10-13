import {
    fetchProjectAnalyticsAvailability,
    fetchProjectAnalyticsOverviewLast24h,
    fetchProjectAnalyticsTimeseriesLast7d,
} from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import RefreshControl from '@/components/base/RefreshControl'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import { useGlobalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'

export default function ProjectAnalyticsScreen() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()

    const availabilityQuery = useQuery({
        queryKey: ['project', projectId, 'analytics', 'availability'],
        queryFn: () => fetchProjectAnalyticsAvailability({ projectId }),
        enabled: !!projectId,
    })

    const overview24hQuery = useQuery({
        queryKey: ['project', projectId, 'analytics', 'overview24h'],
        queryFn: () => fetchProjectAnalyticsOverviewLast24h({ projectId }),
        enabled: !!projectId,
    })

    const timeseries7dQuery = useQuery({
        queryKey: ['project', projectId, 'analytics', 'timeseries7d'],
        queryFn: () => fetchProjectAnalyticsTimeseriesLast7d({ projectId }),
        enabled: !!projectId,
    })

    const last24h = useMemo(() => {
        const total = overview24hQuery.data?.total
        const devices = overview24hQuery.data?.devices
        const bounceRate = overview24hQuery.data?.bounceRate

        return {
            visitors: devices ?? null,
            pageviews: total ?? null,
            bounceRate: typeof bounceRate === 'number' ? `${Math.round(bounceRate)}%` : '—',
        }
    }, [overview24hQuery.data])

    const last7d = useMemo(() => {
        const buckets = timeseries7dQuery.data?.data || []
        const totalPageviews = buckets.reduce((sum, b) => sum + (b.total || 0), 0)
        const totalDevices = buckets.reduce((sum, b) => sum + (b.devices || 0), 0)
        const weightedBounceNumerator = buckets.reduce(
            (sum, b) => sum + (b.bounceRate || 0) * (b.total || 0),
            0
        )
        const weightedBounce =
            totalPageviews > 0 ? Math.round(weightedBounceNumerator / totalPageviews) : null

        return {
            visitors: totalDevices || null,
            pageviews: totalPageviews || null,
            bounceRate: weightedBounce !== null ? `${weightedBounce}%` : '—',
        }
    }, [timeseries7dQuery.data])

    if (availabilityQuery.isLoading || overview24hQuery.isLoading || timeseries7dQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
            </View>
        )
    }

    if (availabilityQuery.error || overview24hQuery.error || timeseries7dQuery.error) {
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
                    Error fetching analytics data
                </Text>
            </View>
        )
    }

    if (
        availabilityQuery.data &&
        (!availabilityQuery.data.isEnabled || !availabilityQuery.data.hasData)
    ) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: COLORS.gray1000,
                        textAlign: 'center',
                        fontFamily: 'Geist',
                    }}
                >
                    No analytics data available
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
                            availabilityQuery.refetch(),
                            overview24hQuery.refetch(),
                            timeseries7dQuery.refetch(),
                        ])
                    }}
                />
            }
        >
            {/* Last 24 hours */}
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
                    Last 24 hours
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
                            {last24h.visitors ?? '—'}
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
                            Visitors
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
                            {last24h.pageviews ?? '—'}
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
                            Pageviews
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
                            {last24h.bounceRate}
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
                            Bounce rate
                        </Text>
                    </View>
                </View>
            </View>

            {/* Last 7 days */}
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
                    Last 7 days
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
                            {last7d.visitors ?? '—'}
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
                            Visitors
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
                            {last7d.pageviews ?? '—'}
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
                            Pageviews
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
                            {last7d.bounceRate}
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
                            Bounce rate
                        </Text>
                    </View>
                </View>
            </View>
            {/* Additional analytics can go here in the future */}
        </ScrollView>
    )
}
