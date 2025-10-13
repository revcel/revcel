import Text from '@/components/base/Text'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'

export default function InfoRow({
    label,
    icon,
    value,
    backgroundColor,
    isLight = false,
    borderTop = true,
    borderBottom = true,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    value: string
    backgroundColor?: string
    isLight?: boolean
    borderTop?: boolean
    borderBottom?: boolean
}) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                width: '100%',
                backgroundColor: isLight ? COLORS.gray100 : backgroundColor,
                // borderTopWidth: borderTop ? 0.5 : 0,
                // borderBottomWidth: borderBottom ? 0.5 : 0,
                // borderTopColor: COLORS.alphaGray200,
                // borderBottomColor: COLORS.alphaGray200,
            }}
        >
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon} size={20} color="#666" />
                <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Geist' }}>{label}</Text>
            </View>
            <View style={{ flex: 3, alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text
                    style={{
                        color: COLORS.gray1000,
                        fontSize: 14,
                        textAlign: 'right',
                        fontFamily: 'Geist',
                    }}
                    numberOfLines={2}
                >
                    {value}
                </Text>
            </View>
        </View>
    )
}
