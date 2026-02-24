import { fetchTeamProjectFlags } from '@/api/queries'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import type { FlagState } from '@/types/flags'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, useGlobalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export default function FlagsScreen() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()
    const navigation = useNavigation()
    const [selectedState, setSelectedState] = useState<FlagState>('active')

    const flagsQuery = useQuery({
        queryKey: ['project', projectId, 'flags', selectedState],
        queryFn: () => fetchTeamProjectFlags({ projectId, state: selectedState }),
        enabled: !!projectId,
    })

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <HeaderTouchableOpacity
                    onPress={() => {
                        router.push(`/projects/${projectId}/flags/add`)
                    }}
                >
                    <Ionicons
                        name={isLiquidGlassAvailable() ? 'add-sharp' : 'add-circle-sharp'}
                        size={36}
                        color={isLiquidGlassAvailable() ? COLORS.gray1000 : COLORS.success}
                    />
                </HeaderTouchableOpacity>
            ),
        })
    }, [navigation, projectId])

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: flagsQuery.isLoading,
            hasData: !!flagsQuery.data?.data.length,
            emptyLabel: selectedState === 'active' ? 'No active flags found' : 'No archived flags found',
            isError: flagsQuery.isError,
            errorLabel: 'Failed to fetch flags',
        })
    }, [flagsQuery.isLoading, flagsQuery.data?.data.length, flagsQuery.isError, selectedState])
    const { overrideProps } = useFlashlistProps(Placeholder)

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={<RefreshControl onRefresh={flagsQuery.refetch} />}
            showsVerticalScrollIndicator={false}
            data={flagsQuery.data?.data}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={Placeholder}
            overrideProps={overrideProps}
            ListHeaderComponent={
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingBottom: 12,
                        flexDirection: 'row',
                        gap: 8,
                    }}
                >
                    <FilterChip
                        label="Active"
                        selected={selectedState === 'active'}
                        onPress={() => setSelectedState('active')}
                    />
                    <FilterChip
                        label="Archived"
                        selected={selectedState === 'archived'}
                        onPress={() => setSelectedState('archived')}
                    />
                </View>
            }
            renderItem={({ item: flag, index }) => (
                <TouchableOpacity
                    onPress={() => {
                        router.push(`/projects/${projectId}/flags/${flag.id}`)
                    }}
                    style={{
                        padding: 16,
                        backgroundColor: index % 2 === 0 ? COLORS.gray200 : undefined,
                        gap: 12,
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        <Text
                            style={{
                                color: COLORS.gray1000,
                                fontSize: 16,
                                fontWeight: '600',
                                fontFamily: 'Geist',
                                flex: 1,
                            }}
                            numberOfLines={1}
                        >
                            {flag.slug}
                        </Text>
                        <Text
                            style={{
                                color: COLORS.gray900,
                                fontSize: 13,
                                textTransform: 'capitalize',
                                fontFamily: 'Geist',
                            }}
                        >
                            {flag.kind}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <StatePill state={flag.state} />
                        <Text style={{ color: COLORS.gray900, fontSize: 13, fontFamily: 'Geist' }}>
                            {flag.variants.length} {flag.variants.length === 1 ? 'option' : 'options'}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    )
}

function FilterChip({
    label,
    selected,
    onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: selected ? COLORS.gray300 : COLORS.backgroundSecondary,
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 14,
            }}
            onPress={onPress}
        >
            <Text
                style={{
                    color: selected ? COLORS.gray1000 : COLORS.gray900,
                    fontSize: 13,
                    fontFamily: 'Geist',
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    )
}

function StatePill({ state }: { state: FlagState }) {
    const colors =
        state === 'active'
            ? {
                  background: COLORS.green100,
                  text: COLORS.green1000,
              }
            : {
                  background: COLORS.gray300,
                  text: COLORS.gray900,
              }

    return (
        <View
            style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
            }}
        >
            <Text
                style={{
                    color: colors.text,
                    fontSize: 12,
                    textTransform: 'capitalize',
                    fontFamily: 'Geist',
                }}
            >
                {state}
            </Text>
        </View>
    )
}
