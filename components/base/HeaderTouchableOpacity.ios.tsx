import { HeaderButton, type HeaderButtonProps } from '@react-navigation/elements'
import * as Haptics from 'expo-haptics'
import { useCallback } from 'react'
import { StyleSheet } from 'react-native'

export function HeaderTouchableOpacity({
    resetStyle = false,
    onPress,
    ...props
}: HeaderButtonProps & { resetStyle?: boolean }) {
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress?.()
    }, [onPress])

    return (
        <HeaderButton
            onPress={handlePress}
            {...props}
            style={StyleSheet.flatten([
                resetStyle
                    ? undefined
                    : {
                          height: 36,
                          width: 36,
                          paddingHorizontal: 0,
                          paddingVertical: 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                      },
                props.style,
            ])}
        />
    )
}
