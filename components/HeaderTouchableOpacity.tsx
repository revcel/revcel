import { useMemo } from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import {
    TouchableOpacity as RNGHTouchableOpacity,
    type TouchableOpacityProps,
} from 'react-native-gesture-handler'

export function HeaderTouchableOpacity(props: TouchableOpacityProps) {
    const isAndroid = useMemo(() => Platform.OS === 'android', [])

    return isAndroid ? <RNGHTouchableOpacity {...props} /> : <TouchableOpacity {...props} />
}
