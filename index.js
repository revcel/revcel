import 'expo-router/entry'
import WidgetKitModule from '@/modules/widgetkit'
import Superwall, { SuperwallOptions } from '@superwall/react-native-superwall'
import * as Notifications from 'expo-notifications'
import * as SplashScreen from 'expo-splash-screen'
import { setBackgroundColorAsync } from 'expo-system-ui'
import { Platform } from 'react-native'

Superwall.configure({
    apiKey: Platform.select({
        ios: process.env.EXPO_PUBLIC_IOS_SUPERWALL_API_KEY,
        android: process.env.EXPO_PUBLIC_ANDROID_SUPERWALL_API_KEY,
    }),
    options: new SuperwallOptions({
        paywalls: {
            shouldPreload: true,
        },
    }),
})
    .then(
        async () => {
            console.log('Superwall configured')
            const { status } = await Superwall.shared.getSubscriptionStatus()
            WidgetKitModule.setIsSubscribed(status === 'ACTIVE')
        },
        (error) => {
            console.error('Could not configure Superwall', error)
        }
    )
    .catch((error) => {
        console.error('Could not configure Superwall', error)
    })

SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({
    duration: 500,
    fade: true,
})

if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('com.revcel.mobile', {
        name: 'Vercel Notifications',
        importance: Notifications.AndroidImportance.MAX,
        bypassDnd: true,
    })
}

setBackgroundColorAsync('#0A0A0A') // setting it in app.json does not seem to have an effect
