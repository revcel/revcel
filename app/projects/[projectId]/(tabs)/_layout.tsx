import { COLORS } from '@/theme/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    borderTopColor: COLORS.gray200,
                    backgroundColor: COLORS.backgroundSecondary,
                    borderTopWidth: Platform.OS === 'ios' ? 1 : 0.2,
                    paddingTop: 8,
                    paddingBottom: 24,
                    height: 84,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Deployments',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'rocket' : 'rocket-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="logs"
                options={{
                    title: 'Logs',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'document-text' : 'document-text-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            {/* <Tabs.Screen
			name="observability"
			options={{
				title: 'Observability',
				tabBarIcon: ({ color, focused, size }) => (
					<Ionicons
						name={focused ? 'bar-chart' : 'bar-chart-outline'}
						size={size}
						color={color}
					/>
				),
			}}
		/> */}
            <Tabs.Screen
                name="environment"
                options={{
                    title: 'Environment',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'eye' : 'eye-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="domains"
                options={{
                    title: 'Domains',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'link' : 'link-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    )
}
