export interface CommonBilling {
    address: {
        city: string | null
        state: string | null
        country: string | null
        line1: string | null
        postalCode: string | null
    } | null
    cancelation: null
    email: string | null
    language: null
    name: string | null
    platform: string
    period: null
    plan: string | 'pro'
    tax: null
    currency: string
    trial: null | boolean
    status: string | 'active'
    invoiceItems: Record<string, Record<string, any>> | null
}

export type CommonPlan = 'pro' | 'hobby' | 'enterprise'

export type CommonEnvironment = 'production' | 'preview' | 'development'

export type CommonDeploymentStatus =
    | 'READY'
    | 'ERROR'
    | 'BUILDING'
    | 'QUEUED'
    | 'CANCELED'
    | 'INITIALIZING'

export interface CommonDeploymentMeta {
    githubCommitAuthorLogin?: string
    githubCommitAuthorName?: string
    githubCommitMessage?: string
    githubCommitOrg?: string
    githubCommitRef?: string
    githubCommitRepo?: string
    githubCommitSha?: string
    githubDeployment?: string
    githubOrg?: string
    githubRepo?: string
    githubRepoOwnerType?: 'User' | 'Organization'
    githubCommitRepoId?: string
    githubRepoId?: string
    githubRepoVisibility?: 'private' | 'public'
    deployHookId?: string
    deployHookRef?: string
    deployHookName?: string
    branchAlias?: string
    action?: string
    originalDeploymentId?: string
    githubPrId?: string
    gitDirty?: string
}

export interface CommonEnvironmentVariable {
    target: CommonEnvironment[]
    configurationId: null | string
    customEnvironmentIds?: string[]
    id: string
    key: string
    createdAt: number
    updatedAt: number
    createdBy: string
    updatedBy: string | null
    type: 'encrypted' | 'sensitive'
    value: string
    decrypted?: boolean
    lastEditedByDisplayName?: string
    comment?: string
    gitBranch?: string
}

export interface CommonRepositoryLink {
    type: 'github' | string
    repo: string
    repoId: number
    org: string
    repoOwnerId?: number
    gitCredentialId: string
    productionBranch: string
    sourceless?: boolean
    createdAt: number
    updatedAt: number
    deployHooks: CommonDeployHook[]
}

export interface CommonDeployHook {
    createdAt: number
    id: string
    name: string
    ref: string
    url: string
}

export interface CommonPagination {
    count: number
    next: string | null
    prev: string | null
}

export interface CommonApiStatus {
    id: string
    created_at: Date
    impact: string
    impact_override: string
    monitoring_at: Date
    name: string
    resolved_at: Date | null
    shortlink: string
    status: string
    updated_at: Date
}
