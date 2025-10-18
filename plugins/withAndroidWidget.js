const {
    AndroidConfig,
    withAppBuildGradle,
    withAndroidManifest,
    withProjectBuildGradle,
} = require('@expo/config-plugins')
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode')
const withAndroidSourceFiles = require('./withAndroidSourceFiles')

const withModifiedAppBuildGradle = (config, opts) =>
    withAppBuildGradle(config, (config) => {
        const gradleDependencies = `
    implementation("androidx.glance:glance-appwidget:${opts.versions.glance}")
    implementation("androidx.glance:glance-preview:${opts.versions.glance}")
    implementation("androidx.glance:glance-material3:${opts.versions.glance}")
    implementation("androidx.glance:glance-appwidget-preview:${opts.versions.glance}")
    implementation("com.google.code.gson:gson:${opts.versions.gson}")
    implementation("androidx.activity:activity-compose:${opts.versions.activityCompose}")
    implementation("androidx.compose.ui:ui:${opts.versions.composeUi}")
    implementation("androidx.compose.material3:material3:${opts.versions.material3}")
    implementation("androidx.work:work-runtime:${opts.versions.workRuntime}")
    implementation("com.github.PhilJay:MPAndroidChart:v${opts.versions.chart}")
    `

        const gradleAndroidConfig = `
android {
    buildFeatures {
        compose = true
    }
}`

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

const withRootKotlinComposeClasspath = (config, opts) =>
    withProjectBuildGradle(config, (config) => {
        let newFileContents = config.modResults.contents

        // Ensure the Kotlin Compose Gradle plugin is available on the buildscript classpath
        newFileContents = mergeContents({
            src: newFileContents,
            newSrc: `    classpath('org.jetbrains.kotlin:compose-compiler-gradle-plugin:${opts.versions.kotlinExtension}')`,
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
    config = withRootKotlinComposeClasspath(config, opts)
    config = withModifiedAppBuildGradle(config, opts)
    opts.widgets.forEach((widget) => {
        config = withModifiedAndroidManifest(config, widget)
    })
    opts.widgets.forEach((widget) => {
        config = withModifiedAndroidManifestActivity(config, widget)
    })
    config = withAndroidSourceFiles(config, { src: opts.src })

    return config
}

module.exports = withAndroidWidget
