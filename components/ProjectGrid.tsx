import { type ReactNode, useCallback, useState } from 'react'
import { type LayoutChangeEvent, View, useWindowDimensions } from 'react-native'

export interface ProjectGridLayout {
    columns: number
    cardWidth: number
}

// thresholds are container widths (window minus the 16px horizontal padding of both screens)
function getColumns(containerWidth: number) {
    if (containerWidth < 712) return 2
    if (containerWidth < 992) return 3
    if (containerWidth < 1248) return 4
    return 5
}

/**
 * Wrapping row of equal-width cards.
 *
 * The card width is derived in pixels from the measured container width and the gap, so
 * `columns` cards plus their gaps always fit on one row. The previous percentage widths ignored
 * the fixed gap, and on narrow (mostly Android) windows two cards plus the gap exceeded 100%,
 * which wrapped every card onto its own row with a wide empty strip on the right.
 */
export default function ProjectGrid({
    gap,
    horizontalPadding = 16,
    children,
}: {
    gap: number
    /** padding of the parent, only used to guess the width before the first layout pass */
    horizontalPadding?: number
    children: (layout: ProjectGridLayout) => ReactNode
}) {
    const { width: windowWidth } = useWindowDimensions()

    // best guess until `onLayout` reports the real width, avoids a visible re-flow
    const [containerWidth, setContainerWidth] = useState(windowWidth - horizontalPadding * 2)

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const measured = event.nativeEvent.layout.width
        setContainerWidth((current) => (Math.abs(current - measured) < 1 ? current : measured))
    }, [])

    const columns = getColumns(containerWidth)

    // floor so sub-pixel rounding can never push the last card of a row onto the next one
    const cardWidth = Math.floor((containerWidth - gap * (columns - 1)) / columns)

    return (
        <View onLayout={onLayout} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {children({ columns, cardWidth })}
        </View>
    )
}
