const { AndroidConfig, withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins')
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode')
const withSourceFiles = require('./withSourceFiles')

const withModifiedAppBuildGradle = (config, opts) =>
    withAppBuildGradle(config, (config) => {
        const gradleDependencies = `
    implementation("androidx.glance:glance:${opts.glanceVersion}")
    implementation("androidx.glance:glance-appwidget:${opts.glanceVersion}")
    implementation("androidx.glance:glance-preview:${opts.glanceVersion}")
    implementation("androidx.glance:glance-material3:${opts.glanceVersion}")
    implementation("androidx.glance:glance-appwidget-preview:${opts.glanceVersion}")
    implementation("com.google.code.gson:gson:2.12.1")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.compose.ui:ui:1.7.8")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.work:work-runtime:2.10.0")
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    `

        const gradleAndroidConfig = `
android {
    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "${opts.kotlinExtensionVersion}"
    }
}
`

        let newFileContents = config.modResults.contents

        newFileContents = mergeContents({
            src: newFileContents,
            newSrc: gradleDependencies,
            tag: 'GlanceDependencies',
            anchor: /implementation\("com.facebook.react:react-android"\)/,
            offset: 1,
            comment: '//',
        }).contents

        newFileContents = mergeContents({
            src: newFileContents,
            newSrc: gradleAndroidConfig,
            tag: 'GlanceAndroidConfig',
            anchor: /dependencies \{/,
            offset: -1,
            comment: '//',
        }).contents

        config.modResults.contents = newFileContents

        return config
    })

const withModifiedAndroidManifest = (config, opts) =>
    withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults)

        mainApplication.receiver = mainApplication.receiver ? [...mainApplication.receiver] : []

        mainApplication.receiver.push({
            $: {
                'android:name': `.${opts.receiverName}`,
                'android:exported': 'true',
                'android:label': `${opts.title}`,
            },
            'intent-filter': [
                {
                    action: [
                        {
                            $: {
                                'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                            },
                        },
                    ],
                },
                {
                    action: [
                        {
                            $: {
                                'android:name': 'android.appwidget.action.APPWIDGET_CONFIGURE',
                            },
                        },
                    ],
                },
            ],
            'meta-data': [
                {
                    $: {
                        'android:name': 'android.appwidget.provider',
                        'android:resource': opts.resource,
                        'android:description': opts.description,
                    },
                },
            ],
        })

        return config
    })

const withModifiedAndroidManifestActivity = (config, opts) =>
    withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults)
        
        mainApplication.activity.push({
            $: {
                'android:name': `.${opts.configurationActivity}`,
                'android:exported': 'true',
            },
            'intent-filter': [
                {
                    action: [
                        {
                            $: {
                                'android:name': 'android.appwidget.action.APPWIDGET_CONFIGURE',
                            },
                        },
                    ],
                },
            ],
        })

        return config
    })

const withAndroidWidget = (config, opts) => {
    config = withModifiedAppBuildGradle(config, opts)
    opts.widgets.forEach(widget => {
        config = withModifiedAndroidManifest(config, widget)
    })
    opts.widgets.forEach(widget => {
        config = withModifiedAndroidManifestActivity(config, widget)
    })
    config = withSourceFiles(config, { src: opts.src })

    return config
}

module.exports = withAndroidWidget