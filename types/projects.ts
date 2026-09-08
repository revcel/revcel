import type {
    CommonAliasError,
    CommonDeploymentCreator,
    CommonDeploymentMeta,
    CommonDeploymentReadySubstate,
    CommonDeploymentStatus,
    CommonEnvironment,
    CommonEnvironmentVariable,
    CommonPlan,
    CommonRepositoryLink,
} from './common'

export interface Project {
    accountId: string
    alias: Alias[]
    analytics?: {
        id: string
        enabledAt?: number
        disabledAt?: number
        canceledAt?: number
    }
    autoExposeSystemEnvs: boolean
    autoAssignCustomDomains?: boolean
    autoAssignCustomDomainsUpdatedBy?: 'system' | string
    buildCommand: null | string
    createdAt: number
    devCommand: null | string
    directoryListing: boolean
    env: CommonEnvironmentVariable[]
    framework: 'nextjs' | 'vite' | string | null
    gitForkProtection: boolean
    id: string
    installCommand: null | string
    name: string
    nodeVersion: '22.x' | '20.x' | '18.x' | '16.x' | string | null
    outputDirectory: null | string
    resourceConfig: {
        functionDefaultRegions: string[]
        functionDefaultRegion: string
        functionDefaultMemoryType?: 'performance' | 'performance_xl' | 'standard' | 'standard_legacy'
        functionDefaultTimeout?: number
        fluid?: boolean
        elasticConcurrencyEnabled?: boolean
        buildMachineType?: 'basic' | 'enhanced' | 'standard' | 'turbo'
        buildMachineSelection?: 'elastic' | 'fixed'
        buildMachineElasticReason?: string
    }
    // everything is optional since only 1 user was tested
    defaultResourceConfig?: {
        fluid?: boolean
        functionDefaultRegions?: string[]
        functionDefaultTimeout?: number
        functionDefaultMemoryType?: string
        functionZeroConfigFailover?: boolean
        allowServerlessConcurrency?: boolean
        elasticConcurrencyEnabled?: boolean
    }
    rootDirectory: null | string
    serverlessFunctionRegion: string
    sourceFilesOutsideRootDirectory: boolean
    speedInsights?: {
        id: string
        hasData?: boolean
        enabledAt?: number
        disabledAt?: number
        canceledAt?: number
        dataReceivedAt?: number
    }
    ssoProtection?: {
        deploymentType: string
    } | null
    updatedAt: number
    live: boolean
    gitComments?: {
        onCommit: boolean
        onPullRequest: boolean
    }
    webAnalytics?: {
        id: string
        hasData?: boolean
        enabledAt?: number
        disabledAt?: number
        canceledAt?: number
    }
    link?: CommonRepositoryLink
    latestDeployments: LatestDeployment[]
    targets: {
        [key: string]: LatestDeployment
    }
    rollingRelease?: {
        target: string
        stages?:
            | {
                  targetPercentage: number
                  requireApproval?: boolean
                  duration?: number
              }[]
            | null
        canaryResponseHeader?: boolean
        gate?: {
            enabled: boolean
        }
    }
    usageStatus?: {
        teamThrottled?: boolean
    }
    tier?: 'advanced' | 'critical'
    security?: {
        firewallUpdatedAt: number
        firewallConfigVersion: number
        firewallEnabled: boolean
        ja3Enabled: boolean
        ja4Enabled: boolean
        firewallSeawallEnabled: boolean
        firewallRoutes: FirewallRoute[]
        attackModeEnabled?: boolean
        attackModeEnabledAt?: number
    }
    commandForIgnoringBuildStep?: null | string
    passwordProtection?: null
    transferStartedAt?: number
    transferCompletedAt?: number
    transferredFromAccountId?: string
}

interface Alias {
    configuredBy: 'A' | 'CNAME' | 'http'
    configuredChangedAt: number
    createdAt: number
    deployment: LatestDeployment | null
    domain: string
    environment: CommonEnvironment
    target: 'PRODUCTION'
    gitBranch?: null
    redirect?: null | string
    redirectStatusCode?: number | null
}

/** Reduced deployment shape returned inside `Project.latestDeployments`, `targets` and `alias[].deployment`. */
export interface LatestDeployment {
    id: string
    name: string
    url: string
    deploymentHostname: string
    createdAt: number
    createdIn: string
    creator: CommonDeploymentCreator | null
    plan: CommonPlan
    private: boolean
    readyState: CommonDeploymentStatus
    type: 'LAMBDAS' | string
    alias?: string[]
    aliasAssigned?: number | boolean | null
    aliasError?: CommonAliasError | null
    aliasFinal?: string | null
    automaticAliases?: string[]
    buildingAt?: number
    readyAt?: number
    deletedAt?: number
    requestedAt?: number
    checksState?: 'completed' | 'registered' | 'running'
    checksConclusion?: 'canceled' | 'failed' | 'skipped' | 'succeeded'
    readySubstate?: CommonDeploymentReadySubstate
    target?: CommonEnvironment | null
    teamId?: string | null
    userId?: string
    meta?: CommonDeploymentMeta
    monorepoManager?: string | null
    previewCommentsEnabled?: boolean
    withCache?: boolean
    forced?: boolean
    builds?: any[]
}

interface FirewallRoute {
    has: {
        type: string
        value: {
            sub: string
        }
    }[]
    mitigate: {
        action: string
        rule_id: string
    }
}
