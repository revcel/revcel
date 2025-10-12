import { fetchProjectLogs } from '@/api/queries'
import EmptyListComponent from '@/components/EmptyListComponent'
import { HeaderTouchableOpacity } from '@/components/HeaderTouchableOpacity'
import { COLOR_FOR_REQUEST_STATUS } from '@/lib/constants'
import { queryClient } from '@/lib/query'
import WidgetKitModule from '@/modules/widgetkit'
import { useStore } from '@/store/default'
import { COLORS } from '@/theme/colors'
import type { Log } from '@/types/logs'
import { Ionicons } from '@expo/vector-icons'
import * as Sentry from '@sentry/react-native'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import * as Haptics from 'expo-haptics'
import { router, useGlobalSearchParams, useNavigation } from 'expo-router'
import { usePlacement } from 'expo-superwall'
import ms from 'ms'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Alert, RefreshControl, Text, TouchableOpacity, View } from 'react-native'

export default function Logs() {
    const { registerPlacement } = usePlacement()
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()
    const navigation = useNavigation()

    const selectedAttributes = useStore((state) => state.logsSelectedAttributes)

    const reguestLogsQuery = useQuery({
        queryKey: ['project', projectId, 'requestLogs'],
        queryFn: () =>
            fetchProjectLogs({
                projectId,
                startDate: '1',
                //! hobby plan allows for maximum 1 hr
                // setting startDate to 1 will fetch as much as possible
                // startDate: new Date(Date.now() - ms('1h') - ms('2m')).getTime().toString(),
                // endDate: Date.now().toString(),
                attributes: selectedAttributes,
            }),
        staleTime: ms('1m'),
        gcTime: ms('1m'),
        enabled: !!projectId,
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        reguestLogsQuery.refetch()
    }, [selectedAttributes])

    useLayoutEffect(() => {
        navigation.setOptions({
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
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                        router.push({
                            pathname: '/logs/filters',
                            params: {
                                projectId,
                            },
                        })
                    }}
                >
                    <Ionicons name="filter-outline" size={18} color={COLORS.gray1000} />
                </HeaderTouchableOpacity>
            ),
        })
    }, [navigation, projectId])

    const emptyListComponent = useMemo(() => {
        const emptyProject = EmptyListComponent({
            isLoading: reguestLogsQuery.isLoading,
            hasValue: !!reguestLogsQuery.data?.rows.length,
            emptyLabel: 'No logs found',
            error: reguestLogsQuery.error,
            errorLabel: 'Failed to fetch logs',
        })

        return emptyProject
    }, [reguestLogsQuery.isLoading, reguestLogsQuery.data?.rows.length, reguestLogsQuery.error])

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    tintColor={COLORS.successLight}
                    refreshing={reguestLogsQuery.isRefetching}
                    onRefresh={async () => {
                        await reguestLogsQuery.refetch()
                        await queryClient.refetchQueries({
                            queryKey: ['project', projectId, 'requestLogsFilters'],
                        })
                    }}
                    // android
                    progressBackgroundColor={COLORS.backgroundSecondary}
                    colors={[COLORS.successLight]}
                />
            }
            overrideProps={
                emptyListComponent && {
                    contentContainerStyle: {
                        flex: 1,
                    },
                }
            }
            ListEmptyComponent={emptyListComponent}
            data={reguestLogsQuery.data?.rows}
            renderItem={({ item: log, index: logIndex }) => (
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        const featureFn = () => {
                            router.push({
                                pathname: '/logs/details',
                                params: {
                                    logId: log.requestId,
                                    projectId,
                                },
                            })
                            WidgetKitModule.setIsSubscribed(true)
                        }

                        if (__DEV__) {
                            featureFn()
                            return
                        }

                        registerPlacement({
                            placement: 'ExpandLog',
                            feature: featureFn,
                        }).catch((error) => {
                            Sentry.captureException(error)
                            console.error('Error registering ExpandLog', error)
                            Alert.alert('Error', 'Something went wrong, please try again.')
                        })
                    }}
                >
                    <LogListRow
                        log={log}
                        backgroundColor={logIndex % 2 === 0 ? COLORS.gray200 : undefined}
                    />
                </TouchableOpacity>
            )}
        />
    )
}

function LogListRow({ log, backgroundColor }: { log: Log; backgroundColor?: string }) {
    return (
        <View
            style={{
                padding: 16,
                backgroundColor,
            }}
        >
            <View style={{ flexDirection: 'column', gap: 10 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '100%',
                        gap: 10,
                    }}
                >
                    {/* Timestamp */}
                    <View style={{ width: '16%' }}>
                        <Text
                            style={{
                                fontSize: 12,
                                color: COLORS.gray1000,
                            }}
                        >
                            {format(log.timestamp, 'HH:mm:ss')}
                        </Text>
                    </View>

                    {/* Method and Status */}
                    <View
                        style={{ width: '20%', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                        <Text
                            style={{
                                fontSize: 12,
                                fontWeight: '500',
                                textAlign: 'center',
                                color: COLORS.gray900,
                            }}
                        >
                            {log.requestMethod}
                        </Text>
                        <Text
                            style={{
                                width: '38%',
                                fontSize: 12,
                                color: COLOR_FOR_REQUEST_STATUS(log.statusCode),
                            }}
                        >
                            {log.statusCode}
                        </Text>
                    </View>

                    {/* Domain */}
                    <Text
                        style={{
                            width: '28%',
                            fontSize: 12,
                            color: COLORS.gray1000,
                            // paddingHorizontal: 4,
                        }}
                        numberOfLines={1}
                    >
                        {log.domain}
                    </Text>

                    <Text
                        style={{ flex: 1, fontSize: 12, color: COLORS.gray1000 }}
                        numberOfLines={1}
                    >
                        {log.requestPath}
                    </Text>
                </View>
            </View>
        </View>
    )
}
