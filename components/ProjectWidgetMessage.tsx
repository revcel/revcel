import WidgetKitModule from '@/modules/widgetkit'
import { COLORS } from '@/theme/colors'
import Superwall from '@superwall/react-native-superwall'
import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'

export default function ProjectWidgetMessage() {
    const [isSubscribed, setIsSubscribed] = useState(true)

    useEffect(() => {
        Superwall.shared.getSubscriptionStatus().then(({ status }) => {
            setIsSubscribed(status === 'ACTIVE')
        })
    }, [])

    if (isSubscribed) {
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
                Superwall.shared
                    .register({
                        placement: 'TapWidget',
                        feature: () => {
                            Alert.alert(
                                'Congrats, you can now go to your homescreen and search for "Rev" widgets'
                            )
                            WidgetKitModule.setIsSubscribed(true)
                        },
                    })
                    .catch((error) => {
                        console.error('Error registering TapWidget', error)
                        Alert.alert('Error', 'Something went wrong, please try again.')
                    })
            }}
        >
            <Text style={{ color: COLORS.alphaGray1000, fontSize: 14, fontWeight: '500' }}>
                Add this project as a widget on your homescreen!
            </Text>
        </TouchableOpacity>
    )
}
