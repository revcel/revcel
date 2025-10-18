import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { View } from 'react-native'

export default function HeaderItem({ children }: { children: React.ReactNode }) {
    if (isLiquidGlassAvailable()) {
        return <View style={{ marginLeft: 7 }}>{children}</View>
    }
    return children
}
