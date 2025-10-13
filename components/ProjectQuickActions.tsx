import { purgeCdnCache, purgeDataCache } from '@/api/mutations'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useGlobalSearchParams } from 'expo-router'
import * as StoreReview from 'expo-store-review'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function ProjectQuickActions({ hasAnalytics }: { hasAnalytics: boolean }) {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()

    const purgeCacheMutation = useMutation({
        mutationFn: purgeDataCache,
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const purgeCdnCacheMutation = useMutation({
        mutationFn: purgeCdnCache,
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    return (
        <ScrollView
            horizontal={true}
            contentContainerStyle={{ gap: 8 }}
            showsHorizontalScrollIndicator={false}
        >
            <QuickAction
                label="More"
                icon="ellipsis-horizontal-sharp"
                subtitle="Coming Soon"
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    StoreReview.requestReview()
                }}
            />

            <QuickAction
                label="Observability"
                icon="glasses"
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    router.push(`/projects/${projectId}/observability`)
                }}
            />

            <QuickAction
                label="Analytics"
                icon="analytics"
                isDisabled={!hasAnalytics}
                subtitle={hasAnalytics ? undefined : 'Not enabled'}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    router.push(`/projects/${projectId}/analytics`)
                }}
            />

            <QuickAction
                label="Purge Data Cache"
                icon="trash-outline"
                isDanger={true}
                isLoading={purgeCacheMutation.isPending}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    Alert.alert(
                        'Are you sure?',
                        'This will purge the data cache for this project.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Purge',
                                style: 'destructive',
                                onPress: () => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                                    Alert.alert(
                                        'Are you sure?',
                                        'This will purge the data cache for this project.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Purge',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    await purgeCacheMutation.mutateAsync({
                                                        projectId,
                                                    })
                                                },
                                            },
                                        ]
                                    )
                                },
                            },
                        ]
                    )
                }}
            />

            <QuickAction
                label="Purge CDN Cache"
                icon="trash-outline"
                isDanger={true}
                isLoading={purgeCdnCacheMutation.isPending}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    Alert.alert(
                        'Are you sure?',
                        'This will purge the CDN cache for this project.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Purge',
                                style: 'destructive',
                                onPress: async () => {
                                    await purgeCdnCacheMutation.mutateAsync({ projectId })
                                },
                            },
                        ]
                    )
                }}
            />
        </ScrollView>
    )
}

function QuickAction({
    label,
    subtitle,
    icon,
    onPress,
    isDanger,
    isLoading,
    isDisabled,
}: {
    label: string
    subtitle?: string
    icon: keyof typeof Ionicons.glyphMap
    onPress: () => void
    isDanger?: boolean
    isLoading?: boolean
    isDisabled?: boolean
}) {
    return (
        <TouchableOpacity
            style={{
                flex: 1,
                height: 90,
                backgroundColor: isDisabled ? COLORS.gray100 : COLORS.gray200,
                padding: 12,
                borderRadius: 10,
                gap: 10,
                width: 120,
            }}
            onPress={onPress}
            disabled={isDisabled}
        >
            {isLoading ? (
                <ActivityIndicator
                    sm={true}
                    color={isDanger ? COLORS.errorLight : COLORS.gray1000}
                    style={{ alignSelf: 'flex-start' }}
                />
            ) : (
                <Ionicons
                    name={icon}
                    size={20}
                    color={isDanger ? COLORS.errorLight : COLORS.gray1000}
                />
            )}
            <View style={{ flex: 1, flexDirection: 'column', gap: 5 }}>
                <Text
                    style={{
                        fontSize: 12,
                        color: isDanger ? COLORS.errorLighter : COLORS.gray1000,
                        fontFamily: 'Geist',
                    }}
                >
                    {label}
                </Text>
                {subtitle && (
                    <Text style={{ fontSize: 12, color: COLORS.gray700, fontFamily: 'Geist' }}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    )
}
