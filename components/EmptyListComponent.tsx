import { COLORS } from '@/theme/colors'
import { ActivityIndicator, Text, View } from 'react-native'

export default function buildEmptyListComponent({
    isLoading,
    hasValue,
    error,
    emptyLabel,
    errorLabel,
}: {
    isLoading: boolean
    hasValue: boolean | undefined
    error: Error | null
    emptyLabel: string
    errorLabel: string
}) {
    if (isLoading) {
        return (
            <EmptyListView>
                <ActivityIndicator size="large" color={COLORS.success} />
            </EmptyListView>
        )
    }

    if (error) {
        return (
            <EmptyListView>
                <Text style={{ fontSize: 16, color: COLORS.gray1000, textAlign: 'center' }}>
                    {errorLabel}
                </Text>
            </EmptyListView>
        )
    }

    if (!hasValue) {
        return (
            <EmptyListView>
                <Text style={{ fontSize: 16, color: COLORS.gray1000, textAlign: 'center' }}>
                    {emptyLabel}
                </Text>
            </EmptyListView>
        )
    }

    return undefined
}

// Memoize the entire component
// export default React.memo(EmptyListComponent, (prevProps, nextProps) => {
//     return (
//         prevProps.isLoading === nextProps.isLoading &&
//         prevProps.hasValue === nextProps.hasValue &&
//         prevProps.error === nextProps.error &&
//         prevProps.emptyLabel === nextProps.emptyLabel &&
//         prevProps.errorLabel === nextProps.errorLabel
//     )
// })

function EmptyListView({ children }: { children: React.ReactNode }) {
    return (
        <View
            style={{
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 150,
            }}
        >
            {children}
        </View>
    )
}
