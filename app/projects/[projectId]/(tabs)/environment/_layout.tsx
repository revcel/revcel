import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function EnvironmentLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitle: true,
                headerTransparent: Platform.OS === 'ios',
                headerShadowVisible: true,
                headerBlurEffect: 'regular',
                headerLargeTitleStyle: {
                    color: COLORS.gray1000,
                    fontFamily: 'Geist',
                },
                headerTitleStyle: {
                    fontFamily: 'Geist',
                },
                headerTintColor: COLORS.gray1000,
                headerStyle: {
                    backgroundColor: COLORS.background,
                },
                contentStyle: {
                    backgroundColor: COLORS.background,
                },
                title: 'Environment',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShadowVisible: false,
                }}
            />
            <Stack.Screen
                name="add"
                options={{
                    title: 'New Variable',
                    headerLargeTitle: false,
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="[variableId]"
                options={{
                    title: 'Edit Variable',
                    headerLargeTitle: false,
                    presentation: 'modal',
                }}
            />
        </Stack>
    )
}
