const { withMainApplication } = require('expo/config-plugins')

module.exports = function withHotUpdaterAndroidFix(config) {
    return withMainApplication(config, (exportedConfig) => {
        const contents = exportedConfig.modResults.contents

        const brokenPattern =
            /(PackageList\(this\)\.packages\.apply\s*\{[\s\S]*?\n\s*})(\n\s*jsBundleFilePath\s*=\s*HotUpdater\.getJSBundleFile\(applicationContext\),)/

        if (brokenPattern.test(contents)) {
            exportedConfig.modResults.contents = contents.replace(
                brokenPattern,
                '$1,$2'
            )
        }

        return exportedConfig
    })
}
