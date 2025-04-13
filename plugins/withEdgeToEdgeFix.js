const { withAndroidStyles } = require('@expo/config-plugins')

// fixes https://github.com/zoontek/react-native-edge-to-edge/issues/58
// https://github.com/expo/expo/pull/33964/files

const fixEdgeToEdge = (config) => {
    return withAndroidStyles(config, (config) => {
        config.modResults.resources.style = config.modResults.resources.style?.map((style) => {
            if (style.$.name === 'AppTheme') {
                style.item = style.item.filter(
                    (i) =>
                        ![
                            'android:editTextBackground',
                            'android:textColor',
                            'colorPrimary',
                        ].includes(i.$.name)
                )
            }

            return style
        })

        return config
    })
}

module.exports = fixEdgeToEdge
