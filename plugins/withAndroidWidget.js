const {
    AndroidConfig,
    withAppBuildGradle,
    withAndroidManifest,
    withProjectBuildGradle,
} = require('@expo/config-plugins')
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode')
const withSourceFiles = require('./withSourceFiles')

const withModifiedAppBuildGradle = (config, opts) =>
    withAppBuildGradle(config, (config) => {
        const gradleDependencies = `
    implementation("androidx.glance:glance-appwidget:1.1.1")
    implementation("androidx.glance:glance-preview:1.1.1")
    implementation("androidx.glance:glance-material3:1.1.1")
    implementation("androidx.glance:glance-appwidget-preview:1.1.1")
    implementation("com.google.code.gson:gson:2.13.2")
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.compose.ui:ui:1.9.3")
    implementation("androidx.compose.material3:material3:1.4.0")
    implementation("androidx.work:work-runtime:2.10.5")
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    `

        const requestedCompilerExtensionVersion =
            opts.kotlinCompilerExtensionVersion ?? opts.kotlinExtensionVersion
        const composeOptionsBlock = requestedCompilerExtensionVersion
            ? `
    composeOptions {
        kotlinCompilerExtensionVersion = "${requestedCompilerExtensionVersion}"
    }
`
            : ''

        const gradleAndroidConfig = `
android {
    buildFeatures {
        compose = true
    }
${composeOptionsBlock}
}
`

        let newFileContents = config.modResults.contents

        // Apply Kotlin Compose Gradle plugin (required for Kotlin 2.0+ when compose is enabled)
        newFileContents = mergeContents({
            src: newFileContents,
            newSrc: 'apply plugin: "org.jetbrains.kotlin.plugin.compose"',
            tag: 'KotlinComposeGradlePlugin',
            anchor: /apply plugin: "org.jetbrains.kotlin.android"/,
            offset: 1,
            comment: '//',
        }).contents

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

const withRootKotlinComposeClasspath = (config) =>
    withProjectBuildGradle(config, (config) => {
        let newFileContents = config.modResults.contents

        // Ensure the Kotlin Compose Gradle plugin is available on the buildscript classpath
        newFileContents = mergeContents({
            src: newFileContents,
            newSrc: "    classpath('org.jetbrains.kotlin:compose-compiler-gradle-plugin:2.0.0')",
            tag: 'KotlinComposeGradlePluginClasspath',
            anchor: /classpath\('org\.jetbrains\.kotlin:kotlin-gradle-plugin'\)/,
            offset: 1,
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

        // Ensure the activities array exists before pushing
        mainApplication.activity = mainApplication.activity ? [...mainApplication.activity] : []

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
    config = withRootKotlinComposeClasspath(config)
    config = withModifiedAppBuildGradle(config, opts)
    opts.widgets.forEach((widget) => {
        config = withModifiedAndroidManifest(config, widget)
    })
    opts.widgets.forEach((widget) => {
        config = withModifiedAndroidManifestActivity(config, widget)
    })
    config = withSourceFiles(config, { src: opts.src })

    return config
}

module.exports = withAndroidWidget
