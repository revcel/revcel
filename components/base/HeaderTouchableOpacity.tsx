import { HeaderButton, type HeaderButtonProps } from '@react-navigation/elements'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { useMemo } from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import {
    TouchableOpacity as RNGHTouchableOpacity,
    type TouchableOpacityProps,
} from 'react-native-gesture-handler'

export function HeaderTouchableOpacity(props: TouchableOpacityProps | HeaderButtonProps) {
    const isAndroid = useMemo(() => Platform.OS === 'android', [])

    if (isLiquidGlassAvailable()) {
        return <HeaderButton {...(props as HeaderButtonProps)} />
    }

    return isAndroid ? <RNGHTouchableOpacity {...props} /> : <TouchableOpacity {...props} />
}
