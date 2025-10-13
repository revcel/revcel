import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function ProjectIndexLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitle: true,
                headerTransparent: Platform.OS === 'ios',
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
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: '', // avoids showing `index` while the project name is loading
                }}
            />
        </Stack>
    )
}
