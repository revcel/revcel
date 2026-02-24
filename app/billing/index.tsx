import { fetchAllTeams, fetchTeamBillingCharges } from '@/api/queries'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import type { TeamBillingCharge } from '@/types/billing'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const BILLING_RANGES = {
    '7d': 7,
    '30d': 30,
} as const

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const CURRENCY_FORMATTER_PRECISE = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
})

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
})

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
})

type BillingRange = keyof typeof BILLING_RANGES

type BillingListItem =
    | {
          type: 'section'
          key: string
          serviceName: string
          billedTotal: number
          effectiveTotal: number
          dayCount: number
      }
    | {
          type: 'row'
          key: string
          serviceName: string
          day: string
          billedTotal: number
          effectiveTotal: number
          consumedQuantity: number
          consumedUnit: string
          chargeCount: number
      }

function getRangeWindow(range: BillingRange) {
    const now = new Date()
    const days = BILLING_RANGES[range]
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return {
        from: from.toISOString(),
        to: now.toISOString(),
    }
}

function formatCurrency(value: number) {
    if (value !== 0 && Math.abs(value) < 0.01) {
        return CURRENCY_FORMATTER_PRECISE.format(value)
    }
    return CURRENCY_FORMATTER.format(value)
}

function formatQuantity(value: number) {
    if (Math.abs(value) >= 1000) {
        return COMPACT_NUMBER_FORMATTER.format(value)
    }
    return NUMBER_FORMATTER.format(value)
}

function buildGroupedBillingRows(charges: TeamBillingCharge[]) {
    const nonZeroCharges = charges.filter(
        (charge) => charge.BilledCost !== 0 || charge.EffectiveCost !== 0
    )

    const services = new Map<
        string,
        {
            serviceName: string
            billedTotal: number
            effectiveTotal: number
            days: Map<
                string,
                {
                    day: string
                    billedTotal: number
                    effectiveTotal: number
                    consumedQuantity: number
                    consumedUnit: string
                    chargeCount: number
                }
            >
        }
    >()

    for (const charge of nonZeroCharges) {
        let service = services.get(charge.ServiceName)

        if (!service) {
            service = {
                serviceName: charge.ServiceName,
                billedTotal: 0,
                effectiveTotal: 0,
                days: new Map(),
            }
            services.set(charge.ServiceName, service)
        }

        service.billedTotal += charge.BilledCost
        service.effectiveTotal += charge.EffectiveCost

        const day = charge.ChargePeriodStart.slice(0, 10)
        let dayRow = service.days.get(day)

        if (!dayRow) {
            dayRow = {
                day,
                billedTotal: 0,
                effectiveTotal: 0,
                consumedQuantity: 0,
                consumedUnit: '',
                chargeCount: 0,
            }
            service.days.set(day, dayRow)
        }

        dayRow.billedTotal += charge.BilledCost
        dayRow.effectiveTotal += charge.EffectiveCost
        dayRow.consumedQuantity += charge.ConsumedQuantity
        dayRow.chargeCount += 1

        if (!dayRow.consumedUnit) {
            dayRow.consumedUnit = charge.ConsumedUnit
        } else if (dayRow.consumedUnit !== charge.ConsumedUnit) {
            dayRow.consumedUnit = 'mixed'
        }
    }

    const sortedServices = Array.from(services.values())
        .map((service) => ({
            ...service,
            days: Array.from(service.days.values()).sort((a, b) => b.day.localeCompare(a.day)),
        }))
        .sort((a, b) => b.effectiveTotal - a.effectiveTotal)

    const items: BillingListItem[] = []
    let rowCount = 0

    for (const service of sortedServices) {
        items.push({
            type: 'section',
            key: `section-${service.serviceName}`,
            serviceName: service.serviceName,
            billedTotal: service.billedTotal,
            effectiveTotal: service.effectiveTotal,
            dayCount: service.days.length,
        })

        for (const day of service.days) {
            rowCount += 1
            items.push({
                type: 'row',
                key: `row-${service.serviceName}-${day.day}`,
                serviceName: service.serviceName,
                day: day.day,
                billedTotal: day.billedTotal,
                effectiveTotal: day.effectiveTotal,
                consumedQuantity: day.consumedQuantity,
                consumedUnit: day.consumedUnit,
                chargeCount: day.chargeCount,
            })
        }
    }

    return {
        items,
        serviceCount: sortedServices.length,
        rowCount,
        totalBilled: sortedServices.reduce((sum, service) => sum + service.billedTotal, 0),
        totalEffective: sortedServices.reduce((sum, service) => sum + service.effectiveTotal, 0),
    }
}

export default function BillingScreen() {
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = currentConnection?.currentTeamId
    const [range, setRange] = useState<BillingRange>('7d')

    const teamsQuery = useQuery({
        queryKey: ['teams', currentConnection?.id],
        queryFn: () => fetchAllTeams({ connectionId: currentConnection?.id }),
        enabled: !!currentConnection?.id,
    })

    const currentTeam = useMemo(() => {
        if (!currentTeamId || !teamsQuery.data?.teams) {
            return null
        }
        return teamsQuery.data.teams.find((team) => team.id === currentTeamId) || null
    }, [teamsQuery.data?.teams, currentTeamId])

    const currentTeamPlan = currentTeam?.billing?.plan?.toLowerCase()
    const isHobbyTeam = currentTeamPlan === 'hobby'
    const isPaidTeam = currentTeamPlan === 'pro' || currentTeamPlan === 'enterprise'

    const billingQuery = useQuery({
        queryKey: ['team', currentTeamId, 'billing', range],
        queryFn: () => {
            const { from, to } = getRangeWindow(range)
            return fetchTeamBillingCharges({ from, to })
        },
        enabled: !!currentTeamId && !!currentTeam && isPaidTeam,
    })

    const grouped = useMemo(() => {
        return buildGroupedBillingRows(billingQuery.data || [])
    }, [billingQuery.data])

    const errorLabel = useMemo(() => {
        if (teamsQuery.error instanceof Error) {
            return `Failed to fetch teams: ${teamsQuery.error.message}`
        }

        if (!(billingQuery.error instanceof Error)) {
            return 'Failed to fetch billing data'
        }

        return `Failed to fetch billing data: ${billingQuery.error.message}`
    }, [teamsQuery.error, billingQuery.error])

    const placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: teamsQuery.isLoading || billingQuery.isLoading,
            isError: teamsQuery.isError || billingQuery.isError,
            hasData: grouped.items.length > 0,
            emptyLabel: currentTeamId
                ? 'No billable activity in this range'
                : 'Current team not found',
            errorLabel,
        })
    }, [
        teamsQuery.isLoading,
        billingQuery.isLoading,
        billingQuery.isError,
        teamsQuery.isError,
        grouped.items.length,
        currentTeamId,
        errorLabel,
    ])

    if (isHobbyTeam) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <Text
                    style={{
                        color: COLORS.gray1000,
                        fontSize: 18,
                        fontFamily: 'Geist',
                        fontWeight: '700',
                        textAlign: 'center',
                    }}
                >
                    Billing details are available for Pro and Enterprise teams.
                </Text>
                <Text
                    style={{
                        color: COLORS.gray900,
                        fontSize: 14,
                        fontFamily: 'Geist',
                        textAlign: 'center',
                        marginTop: 10,
                        lineHeight: 22,
                    }}
                >
                    Switch to a paid team to view billing stats.
                </Text>
            </View>
        )
    }

    const { overrideProps } = useFlashlistProps(placeholder)

    return (
        <FlashList
            data={grouped.items}
            keyExtractor={(item) => item.key}
            overrideProps={overrideProps}
            ListEmptyComponent={placeholder}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
                paddingBottom: 48,
            }}
            refreshControl={
                <RefreshControl
                    refreshing={billingQuery.isRefetching}
                    onRefresh={billingQuery.refetch}
                />
            }
            ListHeaderComponent={
                <View
                    style={{
                        paddingTop: 16,
                        paddingBottom: 20,
                        paddingHorizontal: 16,
                        gap: 12,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: COLORS.gray200,
                            borderRadius: 10,
                            padding: 4,
                            gap: 6,
                        }}
                    >
                        {(Object.keys(BILLING_RANGES) as BillingRange[]).map((option) => (
                            <TouchableOpacity
                                key={option}
                                onPress={() => setRange(option)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    backgroundColor:
                                        option === range ? COLORS.successDark : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: COLORS.gray1000,
                                        fontSize: 14,
                                        fontFamily: 'Geist',
                                        fontWeight: option === range ? '700' : '500',
                                    }}
                                >
                                    {option.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        <SummaryCard label="Billed" value={formatCurrency(grouped.totalBilled)} />
                        <SummaryCard
                            label="Effective"
                            value={formatCurrency(grouped.totalEffective)}
                        />
                        <SummaryCard label="Services" value={grouped.serviceCount.toString()} />
                        {/* <SummaryCard label="Rows" value={grouped.rowCount.toString()} /> */}
                    </View>
                </View>
            }
            renderItem={({ item }) => {
                if (item.type === 'section') {
                    return (
                        <View
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                backgroundColor: COLORS.gray300,
                                borderTopWidth: 1,
                                borderTopColor: COLORS.alphaGray100,
                                gap: 6,
                            }}
                        >
                            <Text
                                style={{
                                    color: COLORS.gray1000,
                                    fontSize: 15,
                                    fontWeight: '700',
                                    fontFamily: 'Geist',
                                }}
                            >
                                {item.serviceName}
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        color: COLORS.gray900,
                                        fontSize: 12,
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    {item.dayCount} day{item.dayCount === 1 ? '' : 's'}
                                </Text>
                                <Text
                                    style={{
                                        color: COLORS.gray1000,
                                        fontSize: 12,
                                        fontFamily: 'Geist',
                                    }}
                                >
                                    {`Billed ${formatCurrency(item.billedTotal)} · Effective ${formatCurrency(item.effectiveTotal)}`}
                                </Text>
                            </View>
                        </View>
                    )
                }

                return (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            backgroundColor: COLORS.gray200,
                            borderTopWidth: 1,
                            borderTopColor: COLORS.alphaGray100,
                            gap: 6,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: COLORS.gray1000,
                                    fontSize: 14,
                                    fontFamily: 'Geist',
                                }}
                            >
                                {format(new Date(`${item.day}T00:00:00.000Z`), 'MMM d')}
                            </Text>
                            <Text
                                style={{
                                    color: COLORS.gray900,
                                    fontSize: 12,
                                    fontFamily: 'Geist',
                                }}
                            >
                                {item.consumedUnit
                                    ? `${formatQuantity(item.consumedQuantity)} ${item.consumedUnit}`
                                    : formatQuantity(item.consumedQuantity)}
                            </Text>
                        </View>
                        <Text
                            style={{
                                color: COLORS.gray1000,
                                fontSize: 12,
                                fontFamily: 'Geist',
                            }}
                        >
                            {`Billed ${formatCurrency(item.billedTotal)} · Effective ${formatCurrency(item.effectiveTotal)}`}
                        </Text>
                    </View>
                )
            }}
        />
    )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <View
            style={{
                width: '32%',
                backgroundColor: COLORS.gray200,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 10,
                gap: 6,
            }}
        >
            <Text
                style={{
                    color: COLORS.gray900,
                    fontSize: 12,
                    fontFamily: 'Geist',
                }}
            >
                {label}
            </Text>
            <Text
                style={{
                    color: COLORS.gray1000,
                    fontSize: 16,
                    fontWeight: '700',
                    fontFamily: 'Geist',
                }}
                numberOfLines={2}
            >
                {value}
            </Text>
        </View>
    )
}
