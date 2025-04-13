import type {
    CommonDeploymentMeta,
    CommonDeploymentStatus,
    CommonEnvironment,
    CommonEnvironmentVariable,
    CommonPlan,
    CommonRepositoryLink,
} from './common'
import type { Deployment } from './deployments'

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
    publicSource: null | string
    resourceConfig: {
        functionDefaultRegions: string[]
        functionDefaultRegion: string
        functionDefaultMemoryType: string | 'standard_legacy'
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
    latestDeployments: Deployment[]
    targets: {
        [key: string]: Deployment
    }
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
    deployment: Deployment | null
    domain: string
    environment: CommonEnvironment
    target: 'PRODUCTION'
    gitBranch?: null
    redirect?: null | string
    redirectStatusCode?: number | null
}

interface LatestDeployment {
    alias: string[]
    aliasAssigned: number | null
    builds: any[]
    createdAt: number
    createdIn: string
    creator: {
        uid: string
        email: string
        username: string
        githubLogin?: string
    }
    deploymentHostname: string
    forced: boolean
    id: string
    meta: CommonDeploymentMeta
    name: string
    plan: CommonPlan
    private: boolean
    readyState: CommonDeploymentStatus
    target: CommonEnvironment | null
    teamId: string
    type: 'LAMBDAS' | string
    url: string
    userId: string
    withCache: boolean
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
