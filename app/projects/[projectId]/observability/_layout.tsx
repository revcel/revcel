import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'

export default function ProjectIndexLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: COLORS.background,
                },
                // title: 'Observability',
            }}
        >
            <Stack.Screen name="index" />
        </Stack>
    )
}
