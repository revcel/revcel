import { deleteProjectFlag, updateProjectFlag } from '@/api/mutations'
import { fetchTeamProjectFlag } from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import RefreshControl from '@/components/base/RefreshControl'
import {
    buildUpdateFlagBody,
    createDefaultFlagEditorState,
    createVariantDraft,
    getOrderedEnvironmentKeys,
    mapFlagToSimpleEditor,
} from '@/lib/flags'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function FlagDetailScreen() {
    const { projectId, flagId } = useLocalSearchParams<{ projectId: string; flagId: string }>()
    const navigation = useNavigation()
    const [editor, setEditor] = useState(() => createDefaultFlagEditorState('boolean'))

    const flagQuery = useQuery({
        queryKey: ['project', projectId, 'flag', flagId],
        queryFn: () =>
            fetchTeamProjectFlag({
                projectId,
                flagIdOrSlug: flagId,
                withMetadata: true,
            }),
        enabled: !!projectId && !!flagId,
    })

    const mappedFlag = useMemo(() => {
        if (!flagQuery.data) {
            return null
        }
        return mapFlagToSimpleEditor(flagQuery.data)
    }, [flagQuery.data])

    useEffect(() => {
        if (mappedFlag) {
            setEditor(mappedFlag.editor)
        }
    }, [mappedFlag])

    useLayoutEffect(() => {
        navigation.setOptions({
            title: flagQuery.data?.slug || 'Flag',
        })
    }, [navigation, flagQuery.data?.slug])

    const updateFlagMutation = useMutation({
        mutationFn: updateProjectFlag,
        onSuccess: async (flag) => {
            const mapped = mapFlagToSimpleEditor(flag)
            setEditor(mapped.editor)

            await queryClient.invalidateQueries({ queryKey: ['project', projectId, 'flags'] })
            await queryClient.invalidateQueries({ queryKey: ['project', projectId, 'flag', flagId] })
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const deleteFlagMutation = useMutation({
        mutationFn: deleteProjectFlag,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['project', projectId, 'flags'] })
            await queryClient.invalidateQueries({ queryKey: ['project', projectId, 'flag', flagId] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const environmentKeys = useMemo(
        () => getOrderedEnvironmentKeys(Object.keys(editor.environmentValues)),
        [editor.environmentValues]
    )
    const isAdvanced = mappedFlag?.isAdvanced ?? false
    const isSaving = updateFlagMutation.isPending
    const isDeleting = deleteFlagMutation.isPending

    if (flagQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
            </View>
        )
    }

    if (flagQuery.isError || !flagQuery.data || !mappedFlag) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <Text style={{ color: COLORS.gray1000, fontSize: 16, fontFamily: 'Geist' }}>
                    Failed to fetch flag
                </Text>
                <TouchableOpacity
                    style={{
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: COLORS.gray300,
                    }}
                    onPress={() => {
                        flagQuery.refetch()
                    }}
                >
                    <Text style={{ color: COLORS.gray1000, fontSize: 14, fontFamily: 'Geist' }}>
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        )
    }

    const isReadOnly = isAdvanced || isSaving || isDeleting

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl onRefresh={flagQuery.refetch} />}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: 48,
                    gap: 18,
                }}
            >
                {isAdvanced && (
                    <View
                        style={{
                            backgroundColor: COLORS.amber100,
                            borderRadius: 10,
                            borderColor: COLORS.amber500,
                            borderWidth: 1,
                            padding: 12,
                            gap: 6,
                        }}
                    >
                        <Text style={{ color: COLORS.amber1000, fontSize: 14, fontFamily: 'Geist' }}>
                            This flag uses advanced configuration and is read-only in the app.
                        </Text>
                    </View>
                )}

                <Section title="Slug">
                    <TextInput
                        style={inputStyle}
                        value={editor.slug}
                        editable={false}
                        placeholderTextColor={COLORS.gray900}
                    />
                </Section>

                <Section title="Kind">
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <ChoicePill
                            label="Boolean"
                            selected={editor.kind === 'boolean'}
                            onPress={() => {}}
                            disabled={true}
                        />
                        <ChoicePill
                            label="String"
                            selected={editor.kind === 'string'}
                            onPress={() => {}}
                            disabled={true}
                        />
                        <ChoicePill
                            label="Number"
                            selected={editor.kind === 'number'}
                            onPress={() => {}}
                            disabled={true}
                        />
                    </View>
                </Section>

                <Section title="State">
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <ChoicePill
                            label="Active"
                            selected={editor.state === 'active'}
                            onPress={() => {
                                if (isReadOnly) {
                                    return
                                }

                                setEditor((currentEditor) => ({
                                    ...currentEditor,
                                    state: 'active',
                                }))
                            }}
                            disabled={isReadOnly}
                        />
                        <ChoicePill
                            label="Archived"
                            selected={editor.state === 'archived'}
                            onPress={() => {
                                if (isReadOnly) {
                                    return
                                }

                                setEditor((currentEditor) => ({
                                    ...currentEditor,
                                    state: 'archived',
                                }))
                            }}
                            disabled={isReadOnly}
                        />
                    </View>
                </Section>

                <Section title="Description">
                    <TextInput
                        style={[inputStyle, { minHeight: 88, textAlignVertical: 'top' }]}
                        value={editor.description}
                        onChangeText={(text) => {
                            if (isReadOnly) {
                                return
                            }

                            setEditor((currentEditor) => ({
                                ...currentEditor,
                                description: text,
                            }))
                        }}
                        editable={!isReadOnly}
                        placeholder="No description"
                        placeholderTextColor={COLORS.gray900}
                        autoCapitalize="sentences"
                        autoComplete="off"
                        autoCorrect={false}
                        keyboardAppearance="dark"
                        multiline={true}
                    />
                </Section>

                {editor.kind === 'string' && (
                    <Section title="Options">
                        <View style={{ gap: 10 }}>
                            {editor.variants.map((variant) => (
                                <View
                                    key={variant.id}
                                    style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
                                >
                                    <View style={{ flex: 1, gap: 8 }}>
                                        <TextInput
                                            style={inputStyle}
                                            value={variant.value}
                                            editable={!isReadOnly}
                                            onChangeText={(text) => {
                                                if (isReadOnly) {
                                                    return
                                                }

                                                setEditor((currentEditor) => ({
                                                    ...currentEditor,
                                                    variants: currentEditor.variants.map((item) =>
                                                        item.id === variant.id
                                                            ? { ...item, value: text }
                                                            : item
                                                    ),
                                                }))
                                            }}
                                            placeholder="Value"
                                            placeholderTextColor={COLORS.gray900}
                                            autoCapitalize="none"
                                            autoComplete="off"
                                            autoCorrect={false}
                                            keyboardAppearance="dark"
                                        />
                                        <TextInput
                                            style={inputStyle}
                                            value={variant.label}
                                            editable={!isReadOnly}
                                            onChangeText={(text) => {
                                                if (isReadOnly) {
                                                    return
                                                }

                                                setEditor((currentEditor) => ({
                                                    ...currentEditor,
                                                    variants: currentEditor.variants.map((item) =>
                                                        item.id === variant.id
                                                            ? { ...item, label: text }
                                                            : item
                                                    ),
                                                }))
                                            }}
                                            placeholder="Label (optional)"
                                            placeholderTextColor={COLORS.gray900}
                                            autoCapitalize="none"
                                            autoComplete="off"
                                            autoCorrect={false}
                                            keyboardAppearance="dark"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        disabled={isReadOnly || editor.variants.length <= 1}
                                        onPress={() => {
                                            if (isReadOnly || editor.variants.length <= 1) {
                                                return
                                            }

                                            setEditor((currentEditor) => {
                                                const nextVariants = currentEditor.variants.filter(
                                                    (item) => item.id !== variant.id
                                                )
                                                const fallbackVariantId = nextVariants[0]?.id || ''
                                                const nextEnvironmentValues = {
                                                    ...currentEditor.environmentValues,
                                                }

                                                for (const environment of Object.keys(nextEnvironmentValues)) {
                                                    if (nextEnvironmentValues[environment] === variant.id) {
                                                        nextEnvironmentValues[environment] = fallbackVariantId
                                                    }
                                                }

                                                return {
                                                    ...currentEditor,
                                                    variants: nextVariants,
                                                    environmentValues: nextEnvironmentValues,
                                                }
                                            })
                                        }}
                                        style={{
                                            padding: 8,
                                            opacity: isReadOnly || editor.variants.length <= 1 ? 0.35 : 1,
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={COLORS.gray900} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity
                                disabled={isReadOnly}
                                onPress={() => {
                                    if (isReadOnly) {
                                        return
                                    }

                                    setEditor((currentEditor) => ({
                                        ...currentEditor,
                                        variants: [...currentEditor.variants, createVariantDraft()],
                                    }))
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    alignSelf: 'flex-start',
                                    paddingVertical: 4,
                                    opacity: isReadOnly ? 0.35 : 1,
                                }}
                            >
                                <Ionicons name="add-circle-outline" size={22} color={COLORS.gray1000} />
                                <Text style={{ color: COLORS.gray1000, fontSize: 16, fontFamily: 'Geist' }}>
                                    Add option
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Section>
                )}

                <Section title="Environments">
                    <View style={{ gap: 14 }}>
                        {environmentKeys.map((environment) => {
                            const meta = getEnvironmentMeta(environment)

                            if (editor.kind === 'boolean') {
                                return (
                                    <View
                                        key={environment}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <EnvironmentLabel label={meta.label} color={meta.color} />
                                        <Switch
                                            value={Boolean(editor.environmentValues[environment])}
                                            disabled={isReadOnly}
                                            onValueChange={(nextValue) => {
                                                if (isReadOnly) {
                                                    return
                                                }

                                                setEditor((currentEditor) => ({
                                                    ...currentEditor,
                                                    environmentValues: {
                                                        ...currentEditor.environmentValues,
                                                        [environment]: nextValue,
                                                    },
                                                }))
                                            }}
                                            trackColor={{
                                                true: COLORS.success,
                                                false: COLORS.gray500,
                                            }}
                                            thumbColor={COLORS.gray1000}
                                        />
                                    </View>
                                )
                            }

                            if (editor.kind === 'number') {
                                return (
                                    <View key={environment} style={{ gap: 8 }}>
                                        <EnvironmentLabel label={meta.label} color={meta.color} />
                                        <TextInput
                                            style={inputStyle}
                                            value={String(editor.environmentValues[environment] ?? '')}
                                            editable={!isReadOnly}
                                            onChangeText={(text) => {
                                                if (isReadOnly) {
                                                    return
                                                }

                                                setEditor((currentEditor) => ({
                                                    ...currentEditor,
                                                    environmentValues: {
                                                        ...currentEditor.environmentValues,
                                                        [environment]: text,
                                                    },
                                                }))
                                            }}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.gray900}
                                            keyboardType="decimal-pad"
                                            autoCapitalize="none"
                                            autoComplete="off"
                                            autoCorrect={false}
                                            keyboardAppearance="dark"
                                        />
                                    </View>
                                )
                            }

                            return (
                                <View key={environment} style={{ gap: 8 }}>
                                    <EnvironmentLabel label={meta.label} color={meta.color} />
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                        {editor.variants.map((variant) => {
                                            const selected = editor.environmentValues[environment] === variant.id

                                            return (
                                                <ChoicePill
                                                    key={`${environment}-${variant.id}`}
                                                    label={variant.label || variant.value || 'Untitled'}
                                                    selected={selected}
                                                    onPress={() => {
                                                        if (isReadOnly) {
                                                            return
                                                        }

                                                        setEditor((currentEditor) => ({
                                                            ...currentEditor,
                                                            environmentValues: {
                                                                ...currentEditor.environmentValues,
                                                                [environment]: variant.id,
                                                            },
                                                        }))
                                                    }}
                                                    disabled={isReadOnly}
                                                />
                                            )
                                        })}
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </Section>

                <Section title="Metadata">
                    <MetaRow label="Revision" value={String(flagQuery.data.revision)} />
                    <MetaRow label="Created" value={formatTimestamp(flagQuery.data.createdAt)} />
                    <MetaRow label="Updated" value={formatTimestamp(flagQuery.data.updatedAt)} />
                    <MetaRow label="Created by" value={flagQuery.data.createdBy} />
                    <MetaRow label="Owner" value={flagQuery.data.ownerId} />
                    {flagQuery.data.metadata?.creator?.name ? (
                        <MetaRow label="Creator" value={flagQuery.data.metadata.creator.name} />
                    ) : null}
                </Section>

                {!isAdvanced && (
                    <TouchableOpacity
                        style={{
                            marginTop: 6,
                            borderRadius: 10,
                            paddingVertical: 16,
                            backgroundColor: COLORS.gray1000,
                            opacity: isSaving ? 0.6 : 1,
                        }}
                        disabled={isReadOnly}
                        onPress={async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

                            try {
                                const payload = buildUpdateFlagBody(editor)
                                await updateFlagMutation.mutateAsync({
                                    projectId,
                                    flagIdOrSlug: flagId,
                                    data: payload,
                                })
                            } catch (error) {
                                const message =
                                    error instanceof Error ? error.message : 'Failed to update flag'
                                Alert.alert('Error', message)
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
                                fontFamily: 'Geist',
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={{
                        borderRadius: 10,
                        paddingVertical: 16,
                        backgroundColor: COLORS.red600,
                        opacity: isDeleting ? 0.7 : 1,
                    }}
                    disabled={isDeleting}
                    onPress={() => {
                        Alert.alert('Delete Flag', 'Are you sure you want to delete this flag?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                    await deleteFlagMutation.mutateAsync({
                                        projectId,
                                        flagIdOrSlug: flagId,
                                    })
                                },
                            },
                        ])
                    }}
                >
                    <Text
                        style={{
                            color: COLORS.red1000,
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            fontFamily: 'Geist',
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

function formatTimestamp(value: number) {
    if (!value) {
        return '—'
    }

    return new Date(value).toLocaleString()
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 8 }}>
            <Text style={{ color: COLORS.gray1000, fontSize: 14, fontFamily: 'Geist' }}>{title}</Text>
            {children}
        </View>
    )
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 16,
                paddingVertical: 6,
            }}
        >
            <Text style={{ color: COLORS.gray900, fontSize: 14, fontFamily: 'Geist' }}>{label}</Text>
            <Text
                style={{
                    color: COLORS.gray1000,
                    fontSize: 14,
                    fontFamily: 'Geist',
                    flex: 1,
                    textAlign: 'right',
                }}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
    )
}

function ChoicePill({
    label,
    selected,
    onPress,
    disabled = false,
}: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: selected ? COLORS.gray300 : COLORS.backgroundSecondary,
                borderColor: selected ? COLORS.gray500 : COLORS.gray300,
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 14,
                opacity: disabled ? 0.6 : 1,
            }}
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={{
                    color: selected ? COLORS.gray1000 : COLORS.gray900,
                    fontSize: 13,
                    fontFamily: 'Geist',
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    )
}

function EnvironmentLabel({ label, color }: { label: string; color: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: color,
                }}
            />
            <Text style={{ color: COLORS.gray1000, fontSize: 16, fontFamily: 'Geist' }}>{label}</Text>
        </View>
    )
}

function getEnvironmentMeta(environment: string) {
    if (environment === 'production') {
        return {
            label: 'Production',
            color: COLORS.blue600,
        }
    }

    if (environment === 'preview') {
        return {
            label: 'Preview',
            color: COLORS.purple600,
        }
    }

    if (environment === 'development') {
        return {
            label: 'Development',
            color: COLORS.amber700,
        }
    }

    return {
        label: environment,
        color: COLORS.gray700,
    }
}

const inputStyle = {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.gray1000,
    fontSize: 14,
    fontFamily: 'Geist' as const,
}
