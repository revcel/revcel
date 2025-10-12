import { addEnvironmentVariable } from '@/api/mutations'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import type { CommonEnvironment, CommonEnvironmentVariable } from '@/types/common'
import { useMutation } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    Platform,
    SafeAreaView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'

const ENVIRONMENTS: { key: CommonEnvironment; name: string }[] = [
    { key: 'development', name: 'Development' },
    { key: 'preview', name: 'Preview' },
    { key: 'production', name: 'Production' },
]

export default function AddEnvironmentVariableScreen() {
    const { projectId } = useLocalSearchParams<{ projectId: string }>()

    const [editableVariable, setEditableVariable] = useState<CommonEnvironmentVariable>({
        key: '',
        value: '',
        target: [],
        type: 'encrypted',
        comment: '',
        configurationId: null,
        createdAt: 0,
        id: '',
        updatedAt: 0,
        createdBy: '',
        updatedBy: null,
    })

    const createEnvironmentVariableMutation = useMutation({
        mutationFn: addEnvironmentVariable,
        onSuccess: async () => {
            await queryClient.resetQueries({
                queryKey: ['project', projectId, 'environmentVariables'],
            })
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
                        {/* Name field */}
                        <View style={{ flexDirection: 'column', gap: 8 }}>
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Name</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.backgroundSecondary,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: COLORS.gray1000,
                                    fontSize: 14,
                                }}
                                onChangeText={(text) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        key: text,
                                    })
                                }}
                                placeholder="Enter name"
                                placeholderTextColor={COLORS.gray900}
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Value field */}
                        <View style={{ flexDirection: 'column', gap: 8 }}>
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Value</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.backgroundSecondary,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: COLORS.gray1000,
                                    fontSize: 14,
                                }}
                                onChangeText={(text) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        value: text,
                                    })
                                }}
                                placeholder="Enter value"
                                placeholderTextColor={COLORS.gray900}
                                multiline={true}
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Comment field */}
                        <View style={{ flexDirection: 'column', gap: 8 }}>
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Comment</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.backgroundSecondary,
                                    borderRadius: 8,
                                    padding: 12,
                                    color: COLORS.gray1000,
                                    fontSize: 14,
                                    height: 80,
                                    textAlignVertical: 'top',
                                }}
                                onChangeText={(text) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        comment: text,
                                    })
                                }}
                                placeholder="Add a comment (optional)"
                                placeholderTextColor={COLORS.gray900}
                                multiline={true}
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Environments */}
                        <View style={{ flexDirection: 'column', gap: 8 }}>
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>
                                Environments
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {ENVIRONMENTS.map((env) => {
                                    const isSelected = editableVariable.target.includes(env.key)
                                    return (
                                        <TouchableOpacity
                                            key={env.key}
                                            style={{
                                                backgroundColor: isSelected
                                                    ? COLORS.gray300
                                                    : COLORS.backgroundSecondary,
                                                padding: 8,
                                                paddingHorizontal: 16,
                                                borderRadius: 8,
                                            }}
                                            onPress={() => {
                                                const newTarget = isSelected
                                                    ? editableVariable.target.filter(
                                                          (t) => t !== env.key
                                                      )
                                                    : [...editableVariable.target, env.key]
                                                setEditableVariable({
                                                    ...editableVariable,
                                                    target: newTarget,
                                                })
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: isSelected
                                                        ? COLORS.gray1000
                                                        : COLORS.gray900,
                                                }}
                                            >
                                                {env.name}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>

                        {/* Sensitive switch */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 14, color: COLORS.gray1000 }}>Sensitive</Text>
                            <Switch
                                value={editableVariable.type === 'sensitive'}
                                onValueChange={(value) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        type: value ? 'sensitive' : 'encrypted',
                                    })
                                }}
                                trackColor={{
                                    true: COLORS.success,
                                    false: undefined,
                                }}
                                thumbColor={
                                    Platform.OS === 'android' ? COLORS.successDark : undefined
                                }
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={{
                            padding: 16,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: COLORS.gray1000,
                        }}
                        disabled={createEnvironmentVariableMutation.isPending}
                        onPress={async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

                            if (
                                !editableVariable.key ||
                                !editableVariable.value ||
                                editableVariable.target.length === 0
                            ) {
                                Alert.alert('Error', 'Please fill in all required fields')
                                return
                            }

                            await createEnvironmentVariableMutation.mutateAsync({
                                projectId,
                                data: {
                                    key: editableVariable.key,
                                    value: editableVariable.value,
                                    target: editableVariable.target,
                                    type: editableVariable.type,
                                    comment: editableVariable.comment,
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
                            {createEnvironmentVariableMutation.isPending ? 'Creating...' : 'Create'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}
