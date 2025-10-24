import WidgetKitModule from '@/modules/widgetkit'
import { COLORS } from '@/theme/colors'
import * as Sentry from '@sentry/react-native'
import { usePlacement, useUser } from 'expo-superwall'
import { Alert, Text, TouchableOpacity } from 'react-native'

export default function ProjectWidgetMessage() {
    const { registerPlacement } = usePlacement()
    const { subscriptionStatus } = useUser()

    if (subscriptionStatus.status !== 'INACTIVE') {
        return null
    }

    return (
        <TouchableOpacity
            style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: COLORS.successDark,
            }}
            onPress={() => {
                registerPlacement({
                    placement: 'TapWidget',
                    feature: () => {
                        WidgetKitModule.setIsSubscribed(true)
                        Alert.alert(
                            'Congrats!',
                            'You can now go to your homescreen and search for "Rev" widgets'
                        )
                    },
                }).catch((error) => {
                    Sentry.captureException(error)
                    console.error('Error registering TapWidget', error)
                    Alert.alert('Error', 'Something went wrong, please try again.')
                })
            }}
        >
            <Text
                style={{
                    color: COLORS.alphaGray1000,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'Geist',
                }}
            >
                Add this project as a widget on your homescreen!
            </Text>
        </TouchableOpacity>
    )
}
