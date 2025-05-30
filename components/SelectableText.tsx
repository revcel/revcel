import { COLORS } from '@/theme/colors'
import { useRef } from 'react'
import { Platform, ScrollView, Text, TextInput } from 'react-native'

type SelectableTextProps = {
    text: string
    // Set this prop to true if you would like to view logs starting from the bottom.
    shouldScrollToBottom?: boolean
}

// On android setting editable prop on TextInput will also disable text selection.
// If we do not need this TextInput to be editable we can try to use Text component with selectable prop so user can select and copy text.
export function SelectableText({ text, shouldScrollToBottom }: SelectableTextProps) {
    const isAndroid = Platform.OS === 'android'
    const scrollViewRef = useRef<ScrollView>(null)

    const scrollToBottom = () => {
        if (!scrollViewRef.current || !shouldScrollToBottom) {
            return
        }

        scrollViewRef.current.scrollToEnd({ animated: false })
    }

    const styles = {
        color: COLORS.gray1000,
        fontFamily: 'monospace',
        paddingHorizontal: 16,
        lineHeight: 25,
    }

    return isAndroid ? (
        <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={Platform.select({
                android: {
                    paddingBottom: 40,
                },
            })}
        >
            <Text selectable={true} style={styles}>
                {text}
            </Text>
        </ScrollView>
    ) : (
        <TextInput
            style={styles}
            multiline={true}
            editable={false}
            scrollEnabled={true}
            value={text}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            autoFocus={true}
            importantForAutofill="no"
        />
    )
}
