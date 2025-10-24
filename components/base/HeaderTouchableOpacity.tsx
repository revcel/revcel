import { HeaderButton, type HeaderButtonProps } from '@react-navigation/elements'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import { useCallback, useMemo } from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import {
    TouchableOpacity as RNGHTouchableOpacity,
    type TouchableOpacityProps,
} from 'react-native-gesture-handler'

export function HeaderTouchableOpacity({
    onPress,
    ...props
}: TouchableOpacityProps | HeaderButtonProps) {
    const isAndroid = useMemo(() => Platform.OS === 'android', [])

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress?.()
    }, [onPress])

    if (isLiquidGlassAvailable()) {
        return <HeaderButton onPress={handlePress} {...(props as HeaderButtonProps)} />
    }

    return isAndroid ? (
        <RNGHTouchableOpacity onPress={handlePress} {...props} />
    ) : (
        <TouchableOpacity onPress={handlePress} {...props} />
    )
}
