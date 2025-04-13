import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import type { User } from '@/types/user'
import { Ionicons } from '@expo/vector-icons'
import { router, useNavigation } from 'expo-router'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    Button,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated, {
    interpolate,
    useAnimatedKeyboard,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated'

export default function Login() {
    const navigation = useNavigation()

    const connections = usePersistedStore((state) => state.connections)
    const addConnection = usePersistedStore((state) => state.addConnection)
    const switchConnection = usePersistedStore((state) => state.switchConnection)

    const apiTokenRef = useRef<string>('')

    const [isLoading, setIsLoading] = useState(false)
    const [isModal, setIsModal] = useState(false)

    const showCloseButton = useMemo(() => {
        return Platform.OS === 'android' && isModal
    }, [isModal])

    const keyboard = useAnimatedKeyboard({
        isStatusBarTranslucentAndroid: true,
        isNavigationBarTranslucentAndroid: true,
    })

    const helpBoxAnimatedStyles = useAnimatedStyle(() => {
        const isKeyboardVisible = interpolate(keyboard.height.value, [0, 1], [0, 1], 'clamp')

        return {
            opacity: withTiming(isKeyboardVisible ? 0 : 1),
            bottom: withTiming(isKeyboardVisible ? -300 : 0),
        }
    })

    const validateToken = useCallback(async (token: string) => {
        console.log('[validateToken]  token', token)
        try {
            const response = await fetch('https://api.vercel.com/www/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }).then((res) => res.json() as Promise<{ user: User }>)

            return response.user
        } catch {
            Alert.alert('Invalid token', 'Please enter a valid Vercel API token')
            return false
        }
    }, [])

    const handleLogin = useCallback(async () => {
        const token = apiTokenRef.current.trim() || ''
        if (!token) {
            Alert.alert('Error', 'Please enter an API token')
            return
        }

        setIsLoading(true)

        try {
            const user = await validateToken(token)
            if (!user) {
                Alert.alert('Error', 'Invalid token')
                return
            }

            if (connections.find((c) => c.id === user.uid)) {
                Alert.alert('Error', 'You are already connected to this account')
                return
            }

            addConnection({
                id: user.uid,
                apiToken: token,
                currentTeamId: null,
            })

            switchConnection({ connectionId: user.uid })

            router.replace('/home')
        } catch (error) {
            console.error('[handleLogin] error', error)
            Alert.alert('Error', 'Could not connect to Vercel')
        } finally {
            setIsLoading(false)
        }
    }, [connections, addConnection, switchConnection, validateToken])

    const openApiDocs = useCallback(() => {
        try {
            Linking.openURL('https://vercel.com/docs/rest-api#creating-an-access-token')
        } catch {}
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        setIsModal(connections.length > 0)
    }, [])

    useLayoutEffect(() => {
        navigation.setOptions({
            gestureEnabled: isModal,
            // animation: isModal ? undefined : 'none',
        })
    }, [navigation, isModal])

    return (
        <>
            {/* <Stack.Screen
                name="login/index"
                options={{
                    headerShown: false,
                    animation: isModal ? 'none' : 'slide_from_bottom',
                    presentation: isModal ? undefined : 'modal',
                }}
            /> */}

            <KeyboardAwareScrollView
                bottomOffset={20}
                keyboardShouldPersistTaps="handled"
                style={{
                    flex: 1,
                    paddingTop: 120,
                    backgroundColor: COLORS.background,
                }}
                scrollEnabled={false} // might interfere with the keyboard scroll
            >
                {showCloseButton && (
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: -50, // to negate the paddingTop
                            right: 30,
                            backgroundColor: '#ffffff28',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 16,
                            height: 32,
                            width: 32,
                        }}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="close" size={20} color={COLORS.gray1000} />
                    </TouchableOpacity>
                )}

                <View
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        gap: 64,
                        maxWidth: 320,
                        width: '100%',
                    }}
                >
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={{
                                width: 250,
                                height: 250,
                                // borderColor: 'red',
                                // borderWidth: 1,
                            }}
                            resizeMode="contain"
                        />
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '700',
                                textAlign: 'center',
                                color: COLORS.gray1000,
                            }}
                        >
                            {isModal ? 'Add Connection' : 'Welcome to Rev'}
                        </Text>
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: '400',
                                textAlign: 'center',
                                color: COLORS.gray900,
                            }}
                        >
                            {isModal
                                ? 'Add an API token for a new connection!'
                                : 'Add your API token to get started!'}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'column', gap: 10 }}>
                        <Text style={{ color: COLORS.gray1000 }}>API Token</Text>
                        <TextInput
                            style={{
                                height: 48,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: COLORS.gray200,
                                color: COLORS.gray1000,
                                fontSize: 16,
                            }}
                            placeholder="Add an API token"
                            placeholderTextColor={COLORS.gray900}
                            secureTextEntry={true}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={(text) => {
                                apiTokenRef.current = text
                            }}
                            returnKeyLabel="Connect"
                            returnKeyType="go"
                            onSubmitEditing={handleLogin}
                        />
                        <View style={{ marginTop: 20 }}>
                            <Button
                                title={isLoading ? 'Connecting...' : 'Connect'}
                                onPress={handleLogin}
                                disabled={isLoading}
                                color={COLORS.blue600}
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAwareScrollView>
            <Animated.View style={[helpBoxAnimatedStyles]}>
                <Pressable style={styles.helpBox} onPress={openApiDocs}>
                    <Text style={styles.helpTitle}>Need help finding your API key?</Text>
                    <Text style={styles.helpText}>
                        Tap to learn how to generate a Vercel API token.
                    </Text>
                </Pressable>
            </Animated.View>
        </>
    )
}

const styles = StyleSheet.create({
    helpBox: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,

        backgroundColor: COLORS.gray100,
        marginHorizontal: 24,
        padding: 24,

        // marginBottom: Math.max(rt.insets.bottom, 25),
        marginBottom: 25,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray300,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.gray1000,
        marginBottom: 4,
    },
    helpText: { fontSize: 12, fontWeight: '400', color: COLORS.gray900 },
})
