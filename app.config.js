//  https://docs.expo.dev/workflow/configuration/#switching-configuration-based-on-the-environment
//  https://docs.expo.dev/versions/latest/config/app/#backgroundcolor
//  https://docs.expo.dev/versions/latest/config/app/#primarycolor

module.exports = ({ config }) => {
    return {
        ...config,
        primaryColor: '#0A0A0A',
        backgroundColor: '#0A0A0A',

        name: process.env.EXPO_PUBLIC_APP_NAME,
        slug: process.env.EXPO_PUBLIC_APP_SLUG,
        scheme: process.env.EXPO_PUBLIC_APP_SCHEME,
        version: process.env.EXPO_PUBLIC_APP_VERSION,
        owner: process.env.EXPO_PUBLIC_OWNER,

        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        newArchEnabled: true,

        ios: {
            ...(config.ios || {}),
            appleTeamId: process.env.EXPO_PUBLIC_APPLE_TEAM_ID,
            bundleIdentifier: process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER,
            supportsTablet: true,
            config: {
                usesNonExemptEncryption: false,
            },
            infoPlist: {
                'SKIncludeConsumableInAppPurchaseHistory': true,
            },
            entitlements: {
                'com.apple.security.application-groups': [process.env.EXPO_PUBLIC_WIDGET_GROUP],
            },
        },

        androidNavigationBar: {
            enforceContrast: false,
        },
        android: {
            ...(config.android || {}),
            package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE,
            adaptiveIcon: {
                foregroundImage: './assets/icon.png',
                backgroundColor: '#0A0A0A',
            },
            googleServicesFile: './google-services.json',
            playStoreUrl: process.env.EXPO_PUBLIC_ANDROID_STORE_URL,
            predictiveBackGestureEnabled: true,
        },

        plugins: [
            [
                'expo-font',
                {
                    'fonts': ['./assets/fonts/Geist.ttf'],
                },
            ],
            [
                'expo-build-properties',
                {
                    'android': {
                        'minSdkVersion': 26,
                    },
                },
            ],
            './plugins/withAndroidHeap',
            'expo-router',
            [
                'expo-splash-screen',
                {
                    'image': './assets/icon.png',
                    'resizeMode': 'contain',
                    'backgroundColor': '#0A0A0A',
                    'imageWidth': 200,
                },
            ],
            [
                '@sentry/react-native/expo',
                {
                    url: 'https://sentry.io/',
                    project: process.env.EXPO_PUBLIC_SENTRY_PROJECT,
                    organization: process.env.EXPO_PUBLIC_SENTRY_ORG,
                },
            ],
            'expo-quick-actions',
            '@bacons/apple-targets',
            [
                './plugins/withAndroidWidget',
                {
                    'src': './targets/widget-android',
                    'versions': {
                        'glance': '1.1.1',
                        'kotlinExtension': '2.0.0',
                        'gson': '2.13.2',
                        'activityCompose': '1.11.0',
                        'composeUi': '1.9.3',
                        'material3': '1.4.0',
                        'workRuntime': '2.10.5',
                        'chart': '3.1.0',
                    },
                    'widgets': [
                        {
                            'receiverName': 'SmallShortcutWidgetReceiver',
                            'configurationActivity': 'SmallShortcutWidgetConfigurationActivity',
                            'resource': '@xml/small_shortcut_widget_info',
                            'description': '@string/small_shortcut_widget_description',
                            'title': '@string/small_shortcut_widget_title',
                        },
                        {
                            'receiverName': 'MediumAnalyticsWidgetReceiver',
                            'configurationActivity': 'MediumAnalyticsWidgetConfigurationActivity',
                            'resource': '@xml/medium_analytics_widget_info',
                            'description': '@string/medium_analytics_description',
                            'title': '@string/medium_analytics_title',
                        },
                        {
                            'receiverName': 'MediumFirewallWidgetReceiver',
                            'configurationActivity': 'MediumFirewallWidgetConfigurationActivity',
                            'resource': '@xml/medium_firewall_widget_info',
                            'description': '@string/medium_firewall_widget_description',
                            'title': '@string/medium_firewall_widget_title',
                        },
                        {
                            'receiverName': 'LargeTeamProjectsWidgetReceiver',
                            'configurationActivity': 'LargeTeamProjectsWidgetConfigurationActivity',
                            'resource': '@xml/large_team_projects_widget_info',
                            'description': '@string/large_team_projects_widget_description',
                            'title': '@string/large_team_projects_widget_title',
                        },
                    ],
                },
            ],
        ],

        experiments: {
            typedRoutes: true,
        },
        extra: {
            router: {
                origin: false,
            },
            eas: {
                projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
            },
        },
    }
}
