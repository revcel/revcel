import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

export default function v0Screen() {
    const acknowledgements = usePersistedStore((state) => state.acknowledgments)
    const acknowledge = usePersistedStore((state) => state.acknowledge)

    const webViewRef = useRef<WebView>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!acknowledgements.swipeLeftv0) {
            setTimeout(() => {
                acknowledge('swipeLeftv0')
                Alert.alert('Swipe left to exit v0 and go back to home!')
            }, 2000)
        }
    }, [acknowledgements.swipeLeftv0, acknowledge])

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f10' }} edges={['top']}>
            <WebView
                ref={webViewRef}
                source={{
                    uri: 'https://v0.dev/api/auth/login?next=%2Fchat',
                }}
                style={{
                    opacity: loaded ? 1 : 0,
                }}
                containerStyle={{
                    backgroundColor: '#0f0f10',
                }}
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                javaScriptEnabled={true}
                onLoadEnd={() => {
                    setLoaded(true)
                }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
            />
            {/* 
                This view is causing issues with touch events, it is is always above of the rest of this screen. 
                Setting only opacity wont work as view itself is still "there" just not visible. 
                We have to remove this view when loaded or try to set pointerEvents="none" 
            */}
            {!loaded && (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                >
                    <ActivityIndicator size="large" color={COLORS.success} />
                </View>
            )}
        </SafeAreaView>
    )
}
