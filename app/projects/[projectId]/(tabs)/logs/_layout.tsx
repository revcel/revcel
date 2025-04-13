import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function LogsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitle: true,
                headerTransparent: Platform.OS === 'ios',
                headerBlurEffect: 'regular',
                headerLargeTitleStyle: {
                    color: COLORS.gray1000,
                },
                headerTintColor: COLORS.gray1000,
                headerStyle: {
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
