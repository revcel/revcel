export interface Team {
    id: string
    name: string
    slug: string
    avatar: string | null
    createdAt: number
    membership: {
        role: string
        confirmed: boolean
        created: number
        teamId: string
        updatedAt: number
    }
    creatorId: string
    updatedAt: number
    billing: {
        plan: string
        trial: string
    }
    description: string
    profiles: string[]
    stagingPrefix: string
    softBlock: string
    remoteCaching: {
        enabled: boolean
    }
    createdDirectToHobby: boolean
}

export interface Pagination {
    count: number
    next: string | null
    previous: string | null
}

export interface User {
    uid: string
    email: string
    name: string
    username: string
    avatar: string | null
    softBlock: string | null
    remoteCaching: {
        enabled: boolean
    }
    defaultTeamId: string
    plan?: string
}

export interface UserResponse {
    user: User
}

export interface TeamsResponse {
    teams: Team[]
    pagination: Pagination
}

/**
 * Deployment info interface
 */
export interface DeploymentInfo {
    alias: string[]
    aliasAssigned: boolean
    aliasError: string | null
    automaticAliases?: string[]
    bootedAt: number
    buildingAt: number
    buildSkipped: boolean
    createdAt: number
    creator: {
        uid: string
        username: string
        avatar: string
    }
    deletedAt: number | null
    gitSource: {
        ref: string
        repoId: number
        sha: string
        type: string
        prId: number | null
    }
    // errors
    errorCode?: string
    errorMessage?: 'Command "pnpm install" exited with 1'
    errorStep?: 'buildStep'
    id: string
    initReadyAt: number
    name: string
    meta: DeploymentMeta
    project: {
        id: string
        name: string
        framework: string
    }
    public: boolean
    ready: number
    readyState: DeploymentStatus
    readySubstate: Deployment['readySubstate']
    regions: string[]
    source: string
    status: DeploymentStatus
    target?: string
    team: {
        id: string
        name: string
        slug: string
    }
    type: string
    url: string
    version: number
    previewCommentsEnabled: boolean
    lambdas: {
        id: string
        createdAt: number
        entrypoint: string
        readyState: DeploymentStatus
        readyStateAt: number
        output: {
            path: string
            functionName: string
        }
    }[]
    aliasAssignedAt: number
    build: {
        env: string[]
    }
    builds: any[]
    createdIn: string
    crons: any[]
    env: string[]
    functions: any
    inspectorUrl: string
    isInConcurrentBuildsQueue: boolean
    isInSystemBuildsQueue: boolean
    ownerId: string
    plan: string
    projectId: string
    projectSettings: {
        buildCommand: string
        devCommand: string | null
        framework: string
        commandForIgnoringBuildStep: string | null
        installCommand: string | null
        outputDirectory: string | null
        speedInsights: {
            id: string
            hasData: boolean
        }
        webAnalytics: {
            id: string
        }
    }
    routes: any
    images: {
        domains: any[]
        sizes: number[]
        remotePatterns: {
            protocol: string
            hostname: string
            pathname: string
        }[]
        minimumCacheTTL: number
        formats: string[]
        dangerouslyAllowSVG: boolean
        contentSecurityPolicy: string
        contentDispositionType: string
    }
}

export interface DeploymenInfoWithDomains extends DeploymentInfo {
    domains: DeploymentDomain | null
}

/**
 * Deployment build log interface
 * @interface DeploymentBuildLog
 */
export interface DeploymentBuildLog {
    created: number
    date: number
    deploymentId: string
    id: string
    text: string
    type: 'stdout' | 'stderr' | 'stdwarn'
    serial: string
    info: {
        type: string
        name: string
        entrypoint: string
    }
    level?: string
}

export type DeploymentBuildLogsResponse = DeploymentBuildLog[]

/**
 * Deployment interface
 * @interface Deployment
 */
export interface Deployment {
    uid: string
    name: string
    url: string
    created: number
    source: string
    state: DeploymentStatus
    readyState: DeploymentStatus
    readySubstate: 'PROMOTED' | 'STAGED' | 'ERROR'
    type: string
    creator: {
        uid: string
        email: string
        username: string
        githubLogin?: string
    }
    inspectorUrl: string
    meta: DeploymentMeta
    target: string
    aliasError: string | null
    aliasAssigned: number
    isRollbackCandidate: boolean
    createdAt: number
    buildingAt: number
    ready: number
    projectSettings: {
        commandForIgnoringBuildStep: string | null
    }
}

export interface DeploymentEnvironment {
    alias: string[]
    aliasAssigned: number
    aliasError: string | null
    automaticAliases: string[]
    builds: any[]
    createdAt: number
    createdIn: string
    creator: {
        uid: string
        email: string
        username: string
        githubLogin: string
    }
    deploymentHostname: string
    forced: boolean
    id: string
    meta: Deployment['meta']
    name: string
    plan: string
    private: boolean
    readyState: string
    readySubstate: string
    target: string | null
    teamId: string
    type: string
    url: string
    userId: string
    withCache: boolean
    buildingAt: number
    readyAt: number
    previewCommentsEnabled: boolean
}

export interface LatestDeployment {
    alias: string[]
    aliasAssigned: number
    builds: any[]
    createdAt: number
    createdIn: string
    creator: DeploymentCreator
    deploymentHostname: string
    forced: boolean
    id: string
    meta: DeploymentMeta
    name: string
    plan: 'hobby' | 'pro' | 'enterprise'
    private: boolean
    readyState: DeploymentStatus
    target: 'production' | 'preview' | 'development'
    teamId: string
    type: 'LAMBDAS' | string
    url: string
    userId: string
    withCache: boolean
}

export interface DeploymentCreator {
    uid: string
    email: string
    username: string
}

export interface DeploymentMeta {
    githubCommitAuthorName: string
    githubCommitMessage: string
    githubCommitOrg: string
    githubCommitRef: string
    githubCommitRepo: string
    githubCommitSha: string
    githubDeployment: string
    githubOrg: string
    githubRepo: string
    githubRepoOwnerType: string
    githubCommitRepoId: string
    githubRepoId: string
    githubRepoVisibility: string
    deployHookId: string
    deployHookRef: string
    deployHookName: string
    branchAlias: string
}

export type DeploymentStatus = 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED'

export interface ProjectEnvironmentVariable {
    key: string
    target: string[]
    configurationId: string | null
    createdAt: number
    updatedAt: number
    createdBy: string
    updatedBy: string | null
    id: string
    type: string
    value: string
}

export interface DeploymentsResponse {
    deployments: Deployment[]
    pagination: Pagination
}

/**
 * Project interface
 * @interface Project
 */

export interface Project {
    accountId: string
    speedInsights: {
        id: string
        hasData: boolean
    }
    autoExposeSystemEnvs: boolean
    autoAssignCustomDomains: boolean
    autoAssignCustomDomainsUpdatedBy: string | null
    buildCommand: string
    createdAt: number
    crons: {
        enabledAt: number
        disabledAt: number | null
        updatedAt: number
        deploymentId: string
        definitions: any[]
    }
    dataCache: {
        userDisabled: boolean
        unlimited: boolean
    }
    devCommand: string | null
    directoryListing: boolean
    env: ProjectEnvironmentVariable[]
    framework: string
    gitForkProtection: boolean
    gitLFS: boolean
    id: string
    installCommand: string | null
    lastRollbackTarget: string | null
    lastAliasRequest: string | null
    name: string
    nodeVersion: string
    outputDirectory: string | null
    publicSource: string | null
    resourceConfig: {
        functionDefaultRegion: string
        functionDefaultMemoryType: string
    }
    rootDirectory: string | null
    serverlessFunctionRegion: string
    sourceFilesOutsideRootDirectory: boolean
    ssoProtection: string | null
    updatedAt: number
    live: boolean
    gitComments: {
        onCommit: boolean
        onPullRequest: boolean
    }
    webAnalytics: {
        id: string
        enabledAt: number
    }
    security: {
        attackModeEnabled: boolean
        attackModeUpdatedAt: number
    }
    link?: {
        type: string
        repo: string
        repoId: number
        org: string
        gitCredentialId: string
        productionBranch: string
        sourceless: boolean
        createdAt: number
        updatedAt: number
        deployHooks: any[]
    }
    latestDeployments: LatestDeployment[]
    targets: Record<string, DeploymentEnvironment>
}

export interface ProjectsResponse {
    projects: Project[]
    pagination: Pagination
}

export interface ProjectResponse {
    project: Project
}

export type AnalyticType =
    | 'path'
    | 'referrer'
    | 'referrer_hostname'
    | 'country'
    | 'client_name'
    | 'os_name'
    | 'event_name'
    | 'event_property'
    | 'event_property_value'
    | 'event_data'
    | 'query_params'
    | 'hostname'
    | 'route'
    | 'flags'
    | 'device_type'

export interface Analytic {}

export interface AnalyticResponse {
    analytics: Analytic[]
    pagination: Pagination
}

export interface AnalyticTypeResponse {
    types: AnalyticType[]
}
/**
 * Domain interface
 * @interface Domain
 */

interface DomainVerification {
    type: 'CNAME' | 'A' | 'TXT'
    domain: string
    value: string
    reason: string
}
export interface Domain {
    name: string
    apexName: string
    projectId: string
    redirect?: string | null
    redirectStatusCode?: number | null
    gitBranch: string
    customEnvironmentId: string | null
    updatedAt: number
    createdAt: number
    verified: boolean
    verification?: DomainVerification[]
}

export interface DomainsErrorResponse {
    error: {
        code:
            | 'existing_project_domain'
            | 'not_found'
            | 'unknown'
            | 'missing_txt_record'
            | 'pending_verification'
            | 'conflict_dns_records'
            | 'invalid_configuration'
            | 'ok'
        message: string
    }
}

export type DomainSuccessResponse = Domain

export type DomainResponse = DomainsErrorResponse | DomainSuccessResponse
export type DomainsResponse = {
    domains: Domain[]
    pagination: Pagination
}

/**
 * Domain config interface
 */

export interface DomainConfigResponse {
    configuredBy: string | null
    nameservers: string[]
    serviceType: string
    cnames: string[]
    aValues: string[]
    conflicts: { name: string; type: string; value: string }[]
    acceptedChallenges: string[]
    misconfigured: boolean
}

export type DomainVerificationStatusMessage =
    | 'Valid Configuration'
    | 'Invalid Configuration'
    | 'Conflicting DNS Records'
    | 'Pending Verification'
    | 'Domain Not Found'
    | 'Existing Project Domain'
    | 'Missing TXT Record'
    | 'Unknown Error'

export interface DomainVerificationStatus {
    case: DomainVerificationStatusMessage
    message: string
    code: DomainsErrorResponse['error']['code']
}

export interface GetDomainsResponse {
    domains: {
        domainJson: Domain
        configJson: DomainConfigResponse
        status: DomainVerificationStatus
    }[]
    pagination: Pagination
}

/**
 * Environment variable interface
 */

export interface EnvironmentVariable {
    key: string
    target: ('preview' | 'production' | 'development')[]
    configurationId: string | null
    createdAt: number
    updatedAt: number
    createdBy: string
    updatedBy: string | null
    id: string
    type: 'encrypted'
    value: string
    decrypted: boolean
    lastEditedByDisplayName?: string
}

export interface EnvironmentVariablesResponse {
    envs: EnvironmentVariable[]
}
/**
 * Request log interface
 */
export interface RequestLog {
    requestId: string
    timestamp: string
    branch: string
    deploymentId: string
    domain: string
    deploymentDomain: string
    environment: string
    requestPath: string
    route: string
    clientUserAgent: string
    requestSearchParams: Record<string, string>
    requestMethod: string
    cache: string
    statusCode: number
    events: {
        source: string
        route: string
        pathType: string
        timestamp: string
        httpStatus: number
        region: string
        cache: string
        functionMaxMemoryUsed: number
        functionMemorySize: number
        durationMs: number
    }[]
    logs: {
        timestamp: string
        level: string
        message: string
        source: string
    }[]
    requestTags: string[]
}

export interface RequestLogsResponse {
    rows: RequestLog[]
    hasMoreRows: boolean
}

export interface RequestLogFilters {
    timeline?: '30m' | '1h' | '1d' | '3d'
    level?: string
    environment?: string | null
    myLogs?: boolean
}
export interface DeploymentDomain {
    commit: string
    branch?: string
    aliases: string[]
}

type SimpleDeployment = Omit<Deployment, 'creator' | 'alias'>

export interface ProductionDeployment extends SimpleDeployment {
    creator: {
        uid: string
        username: string
    }
}

export interface ProductionDeploymentResponse {
    deployment: ProductionDeployment
    domain: Omit<Domain, 'verifications'>
    deploymentIsStale: boolean
    rollbackDescription: string | null
}
