import { COLORS } from '@/theme/colors'
import { LinearGradient } from 'expo-linear-gradient'
import { memo, useMemo } from 'react'
import { easeGradient } from 'react-native-easing-gradient'

function BottomGradient() {
    const { colors, locations } = useMemo(
        () =>
            easeGradient({
                colorStops: {
                    0: { color: COLORS.background + '01' },
                    1: { color: 'rgba(1,1,1,0.99)' },
                },
                extraColorStopsPerTransition: 64,
            }),
        []
    )

    return (
        <LinearGradient
            // colors={['rgba(1,1,1,0)', 'rgba(1,1,1,0.99)']}
            colors={colors as [string, string]}
            locations={locations as [number, number]}
            style={{
                height: 24,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
            }}
        />
    )
}

export default memo(BottomGradient)
