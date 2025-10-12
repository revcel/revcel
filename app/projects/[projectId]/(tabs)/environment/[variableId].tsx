import { updateEnvironmentVariable } from '@/api/mutations'
import { decryptEnvironmentVariable, fetchTeamProjectEnvironment } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import type { CommonEnvironment, CommonEnvironmentVariable } from '@/types/common'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useLayoutEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
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

export default function EditEnvironmentVariableScreen() {
    const { projectId, variableId } = useLocalSearchParams<{
        projectId: string
        variableId: string
    }>()
    const navigation = useNavigation()

    const [editableVariable, setEditableVariable] = useState<CommonEnvironmentVariable | null>(null)

    const environmentVariablesQuery = useQuery({
        queryKey: ['project', projectId, 'environmentVariables'],
        queryFn: async () => await fetchTeamProjectEnvironment({ projectId }),
        enabled: !!projectId,
    })

    const editEnvironmentVariableMutation = useMutation({
        mutationFn: updateEnvironmentVariable,
        onSuccess: () => {
            queryClient.resetQueries({ queryKey: ['project', projectId, 'environmentVariables'] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    useEffect(() => {
        if (environmentVariablesQuery.data) {
            const editableEnvironmentVariable = environmentVariablesQuery.data.envs.find(
                (env) => env.id === variableId
            )
            if (editableEnvironmentVariable) {
                decryptEnvironmentVariable({
                    projectId,
                    id: variableId,
                }).then((env) => {
                    // setValue(env.value)
                    setEditableVariable({
                        ...editableEnvironmentVariable,
                        value: env.value,
                        key: editableEnvironmentVariable.key,
                        comment: editableEnvironmentVariable.comment,
                        target: editableEnvironmentVariable.target,
                        type: editableEnvironmentVariable.type,
                    })
                })
            }
        }
    }, [environmentVariablesQuery.data, variableId, projectId])

    useLayoutEffect(() => {
        if (!editableVariable) return

        navigation.setOptions({
            title: `Edit ${editableVariable.key}`,
        })
    }, [editableVariable, navigation])

    if (!editableVariable) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.success} />
            </View>
        )
    }

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
                                editable={editableVariable.type !== 'sensitive'}
                                defaultValue={editableVariable.key}
                                onChangeText={(text) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        key: text,
                                    })
                                }}
                                placeholder="Enter name"
                                placeholderTextColor={COLORS.gray900}
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
                                editable={editableVariable.type !== 'sensitive'}
                                defaultValue={
                                    editableVariable.type === 'sensitive'
                                        ? '[Hidden] Sensitive Value'
                                        : editableVariable.value
                                }
                                onChangeText={(text) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        value: text,
                                    })
                                }}
                                placeholder="Enter value"
                                placeholderTextColor={COLORS.gray900}
                                multiline={true}
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
                                defaultValue={editableVariable.comment}
                                onChangeText={(text) => {
                                    setEditableVariable({
                                        ...editableVariable,
                                        comment: text,
                                    })
                                }}
                                placeholder="Add a comment (optional)"
                                placeholderTextColor={COLORS.gray900}
                                multiline={true}
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
                    </View>

                    <TouchableOpacity
                        style={{
                            padding: 16,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: COLORS.gray1000,
                        }}
                        disabled={editEnvironmentVariableMutation.isPending}
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

                            if (
                                editableVariable.value ===
                                    environmentVariablesQuery.data?.envs.find(
                                        (env) => env.id === variableId
                                    )?.value &&
                                editableVariable.comment ===
                                    environmentVariablesQuery.data?.envs.find(
                                        (env) => env.id === variableId
                                    )?.comment &&
                                editableVariable.target.every((target) =>
                                    environmentVariablesQuery.data?.envs
                                        .find((env) => env.id === variableId)
                                        ?.target.includes(target)
                                )
                            ) {
                                return
                            }

                            if (editableVariable.type === 'sensitive') {
                                await editEnvironmentVariableMutation.mutateAsync({
                                    projectId,
                                    id: variableId,
                                    data: {
                                        type: 'sensitive',
                                        target: editableVariable.target,
                                        comment: editableVariable.comment,
                                    },
                                })
                            } else {
                                await editEnvironmentVariableMutation.mutateAsync({
                                    projectId,
                                    id: variableId,
                                    data: {
                                        type: editableVariable.type,
                                        target: editableVariable.target,
                                        key: editableVariable.key,
                                        value: editableVariable.value,
                                        comment: editableVariable.comment,
                                    },
                                })
                            }
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
                            {editEnvironmentVariableMutation.isPending ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}
