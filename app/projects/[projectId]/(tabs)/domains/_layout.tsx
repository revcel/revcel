import { COLORS } from '@/theme/colors'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function DomainsLayout() {
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
                title: 'Domains',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="add"
                options={{
                    // header: () => <View />,
                    // presentation: 'formSheet',
                    // sheetAllowedDetents: 'fitToContents',
                    title: 'New Domain',
                    headerLargeTitle: false,
                    presentation: 'modal',
                }}
            />
        </Stack>
    )
}
