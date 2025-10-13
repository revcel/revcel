import { COLORS } from '@/theme/colors'
import { useMemo } from 'react'
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native'

export default function Text(props: RNTextProps & { full?: boolean }) {
    const mergedStyle = useMemo(() => {
        return StyleSheet.flatten([
            {
                fontSize: 16,
                color: COLORS.gray1000,
                fontFamily: 'Geist',
            },
            props.style,
        ])
    }, [props.style])

    return (
        <RNText
            numberOfLines={props.full ? undefined : props.numberOfLines || 1}
            ellipsizeMode="tail"
            {...props}
            allowFontScaling={false}
            style={mergedStyle}
        />
    )
}
