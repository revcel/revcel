const fs = require('fs')

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
function createConfig(config) {
    // read the .ts file
    const ts = fs.readFileSync('theme/colors.ts', 'utf8')

    // parse the ts file, it's an export const COLORS
    // an object with `colorNr: colorValue`
    // remove first and last line
    const colorsObject = ts.trim().split('\n').slice(1, -1).join('\n')

    // we cannot parse the string yet because the keys don't have quotes
    // so we need to split the string by commas and then parse each key-value pair
    const colorPairs = colorsObject
        .split(',')
        .map((pair) => {
            const [key, value] = pair.split(':').map((part) => part.trim())
            if (!key || !value) {
                return null
            }
            return { [key]: value.replace(/'/g, '') }
        })
        .filter(Boolean)

    // convert the colorPairs array to an object
    const colors = colorPairs.reduce((acc, pair) => {
        acc[Object.keys(pair)[0]] = { light: pair[Object.keys(pair)[0]] }
        return acc
    }, {})

    return {
        type: 'widget',
        icon: '../../assets/icon.png',
        entitlements: {},
        colors,
    }
}

module.exports = createConfig
