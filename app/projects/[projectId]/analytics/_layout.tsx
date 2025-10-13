import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'

export default function ProjectAnalyticsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: COLORS.background,
                },
                // title: 'Analytics',
            }}
        >
            <Stack.Screen name="index" />
        </Stack>
    )
}
