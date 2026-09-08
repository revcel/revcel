import type {
    CommonAliasError,
    CommonAliasWarning,
    CommonDeploymentCreator,
    CommonDeploymentMeta,
    CommonDeploymentReadySubstate,
    CommonDeploymentSource,
    CommonDeploymentStatus,
    CommonEnvironment,
    CommonPlan,
} from './common'

export interface Deployment {
    alias: string[]
    aliasAssigned: boolean
    aliasError?: CommonAliasError | null
    aliasWarning?: CommonAliasWarning | null
    errorCode?: string
    errorMessage?: string | null
    automaticAliases: string[]
    bootedAt: number
    buildingAt: number
    buildSkipped: boolean
    createdAt: number
    creator: CommonDeploymentCreator
    deletedAt: null
    gitSource?: {
        ref: string
        repoId: number
        sha: string
        type: string
        prId: null
    }
    id: string
    initReadyAt: number
    isFirstBranchDeployment: boolean
    name: string
    meta: CommonDeploymentMeta
    originCacheRegion: string
    project: {
        id: string
        name: string
        framework: string
    }
    public: boolean
    ready: number
    readyState: CommonDeploymentStatus
    readySubstate?: CommonDeploymentReadySubstate
    regions: string[]
    source?: CommonDeploymentSource
    status: string
    target: CommonEnvironment | null
    team: {
        id: string
        name: string
        slug: string
    }
    type: 'LAMBDAS' | string
    url: string
    version: number
    previewCommentsEnabled: boolean
    lambdas: {
        id: string
        createdAt: number
        entrypoint: string
        readyState: string
        readyStateAt: number
        output: {
            path: string
            functionName: string
        }[]
    }[]
    aliasAssignedAt: number
    build: {
        env: string[]
    }
    builds: any[]
    createdIn: string
    crons: any[]
    env: string[]
    functions: null
    inspectorUrl: string
    isInConcurrentBuildsQueue: boolean
    isInSystemBuildsQueue: boolean
    ownerId: string
    plan: CommonPlan
    projectId: string
    projectSettings: ProjectSettings
    routes: null
    images: DeploymentImages
    forced: boolean
    teamId: string
    private: boolean
    deploymentHostname: string
    userId?: string
    withCache: boolean
    isInstantStatic?: boolean
    services?: DeploymentService[]
    resourceConfig?: {
        buildMachine?: {
            purchaseType?: 'basic' | 'enhanced' | 'standard' | 'turbo'
            defaultPurchaseType?: string
            machineSelectionType?: string
            selectionSource?: string
            cores?: number
            memory?: number
        }
    }
    config?: {
        version?: number
        functionType: 'fluid' | 'standard'
        functionMemoryType: 'performance' | 'performance_xl' | 'standard' | 'standard_legacy'
        functionTimeout: number | null
        secureComputePrimaryRegion?: string | null
        secureComputeFallbackRegion?: string | null
        isUsingActiveCPU?: boolean
    }
    customEnvironment?: {
        id: string
        slug?: string
    }
}

export interface DeploymentService {
    name: string
    type?: string
    framework?: string | null
    runtime?: string
    root?: string
    entrypoint?: string
}

/** Item shape of `GET /v6/deployments`. Note the `uid` instead of `id`. */
export interface DeploymentListItem {
    uid: string
    name: string
    url: string
    projectId: string
    created: number
    createdAt: number
    readyState: CommonDeploymentStatus
    state?: CommonDeploymentStatus
    readySubstate?: CommonDeploymentReadySubstate
    source?: CommonDeploymentSource
    target?: CommonEnvironment | null
    creator: CommonDeploymentCreator
    meta?: CommonDeploymentMeta
    inspectorUrl: string | null
    aliasError?: CommonAliasError | null
    aliasAssigned?: number | boolean | null
    errorCode?: string
    errorMessage?: string | null
    checksState?: 'completed' | 'registered' | 'running'
    checksConclusion?: 'canceled' | 'failed' | 'skipped' | 'succeeded'
    buildingAt?: number
    ready?: number
}

interface DeploymentImages {
    domains: any[]
    sizes: number[]
    remotePatterns: any[]
    minimumCacheTTL: number
    formats: string[]
    dangerouslyAllowSVG: boolean
    contentSecurityPolicy: string
    contentDispositionType: string
}

export type DeploymentBuildAsset = DeploymentFile | DeploymentDirectory

export interface DeploymentDirectory {
    type: 'directory'
    name: string
}

export interface DeploymentFile {
    type: 'file'
    name: string
    link: string
    mime?: string
}

interface ProjectSettings {
    buildCommand: null | string
    devCommand: null | string
    framework: null | string
    commandForIgnoringBuildStep: null | string
    installCommand: null | string
    outputDirectory: null | string
    speedInsights?: {
        id: string
        hasData?: boolean
        enabledAt?: number
        disabledAt?: number
        canceledAt?: number
        dataReceivedAt?: number
        paidAt?: number
    }
    webAnalytics?: {
        id: string
        hasData?: boolean
        enabledAt?: number
        disabledAt?: number
        canceledAt?: number
    }
}

/** Build log line from `GET /v3/deployments/{id}/events` */
export interface DeploymentBuildLog {
    created: number
    date: number
    deploymentId: string
    id: string
    text: string
    type:
        | 'stdout'
        | 'stderr'
        | 'stdwarn'
        | 'command'
        | 'delimiter'
        | 'deployment-state'
        | 'exit'
        | 'fatal'
        | 'metric'
        | 'middleware'
        | 'report'
        | (string & {})
    serial: string
    info: {
        type: 'build' | string
        name: string
        entrypoint?: string
        path?: string
        step?: string
        readyState?: string
        // set for monorepo / multi-service deployments
        serviceName?: string
    }
    level?: 'error' | 'warning'
}

/** Emitted once the deployment's aliases are assigned. Has no `text` or `created`. */
export interface DeploymentAliasAssignedEvent {
    type: 'alias-assigned'
    deploymentId: string
    date: number
    alias: string[]
    aliasError: CommonAliasError | null
    aliasWarning: CommonAliasWarning | null
}

export type DeploymentEvent = DeploymentBuildLog | DeploymentAliasAssignedEvent

export interface DeploymentBuildMetadata {
    version: number
    framework: string
    frameworkVersion: string
    staticAssets: StaticAsset[]
    serverlessFunctions: ServerlessFunction[]
    edgeFunctions: any[]
    edgeMiddleware: any[]
    deployStepStart: number
    deployStepTime: number
}

interface ServerlessFunction {
    path: string
    type: string
    size: number
    regions: string[]
    runtime: string
    sourcePath?: string
}

interface StaticAsset {
    path: string
    type: 'HTML' | 'JS' | 'Image' | 'Misc' | string
    size: number
}

export interface DeploymentBuild {
    id: string
    deploymentId: string
    entrypoint: string
    readyState: string
    readyStateAt: number
    createdAt: number
    createdIn: string
    use: string
    config: {
        framework: string
        nodeVersion: string
        projectCreatedAt: number
        vercelConfig: Record<string, any>
    }
    middleware: any[]
    output: DeploymentBuildOutput[]
    fingerprint: null | any
}

export interface DeploymentBuildOutput {
    prerender: Record<string, any> | null
    type: 'lambda' | 'edge' | string
    path: string
    digest: string
    mode: number
    size: number
    lambda: {
        functionName: string
        deployedTo: string[]
        runtime: string
        memorySize: number
        timeout: number
    } | null
    edge: null | any
}
