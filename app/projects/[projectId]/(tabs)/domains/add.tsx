import { addDomain } from '@/api/mutations'
import { COLORS } from '@/theme/colors'
import type { Domain } from '@/types/domains'
import { useMutation } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useGlobalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    Keyboard,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'

export default function AddDomain() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()

    const [editableDomain, setEditableDomain] = useState<Partial<Domain> | null>(null)

    const addDomainMutation = useMutation({
        mutationFn: addDomain,
        onSuccess: () => {
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                    style={{
                        padding: 24,
                        paddingTop: 16,
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        flex: 1,
                    }}
                >
                    <View style={{ flexDirection: 'column', gap: 20 }}>
                        {/* Domain field */}
                        <View style={{ flexDirection: 'column', gap: 8 }}>
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Domain</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.backgroundSecondary,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: COLORS.gray1000,
                                    fontSize: 14,
                                }}
                                value={editableDomain?.name}
                                onChangeText={(text) => {
                                    if (!editableDomain) return
                                    setEditableDomain({
                                        ...editableDomain,
                                        name: text,
                                    })
                                }}
                                placeholder="Enter name"
                                placeholderTextColor={COLORS.gray900}
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Redirect field */}
                        <View style={{ flexDirection: 'column', gap: 8 }}>
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Redirect</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.backgroundSecondary,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: COLORS.gray1000,
                                    fontSize: 14,
                                }}
                                value={editableDomain?.redirect || ''}
                                onChangeText={(text) => {
                                    if (!editableDomain) return
                                    setEditableDomain({
                                        ...editableDomain,
                                        redirect: text,
                                        redirectStatusCode: text
                                            ? editableDomain.redirectStatusCode
                                            : undefined,
                                    })
                                }}
                                placeholder="Enter redirect domain (optional)"
                                placeholderTextColor={COLORS.gray900}
                                multiline={true}
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect={false}
                            />

                            {editableDomain?.redirect && (
                                <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
                                    {[301, 302, 307, 308].map((statusCode) => (
                                        <TouchableOpacity
                                            key={statusCode}
                                            style={{
                                                flex: 1,
                                                backgroundColor:
                                                    editableDomain?.redirectStatusCode ===
                                                    statusCode
                                                        ? COLORS.backgroundSecondary
                                                        : COLORS.background,
                                                borderRadius: 8,
                                                padding: 12,
                                                borderColor:
                                                    editableDomain?.redirectStatusCode ===
                                                    statusCode
                                                        ? 'transparent'
                                                        : COLORS.gray300,
                                                borderWidth: 1,
                                            }}
                                            onPress={() => {
                                                if (!editableDomain) return
                                                setEditableDomain({
                                                    ...editableDomain,
                                                    redirectStatusCode: statusCode as
                                                        | 301
                                                        | 302
                                                        | 307
                                                        | 308,
                                                })
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                    color:
                                                        editableDomain?.redirectStatusCode ===
                                                        statusCode
                                                            ? COLORS.gray1000
                                                            : COLORS.gray900,
                                                }}
                                            >
                                                {statusCode}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={{
                            padding: 16,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: COLORS.gray1000,
                        }}
                        disabled={!!addDomainMutation.isPending}
                        onPress={async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

                            if (!editableDomain || !editableDomain.name) {
                                Alert.alert('Error', 'Please fill in all required fields')
                                return
                            }

                            await addDomainMutation.mutateAsync({
                                projectId,
                                data: {
                                    name: editableDomain.name,
                                    redirect: editableDomain.redirect,
                                    redirectStatusCode: editableDomain.redirectStatusCode,
                                    gitBranch: editableDomain.gitBranch,
                                },
                            })
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.background,
                                textAlign: 'center',
                                fontSize: 16,
                                fontWeight: '600',
                                textTransform: 'uppercase',
                            }}
                        >
                            {addDomainMutation.isPending ? 'Creating...' : 'Create'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}
