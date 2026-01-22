import Text from '@/components/base/Text'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import {
    getAppIconName,
    setAlternateAppIcon,
    supportsAlternateIcons,
} from 'expo-alternate-app-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native'

const ICONS = [
    {
        id: null,
        label: 'Default',
        image: require('@/assets/icon.png'),
    },
    {
        id: 'PrismDark',
        label: 'Prism (Dark)',
        image: require('@/assets/icon-prism-dark.png'),
    },
    {
        id: 'PrismLight',
        label: 'Prism (Light)',
        image: require('@/assets/icon-prism-light.png'),
    },
    {
        id: 'Dithered',
        label: 'Dithered',
        image: require('@/assets/icon-dithered.png'),
    },
    {
        id: 'Pixelated',
        label: 'Pixelated',
        image: require('@/assets/icon-pixelated.png'),
    },
    {
        id: 'GradientDark',
        label: 'Gradient (Dark)',
        image: require('@/assets/icon-gradient-dark.png'),
    },
    {
        id: 'GradientLight',
        label: 'Gradient (Light)',
        image: require('@/assets/icon-gradient-light.png'),
    },
] as const

export default function IconsScreen() {
    const [currentIcon, setCurrentIcon] = useState<string | null>(null)

    useEffect(() => {
        setCurrentIcon(getAppIconName())
    }, [])

    const handleIconSelect = async (iconName: string | null) => {
        if (!supportsAlternateIcons) {
            Alert.alert('Not Supported', 'Alternate icons are not supported on this device.')
            return
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            await setAlternateAppIcon(iconName)
            setCurrentIcon(iconName)
        } catch {
            Alert.alert('Error', 'Failed to change app icon.')
        }
    }

    return (
        <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
            <View style={{ marginTop: 16 }}>
                {ICONS.map((icon, index) => {
                    const isSelected = currentIcon === icon.id
                    const isFirst = index === 0
                    return (
                        <TouchableOpacity
                            key={icon.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: COLORS.backgroundSecondary,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderTopWidth: isFirst ? 1 : 0,
                                borderBottomWidth: 1,
                                borderColor: COLORS.gray100,
                            }}
                            onPress={() => handleIconSelect(icon.id)}
                        >
                            <Image
                                source={icon.image}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 13,
                                }}
                            />
                            <Text
                                style={{
                                    flex: 1,
                                    marginLeft: 16,
                                    fontSize: 17,
                                    color: COLORS.white,
                                }}
                            >
                                {icon.label}
                            </Text>
                            {isSelected && (
                                <Ionicons name="checkmark" size={24} color={COLORS.success} />
                            )}
                        </TouchableOpacity>
                    )
                })}
            </View>
        </ScrollView>
    )
}
