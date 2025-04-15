
import { Platform, TouchableOpacity } from "react-native"
import { TouchableOpacity as RNGHTouchableOpacity, TouchableOpacityProps  } from 'react-native-gesture-handler'

export function HeaderTouchableOpacity(props: TouchableOpacityProps) {
    const isAndroid = Platform.OS === 'android'

    return isAndroid ? (
        <RNGHTouchableOpacity 
            {...props}
        />
    ) : (
        <TouchableOpacity
            {...props}
        />
    )
}