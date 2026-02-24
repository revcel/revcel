export type FlagState = 'active' | 'archived'

export type FlagKind = 'boolean' | 'string' | 'number'

export interface FlagVariant {
    id: string
    value: string | number | boolean
    label?: string
    description?: string
}

type FlagComparisonOperator =
    | 'eq'
    | '!eq'
    | 'oneOf'
    | '!oneOf'
    | 'containsAllOf'
    | 'containsAnyOf'
    | 'containsNoneOf'
    | 'startsWith'
    | '!startsWith'
    | 'endsWith'
    | '!endsWith'
    | 'ex'
    | '!ex'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'regex'
    | '!regex'
    | 'before'
    | 'after'

type FlagConditionLhs =
    | {
          type: 'segment'
      }
    | {
          type: 'entity'
          kind: string
          attribute: string
      }

type FlagConditionRhsListItem =
    | {
          value: string
          label?: string
          note?: string
      }
    | {
          value: number
          label?: string
          note?: string
      }

type FlagConditionRhs =
    | string
    | number
    | boolean
    | {
          type: 'list/inline' | 'list'
          items: FlagConditionRhsListItem[]
      }
    | {
          type: 'regex'
          pattern: string
          flags: string
      }

interface FlagCondition {
    lhs: FlagConditionLhs
    cmp: FlagComparisonOperator
    rhs?: FlagConditionRhs
}

interface FlagSplitOutcomeBase {
    type: 'entity'
    kind: string
    attribute: string
}

interface FlagVariantOutcome {
    type: 'variant'
    variantId: string
}

interface FlagSplitOutcome {
    type: 'split'
    base: FlagSplitOutcomeBase
    weights: Record<string, number>
    defaultVariantId: string
}

type FlagOutcome = FlagVariantOutcome | FlagSplitOutcome

interface FlagRule {
    id: string
    conditions: FlagCondition[]
    outcome: FlagOutcome
}

interface FlagTargetAssignment {
    value: string
    note?: string
}

interface FlagEnvironmentReuse {
    active: boolean
    environment: string
}

export interface FlagEnvironmentConfig {
    active: boolean
    reuse?: FlagEnvironmentReuse
    targets?: Record<string, Record<string, Record<string, FlagTargetAssignment[]>>>
    pausedOutcome: FlagVariantOutcome
    rules: FlagRule[]
    fallthrough: FlagOutcome
    revision?: number
}

export interface FlagMetadata {
    creator?: {
        id: string
        name: string
    }
}

export interface Flag {
    description?: string
    variants: FlagVariant[]
    id: string
    environments: Record<string, FlagEnvironmentConfig>
    kind: FlagKind
    revision: number
    seed: number
    state: FlagState
    slug: string
    createdAt: number
    updatedAt: number
    createdBy: string
    ownerId: string
    projectId: string
    typeName: 'flag'
    metadata?: FlagMetadata
}

export interface ListFlagsResponse {
    data: Flag[]
}

export interface CreateFlagBody {
    slug: string
    kind: FlagKind
    environments: Record<string, FlagEnvironmentConfig>
    variants?: FlagVariant[]
    seed?: number
    description?: string
    state?: FlagState
}

export interface UpdateFlagBody {
    createdBy?: string
    message?: string
    variants?: FlagVariant[]
    environments?: Record<string, FlagEnvironmentConfig>
    seed?: number
    description?: string
    state?: FlagState
}
