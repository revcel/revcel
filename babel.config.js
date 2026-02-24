module.exports = (api) => {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'react-native-boost/plugin',
                {
                    optimizers: {
                        view: false,
                    },
                },
            ],
            'hot-updater/babel-plugin',
        ],
    }
}
