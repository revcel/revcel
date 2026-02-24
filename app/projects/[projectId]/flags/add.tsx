import { createProjectFlag } from '@/api/mutations'
import {
    buildCreateFlagBody,
    createDefaultFlagEditorState,
    createVariantDraft,
    getOrderedEnvironmentKeys,
} from '@/lib/flags'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import type { FlagKind } from '@/types/flags'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import {
    Alert,
    Keyboard,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AddFlagScreen() {
    const { projectId } = useLocalSearchParams<{ projectId: string }>()
    const [editor, setEditor] = useState(() => createDefaultFlagEditorState('boolean'))

    const environmentKeys = useMemo(
        () => getOrderedEnvironmentKeys(Object.keys(editor.environmentValues)),
        [editor.environmentValues]
    )

    const createFlagMutation = useMutation({
        mutationFn: createProjectFlag,
        onSuccess: async (flag) => {
            await queryClient.invalidateQueries({ queryKey: ['project', projectId, 'flags'] })
            router.replace(`/projects/${projectId}/flags/${flag.id}`)
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const setKind = (nextKind: FlagKind) => {
        setEditor((currentEditor) => {
            if (currentEditor.kind === nextKind) {
                return currentEditor
            }

            const nextEnvironmentValues: Record<string, string | number | boolean> = {}
            const activeKeys = getOrderedEnvironmentKeys(Object.keys(currentEditor.environmentValues))

            if (nextKind === 'string') {
                const nextVariants =
                    currentEditor.variants.length > 0
                        ? currentEditor.variants
                        : [createVariantDraft(), createVariantDraft()]
                const fallbackVariantId = nextVariants[0].id

                for (const environment of activeKeys) {
                    nextEnvironmentValues[environment] = fallbackVariantId
                }

                return {
                    ...currentEditor,
                    kind: nextKind,
                    variants: nextVariants,
                    environmentValues: nextEnvironmentValues,
                }
            }

            for (const environment of activeKeys) {
                const currentValue = currentEditor.environmentValues[environment]

                if (nextKind === 'boolean') {
                    nextEnvironmentValues[environment] = typeof currentValue === 'boolean' ? currentValue : false
                } else {
                    if (typeof currentValue === 'number') {
                        nextEnvironmentValues[environment] = currentValue
                    } else if (typeof currentValue === 'string' && currentValue.trim()) {
                        const parsed = Number(currentValue)
                        nextEnvironmentValues[environment] = Number.isNaN(parsed) ? 0 : parsed
                    } else if (typeof currentValue === 'boolean') {
                        nextEnvironmentValues[environment] = currentValue ? 1 : 0
                    } else {
                        nextEnvironmentValues[environment] = 0
                    }
                }
            }

            return {
                ...currentEditor,
                kind: nextKind,
                environmentValues: nextEnvironmentValues,
            }
        })
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: 40,
                        gap: 18,
                    }}
                >
                    <Section title="Slug">
                        <TextInput
                            style={inputStyle}
                            value={editor.slug}
                            onChangeText={(text) => {
                                setEditor((currentEditor) => ({
                                    ...currentEditor,
                                    slug: text,
                                }))
                            }}
                            placeholder="new-flag-key"
                            placeholderTextColor={COLORS.gray900}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect={false}
                            keyboardAppearance="dark"
                        />
                    </Section>

                    <Section title="Kind">
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <ChoicePill
                                label="Boolean"
                                selected={editor.kind === 'boolean'}
                                onPress={() => setKind('boolean')}
                            />
                            <ChoicePill
                                label="String"
                                selected={editor.kind === 'string'}
                                onPress={() => setKind('string')}
                            />
                            <ChoicePill
                                label="Number"
                                selected={editor.kind === 'number'}
                                onPress={() => setKind('number')}
                            />
                        </View>
                    </Section>

                    <Section title="State">
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <ChoicePill
                                label="Active"
                                selected={editor.state === 'active'}
                                onPress={() => {
                                    setEditor((currentEditor) => ({
                                        ...currentEditor,
                                        state: 'active',
                                    }))
                                }}
                            />
                            <ChoicePill
                                label="Archived"
                                selected={editor.state === 'archived'}
                                onPress={() => {
                                    setEditor((currentEditor) => ({
                                        ...currentEditor,
                                        state: 'archived',
                                    }))
                                }}
                            />
                        </View>
                    </Section>

                    <Section title="Description (optional)">
                        <TextInput
                            style={[inputStyle, { minHeight: 88, textAlignVertical: 'top' }]}
                            value={editor.description}
                            onChangeText={(text) => {
                                setEditor((currentEditor) => ({
                                    ...currentEditor,
                                    description: text,
                                }))
                            }}
                            placeholder="What this flag controls"
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
                                {editor.variants.map((variant, index) => (
                                    <View
                                        key={variant.id}
                                        style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
                                    >
                                        <View style={{ flex: 1, gap: 8 }}>
                                            <TextInput
                                                style={inputStyle}
                                                value={variant.value}
                                                onChangeText={(text) => {
                                                    setEditor((currentEditor) => ({
                                                        ...currentEditor,
                                                        variants: currentEditor.variants.map((item) =>
                                                            item.id === variant.id
                                                                ? { ...item, value: text }
                                                                : item
                                                        ),
                                                    }))
                                                }}
                                                placeholder={`Value ${index + 1}`}
                                                placeholderTextColor={COLORS.gray900}
                                                autoCapitalize="none"
                                                autoComplete="off"
                                                autoCorrect={false}
                                                keyboardAppearance="dark"
                                            />
                                            <TextInput
                                                style={inputStyle}
                                                value={variant.label}
                                                onChangeText={(text) => {
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
                                            disabled={editor.variants.length <= 1}
                                            onPress={() => {
                                                setEditor((currentEditor) => {
                                                    if (currentEditor.variants.length <= 1) {
                                                        return currentEditor
                                                    }

                                                    const nextVariants = currentEditor.variants.filter(
                                                        (item) => item.id !== variant.id
                                                    )
                                                    const fallbackVariantId = nextVariants[0]?.id || ''
                                                    const nextEnvironmentValues = {
                                                        ...currentEditor.environmentValues,
                                                    }

                                                    for (const environment of Object.keys(nextEnvironmentValues)) {
                                                        if (
                                                            nextEnvironmentValues[environment] === variant.id
                                                        ) {
                                                            nextEnvironmentValues[environment] =
                                                                fallbackVariantId
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
                                                opacity: editor.variants.length <= 1 ? 0.35 : 1,
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={COLORS.gray900} />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    onPress={() => {
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
                                                onValueChange={(nextValue) => {
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
                                                onChangeText={(text) => {
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
                                                const selected =
                                                    editor.environmentValues[environment] === variant.id

                                                return (
                                                    <ChoicePill
                                                        key={`${environment}-${variant.id}`}
                                                        label={variant.label || variant.value || 'Untitled'}
                                                        selected={selected}
                                                        onPress={() => {
                                                            setEditor((currentEditor) => ({
                                                                ...currentEditor,
                                                                environmentValues: {
                                                                    ...currentEditor.environmentValues,
                                                                    [environment]: variant.id,
                                                                },
                                                            }))
                                                        }}
                                                    />
                                                )
                                            })}
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    </Section>

                    <TouchableOpacity
                        style={{
                            marginTop: 8,
                            borderRadius: 10,
                            paddingVertical: 16,
                            backgroundColor: COLORS.gray1000,
                            opacity: createFlagMutation.isPending ? 0.6 : 1,
                        }}
                        disabled={createFlagMutation.isPending}
                        onPress={async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

                            try {
                                const payload = buildCreateFlagBody(editor)
                                await createFlagMutation.mutateAsync({
                                    projectId,
                                    data: payload,
                                })
                            } catch (error) {
                                const message =
                                    error instanceof Error ? error.message : 'Failed to create flag'
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
                            {createFlagMutation.isPending ? 'Creating...' : 'Create'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 8 }}>
            <Text style={{ color: COLORS.gray1000, fontSize: 14, fontFamily: 'Geist' }}>{title}</Text>
            {children}
        </View>
    )
}

function ChoicePill({
    label,
    selected,
    onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: selected ? COLORS.gray300 : COLORS.backgroundSecondary,
                borderColor: selected ? COLORS.gray500 : COLORS.gray300,
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 14,
            }}
            onPress={onPress}
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
