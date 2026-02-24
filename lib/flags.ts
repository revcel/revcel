import type {
    CreateFlagBody,
    Flag,
    FlagEnvironmentConfig,
    FlagKind,
    FlagState,
    FlagVariant,
    UpdateFlagBody,
} from '@/types/flags'

export const DEFAULT_FLAG_ENVIRONMENTS = ['production', 'preview', 'development'] as const

export interface SimpleFlagVariantDraft {
    id: string
    value: string
    label: string
}

export interface SimpleFlagEditorState {
    slug: string
    kind: FlagKind
    state: FlagState
    description: string
    variants: SimpleFlagVariantDraft[]
    environmentValues: Record<string, string | number | boolean>
    environmentActive: Record<string, boolean>
}

export function createVariantId() {
    return `icfg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createVariantDraft(): SimpleFlagVariantDraft {
    return {
        id: createVariantId(),
        value: '',
        label: '',
    }
}

export function getOrderedEnvironmentKeys(environmentKeys: string[]) {
    const uniqueEnvironmentKeys = [...new Set(environmentKeys)]
    const defaultEnvironmentSet = new Set<string>(DEFAULT_FLAG_ENVIRONMENTS)

    if (uniqueEnvironmentKeys.length === 0) {
        return [...DEFAULT_FLAG_ENVIRONMENTS]
    }

    const defaultEnvironmentKeys = DEFAULT_FLAG_ENVIRONMENTS.filter((environment) =>
        uniqueEnvironmentKeys.includes(environment)
    )
    const extraEnvironmentKeys = uniqueEnvironmentKeys
        .filter((environment) => !defaultEnvironmentSet.has(environment))
        .sort((a, b) => a.localeCompare(b))

    return [...defaultEnvironmentKeys, ...extraEnvironmentKeys]
}

function isVariantOutcome(value: unknown): value is { type: 'variant'; variantId: string } {
    if (!value || typeof value !== 'object') {
        return false
    }

    const maybeVariantOutcome = value as { type?: string; variantId?: string }

    return maybeVariantOutcome.type === 'variant' && typeof maybeVariantOutcome.variantId === 'string'
}

function hasTargets(config: FlagEnvironmentConfig) {
    return !!config.targets && Object.keys(config.targets).length > 0
}

export function isFlagAdvanced(flag: Flag) {
    for (const environmentConfig of Object.values(flag.environments)) {
        if (environmentConfig.reuse?.active) {
            return true
        }

        if (hasTargets(environmentConfig)) {
            return true
        }

        if (environmentConfig.rules.length > 0) {
            return true
        }

        if (!isVariantOutcome(environmentConfig.fallthrough)) {
            return true
        }

        if (!isVariantOutcome(environmentConfig.pausedOutcome)) {
            return true
        }
    }

    return false
}

function createSimpleEnvironmentConfig(variantId: string, active: boolean): FlagEnvironmentConfig {
    return {
        active,
        rules: [],
        fallthrough: {
            type: 'variant',
            variantId,
        },
        pausedOutcome: {
            type: 'variant',
            variantId,
        },
    }
}

function getVariantIdForEnvironment(
    environmentConfig: FlagEnvironmentConfig | undefined,
    fallbackVariantId: string
) {
    if (!environmentConfig) {
        return fallbackVariantId
    }

    if (isVariantOutcome(environmentConfig.fallthrough)) {
        return environmentConfig.fallthrough.variantId
    }

    if (isVariantOutcome(environmentConfig.pausedOutcome)) {
        return environmentConfig.pausedOutcome.variantId
    }

    return fallbackVariantId
}

function parseBooleanEnvironmentValue(value: string | number | boolean) {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        return value !== 0
    }

    const normalized = value.trim().toLowerCase()
    return ['1', 'true', 'yes', 'on'].includes(normalized)
}

function parseNumberEnvironmentValue(value: string | number | boolean, environment: string) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid number for ${environment}`)
        }
        return value
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0
    }

    const trimmed = value.trim()
    if (!trimmed) {
        throw new Error(`Missing number for ${environment}`)
    }

    const parsed = Number(trimmed)
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        throw new Error(`Invalid number for ${environment}`)
    }

    return parsed
}

function parseFlagVariantValueForEnvironment(
    kind: FlagKind,
    value: string | number | boolean | undefined
) {
    if (kind === 'boolean') {
        if (typeof value === 'boolean') {
            return value
        }
        if (typeof value === 'number') {
            return value !== 0
        }
        if (typeof value === 'string') {
            return parseBooleanEnvironmentValue(value)
        }
        return false
    }

    if (typeof value === 'number') {
        return value
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0
    }
    if (typeof value === 'string') {
        const parsed = Number(value)
        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
            return parsed
        }
    }

    return 0
}

function buildSimpleFlagPayload(editor: SimpleFlagEditorState) {
    const environmentKeys = getOrderedEnvironmentKeys(Object.keys(editor.environmentValues))

    if (editor.kind === 'string') {
        const sanitizedVariants: FlagVariant[] = []
        const usedVariantIds = new Set<string>()

        for (const variant of editor.variants) {
            const trimmedValue = variant.value.trim()
            if (!trimmedValue) {
                continue
            }

            let variantId = variant.id.trim()
            if (!variantId || usedVariantIds.has(variantId)) {
                variantId = createVariantId()
            }

            usedVariantIds.add(variantId)

            sanitizedVariants.push({
                id: variantId,
                value: trimmedValue,
                label: variant.label.trim() || undefined,
            })
        }

        if (sanitizedVariants.length === 0) {
            throw new Error('Add at least one string option')
        }

        const environments: Record<string, FlagEnvironmentConfig> = {}
        for (const environment of environmentKeys) {
            const rawVariantId = editor.environmentValues[environment]
            const selectedVariantId = typeof rawVariantId === 'string' ? rawVariantId : ''
            const fallbackVariantId = sanitizedVariants[0].id
            const variantId =
                sanitizedVariants.find((variant) => variant.id === selectedVariantId)?.id ||
                fallbackVariantId

            environments[environment] = createSimpleEnvironmentConfig(
                variantId,
                editor.environmentActive[environment] ?? true
            )
        }

        return {
            variants: sanitizedVariants,
            environments,
            state: editor.state,
            description: editor.description.trim(),
        }
    }

    const variants: FlagVariant[] = []
    const variantIdByValue = new Map<string, string>()
    const environmentVariantId: Record<string, string> = {}

    for (const environment of environmentKeys) {
        const rawValue = editor.environmentValues[environment]
        const parsedValue =
            editor.kind === 'boolean'
                ? parseBooleanEnvironmentValue(rawValue)
                : parseNumberEnvironmentValue(rawValue, environment)
        const valueKey = `${editor.kind}:${String(parsedValue)}`

        let variantId = variantIdByValue.get(valueKey)
        if (!variantId) {
            variantId = createVariantId()
            variantIdByValue.set(valueKey, variantId)
            variants.push({
                id: variantId,
                value: parsedValue,
            })
        }

        environmentVariantId[environment] = variantId
    }

    const environments: Record<string, FlagEnvironmentConfig> = {}
    for (const environment of environmentKeys) {
        environments[environment] = createSimpleEnvironmentConfig(
            environmentVariantId[environment],
            editor.environmentActive[environment] ?? true
        )
    }

    return {
        variants,
        environments,
        state: editor.state,
        description: editor.description.trim(),
    }
}

export function createDefaultFlagEditorState(kind: FlagKind = 'boolean'): SimpleFlagEditorState {
    const environmentValues: Record<string, string | number | boolean> = {}
    const environmentActive: Record<string, boolean> = {}

    for (const environment of DEFAULT_FLAG_ENVIRONMENTS) {
        environmentActive[environment] = true
        environmentValues[environment] = kind === 'number' ? 0 : false
    }

    return {
        slug: '',
        kind,
        state: 'active',
        description: '',
        variants: [createVariantDraft(), createVariantDraft()],
        environmentValues,
        environmentActive,
    }
}

export function mapFlagToSimpleEditor(flag: Flag) {
    const environmentKeys = getOrderedEnvironmentKeys(Object.keys(flag.environments))
    const environmentActive: Record<string, boolean> = {}
    const environmentValues: Record<string, string | number | boolean> = {}

    for (const environment of environmentKeys) {
        environmentActive[environment] = flag.environments[environment]?.active ?? true
    }

    const variants =
        flag.kind === 'string'
            ? flag.variants.map((variant) => ({
                  id: variant.id,
                  value: String(variant.value),
                  label: variant.label || '',
              }))
            : []

    const fallbackVariantId =
        flag.kind === 'string'
            ? (variants[0]?.id ?? createVariantId())
            : (flag.variants[0]?.id ?? createVariantId())

    if (flag.kind === 'string') {
        if (variants.length === 0) {
            variants.push(createVariantDraft())
        }

        for (const environment of environmentKeys) {
            const selectedVariantId = getVariantIdForEnvironment(
                flag.environments[environment],
                fallbackVariantId
            )

            environmentValues[environment] =
                variants.find((variant) => variant.id === selectedVariantId)?.id || variants[0].id
        }
    } else {
        for (const environment of environmentKeys) {
            const selectedVariantId = getVariantIdForEnvironment(
                flag.environments[environment],
                fallbackVariantId
            )
            const selectedVariant =
                flag.variants.find((variant) => variant.id === selectedVariantId) || flag.variants[0]

            environmentValues[environment] = parseFlagVariantValueForEnvironment(
                flag.kind,
                selectedVariant?.value
            )
        }
    }

    return {
        isAdvanced: isFlagAdvanced(flag),
        environmentKeys,
        editor: {
            slug: flag.slug,
            kind: flag.kind,
            state: flag.state,
            description: flag.description || '',
            variants: variants.length > 0 ? variants : [createVariantDraft()],
            environmentValues,
            environmentActive,
        },
    }
}

export function buildCreateFlagBody(editor: SimpleFlagEditorState): CreateFlagBody {
    const slug = editor.slug.trim()

    if (!slug) {
        throw new Error('Slug is required')
    }

    if (!/^[a-zA-Z0-9_-]{1,512}$/.test(slug)) {
        throw new Error(
            'Slug must use only letters, numbers, dashes, or underscores (max 512 characters)'
        )
    }

    const payload = buildSimpleFlagPayload(editor)

    return {
        slug,
        kind: editor.kind,
        variants: payload.variants,
        environments: payload.environments,
        state: payload.state,
        description: payload.description || undefined,
    }
}

export function buildUpdateFlagBody(editor: SimpleFlagEditorState): UpdateFlagBody {
    const payload = buildSimpleFlagPayload(editor)

    return {
        variants: payload.variants,
        environments: payload.environments,
        state: payload.state,
        description: payload.description,
    }
}
