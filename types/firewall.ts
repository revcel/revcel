export type FirewallAction =
    | 'allow'
    | 'bypass'
    | 'challenge'
    | 'deny'
    | 'log'
    | 'rate_limit'
    | 'redirect'

export type FirewallCrsCategory =
    | 'sd'
    | 'ma'
    | 'lfi'
    | 'rfi'
    | 'rce'
    | 'php'
    | 'gen'
    | 'xss'
    | 'sqli'
    | 'sf'
    | 'java'

export type FirewallManagedRuleKey =
    | 'bot_protection'
    | 'ai_bots'
    | 'owasp'
    | 'vercel_ruleset'
    | 'traffic_sources'

export interface FirewallManagedRule {
    active: boolean
    action?: 'challenge' | 'deny' | 'log'
    updatedAt?: string
    userId?: string
    username?: string
}

export interface FirewallRuleCondition {
    type: string
    op: string
    neg?: boolean
    key?: string
    value?: string | number | string[]
}

export interface FirewallConditionGroup {
    conditions: FirewallRuleCondition[]
}

export interface FirewallRule {
    id: string
    name: string
    description?: string
    active: boolean
    conditionGroup: FirewallConditionGroup[]
    action: {
        mitigate?: {
            action: FirewallAction
            rateLimit?: {
                algo: 'fixed_window' | 'token_bucket'
                window: number
                limit: number
                keys: string[]
                action?: string | null
            } | null
            redirect?: {
                location: string
                permanent: boolean
            } | null
            actionDuration?: string | null
            bypassSystem?: boolean | null
        }
    }
    valid: boolean
    validationErrors?: unknown[] | null
}

export interface FirewallIpRule {
    id: string
    hostname: string
    ip: string
    notes?: string
    action: 'bypass' | 'challenge' | 'deny' | 'log'
}

export interface FirewallSharedCondition {
    id: string
    name: string
    description?: string
    active: boolean
    conditionGroup: FirewallConditionGroup[]
}

export interface FirewallConfig {
    id: string
    ownerId: string
    projectKey: string
    version: number
    updatedAt: string
    firewallEnabled: boolean
    rules: FirewallRule[]
    ips: FirewallIpRule[]
    changes: unknown[]
    crs?: Record<FirewallCrsCategory, { active: boolean; action: 'deny' | 'log' }>
    managedRules?: Partial<Record<FirewallManagedRuleKey, FirewallManagedRule>>
    botIdEnabled?: boolean
    conditions?: FirewallSharedCondition[]
    rulesets?: unknown
    logHeaders?: string[] | '*'
}

export interface FirewallConfigResponse {
    active: FirewallConfig
    draft: FirewallConfig | null
    versions: FirewallConfig[]
}
