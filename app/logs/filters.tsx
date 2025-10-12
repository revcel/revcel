import { fetchProjectLogsFilters } from '@/api/queries'
import { useStore } from '@/store/default'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import Checkbox from 'expo-checkbox'
import { useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

const LOG_FILTERS = {
    level: 'Level',
    environment: 'Environment',
    route: 'Route',
    requestPath: 'Request Path',
    statusCode: 'Status Code',
    source: 'Resource',
    requestTags: 'Request Type',
    domain: 'Host',
    requestMethod: 'Request Method',
    cache: 'Cache',
    branch: 'Branch',
    deploymentDomain: 'Deployment',
} as const

export default function LogFiltersScreen() {
    const params = useLocalSearchParams()
    const projectId = params.projectId as string

    const selectedAttributes = useStore((state) => state.logsSelectedAttributes)
    const setSelectedAttributes = useStore((state) => state.setLogsSelectedAttributes)

    const availableFiltersQuery = useQuery({
        queryKey: ['project', projectId, 'requestLogsFilters'],
        queryFn: () =>
            fetchProjectLogsFilters({
                projectId,
                attributes: Object.keys(LOG_FILTERS),
                startDate: '1',
                endDate: Date.now().toString(),
            }),
        enabled: !!projectId,
    })

    if (availableFiltersQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.success} />
            </View>
        )
    }

    if (Object.keys(availableFiltersQuery.data ?? {}).length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>No filters found</Text>
            </View>
        )
    }

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
                padding: 16,
                paddingBottom: 64,
            }}
        >
            <View style={{ flexDirection: 'column', gap: 20 }}>
                {Object.entries(availableFiltersQuery.data ?? {}).map(
                    ([attribute, filterValues]) => {
                        return (
                            <View
                                key={attribute}
                                style={{
                                    flexDirection: 'column',
                                    padding: 12,
                                    backgroundColor: COLORS.gray200,
                                    borderRadius: 10,
                                    gap: 8,
                                }}
                            >
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontWeight: '600',
                                            color: COLORS.gray1000,
                                        }}
                                    >
                                        {LOG_FILTERS[attribute as keyof typeof LOG_FILTERS]}
                                    </Text>
                                </View>

                                {filterValues.length === 0 && (
                                    <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>
                                        No filters found
                                    </Text>
                                )}

                                <View style={{ flexDirection: 'column', gap: 5 }}>
                                    {filterValues.map((filterValue) => {
                                        const isSelected = selectedAttributes?.[
                                            attribute
                                        ]?.includes(filterValue.attributeValue)

                                        return (
                                            <View
                                                key={filterValue.attributeValue}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                }}
                                            >
                                                <Checkbox
                                                    value={isSelected}
                                                    onValueChange={() => {
                                                        const newSelectedAttributes = {
                                                            ...selectedAttributes,
                                                            [attribute]: isSelected
                                                                ? selectedAttributes?.[
                                                                      attribute
                                                                  ]?.filter(
                                                                      (value) =>
                                                                          value !==
                                                                          filterValue.attributeValue
                                                                  )
                                                                : [
                                                                      ...(selectedAttributes?.[
                                                                          attribute
                                                                      ] || []),
                                                                      filterValue.attributeValue,
                                                                  ],
                                                        }

                                                        setSelectedAttributes(newSelectedAttributes)
                                                    }}
                                                    color={
                                                        isSelected ? COLORS.success : COLORS.gray800
                                                    }
                                                />
                                                <Text
                                                    style={{
                                                        flex: 1,
                                                        fontSize: 16,
                                                        color: COLORS.gray1000,
                                                    }}
                                                >
                                                    {filterValue.attributeValue}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        color: isSelected
                                                            ? COLORS.gray1000
                                                            : COLORS.gray900,
                                                    }}
                                                >
                                                    {filterValue.total}
                                                </Text>
                                            </View>
                                        )
                                    })}
                                </View>
                            </View>
                        )
                    }
                )}
            </View>
        </ScrollView>
    )
}
