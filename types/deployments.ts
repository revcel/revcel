import type {
    CommonDeploymentMeta,
    CommonDeploymentStatus,
    CommonEnvironment,
    CommonPlan,
} from './common'

export interface Deployment {
    alias: string[]
    aliasAssigned: boolean
    aliasError: null
    automaticAliases: string[]
    bootedAt: number
    buildingAt: number
    buildSkipped: boolean
    createdAt: number
    creator: {
        uid: string
        email: string
        username: string
        githubLogin?: string
    }
    deletedAt: null
    gitSource: {
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
    readySubstate: string | 'PROMOTED' | 'STAGED' | 'ERROR'
    regions: string[]
    source: string
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
    userId: string
    withCache: boolean
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
    speedInsights: {
        id: string
        hasData: boolean
    }
    webAnalytics: {
        id: string
    }
}

export interface DeploymentBuildLog {
    created: number
    date: number
    deploymentId: string
    id: string
    text: string
    type: 'stdout' | 'stderr'
    serial: string
    info: {
        type: 'build' | string
        name: string
        entrypoint: string
    }
}

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
