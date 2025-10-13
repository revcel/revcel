import { COLORS } from '@/theme/colors'
import {
    ActivityIndicator as RNActivityIndicator,
    type StyleProp,
    type ViewStyle,
} from 'react-native'

export default function ActivityIndicator({
    sm = false,
    monochrome = false,
    color,
    style,
}: {
    sm?: boolean
    monochrome?: boolean
    color?: string
    style?: StyleProp<ViewStyle>
}) {
    return (
        <RNActivityIndicator
            size={sm ? 'small' : 'large'}
            color={color || (monochrome ? COLORS.gray900 : COLORS.success)}
            style={style}
        />
    )
}
