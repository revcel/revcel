import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Share, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

export default function BrowserScreen() {
    const webViewRef = useRef<WebView>(null)
    const params = useLocalSearchParams()

    const [currentUrl, setCurrentUrl] = useState<string | null>(null)

    const insets = useSafeAreaInsets()

    const url = useMemo(() => {
        return params.url as string
    }, [params.url])

    if (!url) {
        return null
    }

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: COLORS.backgroundSecondary }}
            edges={['top']}
        >
            <WebView
                ref={webViewRef}
                source={{
                    uri: url,
                }}
                style={{
                    backgroundColor: COLORS.backgroundSecondary,
                }}
                pullToRefreshEnabled={true}
                containerStyle={
                    {
                        // backgroundColor: COLORS.backgroundSecondary,
                    }
                }
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                javaScriptEnabled={true}
                onNavigationStateChange={(event) => {
                    setCurrentUrl(event.url)
                }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                renderLoading={() => (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <ActivityIndicator size="large" color={COLORS.success} />
                    </View>
                )}
            />

            {/* make floating and lower opacity when scrolling */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: insets.bottom - 10,
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    backgroundColor: COLORS.backgroundSecondary,
                    gap: 20,
                }}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: COLORS.gray200,
                    }}
                    onPress={() =>
                        // webViewRef.current?.goBack()
                        router.back()
                    }
                >
                    <Ionicons name="arrow-back-outline" size={14} color={COLORS.gray1000} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: COLORS.gray200,
                    }}
                    onPress={async () => {
                        if (!currentUrl) return

                        await Share.share({
                            // `message` works for both ios and android
                            message: currentUrl,
                        })
                    }}
                >
                    <Ionicons name="share-social-sharp" size={14} color={COLORS.gray1000} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: COLORS.gray200,
                    }}
                    onPress={() => webViewRef.current?.goForward()}
                >
                    <Ionicons name="arrow-forward-outline" size={14} color={COLORS.gray1000} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
