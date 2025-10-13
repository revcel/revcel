import { purgeCache } from '@/api/mutations'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useGlobalSearchParams } from 'expo-router'
import * as StoreReview from 'expo-store-review'
import { Alert, Text, TouchableOpacity, View } from 'react-native'

export default function ProjectQuickActions() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()

    const purgeCacheMutation = useMutation({
        mutationFn: purgeCache,
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    return (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity
                style={{
                    flex: 1,
                    height: 90,
                    backgroundColor: COLORS.gray200,
                    padding: 12,
                    borderRadius: 10,
                    gap: 10,
                }}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    Alert.alert('Are you sure?', 'This will purge the cache for this project.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Purge',
                            style: 'destructive',
                            onPress: async () => {
                                await purgeCacheMutation.mutateAsync({ projectId })
                            },
                        },
                    ])
                }}
            >
                {purgeCacheMutation.isPending ? (
                    <ActivityIndicator
                        sm={true}
                        color={COLORS.errorLight}
                        style={{ alignSelf: 'flex-start' }}
                    />
                ) : (
                    <Ionicons name="trash-bin" size={20} color={COLORS.errorLight} />
                )}
                <Text
                    style={{
                        flex: 1,
                        fontSize: 12,
                        color: COLORS.errorLighter,
                        fontFamily: 'Geist',
                    }}
                >
                    Purge Cache
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    flex: 1,
                    height: 90,
                    backgroundColor: COLORS.gray200,
                    padding: 12,
                    borderRadius: 10,
                    gap: 10,
                }}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    router.push(`/projects/${projectId}/observability`)
                }}
            >
                <Ionicons name="glasses" size={20} color={COLORS.gray1000} />
                <Text
                    style={{
                        flex: 1,
                        fontSize: 12,
                        color: COLORS.gray1000,
                        fontFamily: 'Geist',
                    }}
                >
                    Observability
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    flex: 1,
                    height: 90,
                    backgroundColor: COLORS.gray200,
                    padding: 12,
                    borderRadius: 10,
                    gap: 10,
                }}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    StoreReview.requestReview()
                }}
            >
                <Ionicons name="ellipsis-horizontal-sharp" size={20} color={COLORS.gray1000} />

                <View style={{ flex: 1, flexDirection: 'column', gap: 2 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            color: COLORS.gray1000,
                            fontFamily: 'Geist',
                        }}
                    >
                        More
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray700, fontFamily: 'Geist' }}>
                        Coming Soon
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    )
}

/*

const ACTIONS = [
	{
		label: 'Purge Cache',
		icon: 'rocket',
		destructive: true,
		onPress: () => {},
	},
	{
		label: 'Observability',
		icon: 'shield-outline',
		onPress: () => {},
	},
	{
		label: 'Logs',
		icon: 'document-text-outline',
		onPress: () => {},
	},
	{
		label: 'All Actions',
		icon: 'ellipsis-horizontal-outline',
		onPress: () => {
			// TrueSheet.present('all-actions')
		},
	},
] as const
 
return (
	<View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
		{ACTIONS.map((action) => {
			const isDestructive = 'destructive' in action && action.destructive
			return (
				<TouchableOpacity
					key={action.label}
					style={{
						width: '23.333%',
						height: 100,
						backgroundColor: COLORS.gray200,
						padding: 12,
						paddingBottom: 16,
						borderRadius: 10,
						gap: 5,
					}}
					onPress={action.onPress}
				>
					<Ionicons
						name={action.icon}
						size={22}
						color={isDestructive ? COLORS.errorLight : COLORS.gray1000}
						style={{ flex: 1 }}
					/>
					<Text
						style={{
							flex: 1,
							fontSize: 12,
							color: isDestructive
								? COLORS.errorLighter
								: COLORS.gray1000,
						}}
					>
						{action.label}
					</Text>
				</TouchableOpacity>
			)
		})}
	</View>
)
	
*/
