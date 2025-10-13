import { fetchApiStatus } from '@/api/queries'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native'

export default function ApiStatus() {
    const apiStatusQuery = useQuery({
        queryKey: ['apiStatus'],
        queryFn: fetchApiStatus,
    })

    const isOperational = useMemo(() => apiStatusQuery?.data?.length === 0, [apiStatusQuery.data])

    if (!apiStatusQuery.data) {
        return null
    }

    return (
        <TouchableOpacity
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

                Alert.alert(
                    'White Flash Warning',
                    'The status page sometimes shows a strong white background. You may want to turn your brightness down.',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'OK',
                            onPress: () => {
                                try {
                                    Linking.openURL('https://www.vercel-status.com')
                                } catch {
                                    Alert.alert(
                                        'Error',
                                        'Could not open status page, please try again.'
                                    )
                                }
                            },
                        },
                    ]
                )
            }}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
            }}
        >
            <View
                style={{
                    width: 10,
                    height: 10,
                    backgroundColor: isOperational ? COLORS.successDark : COLORS.error,
                    borderRadius: 5,
                }}
            />
            <Text
                style={{
                    color: isOperational ? COLORS.successDark : COLORS.gray1000,
                    fontFamily: 'Geist',
                }}
            >
                {isOperational ? 'All systems normal' : apiStatusQuery?.data?.[0]?.name}
            </Text>
        </TouchableOpacity>
    )
}
