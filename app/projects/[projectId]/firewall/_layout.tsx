import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'

export default function ProjectFirewallLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: COLORS.background,
                },
            }}
        >
            <Stack.Screen name="index" />
        </Stack>
    )
}
