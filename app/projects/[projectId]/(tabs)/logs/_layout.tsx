import { COLORS } from '@/theme/colors'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function LogsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitle: true,
                headerTransparent: Platform.OS === 'ios',
                headerShadowVisible: true,
                headerBlurEffect: isLiquidGlassAvailable() ? undefined : 'regular',
                headerLargeTitleStyle: {
                    color: COLORS.gray1000,
                    fontFamily: 'Geist',
                },
                headerTitleStyle: {
                    fontFamily: 'Geist',
                },
                headerTintColor: COLORS.gray1000,
                headerStyle: isLiquidGlassAvailable()
                    ? undefined
                    : {
                          backgroundColor: COLORS.background,
                      },
                contentStyle: {
                    backgroundColor: COLORS.background,
                },
                title: 'Logs',
            }}
        >
            <Stack.Screen
                name="index"
                options={
                    {
                        // set in index.tsx when scroll over on iOS
                        // set always on android?
                        // headerLeft: () => <Ionicons name="arrow-back" size={24} color="#fff" />,
                    }
                }
            />
        </Stack>
    )
}
