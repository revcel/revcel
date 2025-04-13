export interface Domain {
    name: string
    apexName: string
    projectId: string
    redirect?: string | null
    redirectStatusCode?: 307 | 301 | 302 | 308 | null
    gitBranch: string
    customEnvironmentId: string | null
    updatedAt: number
    createdAt: number
    verified: boolean
    verification?: DomainVerification[]
}

interface DomainVerification {
    type: 'CNAME' | 'A' | 'TXT'
    domain: string
    value: string
    reason: string
}

export interface DomainConfig {
    configuredBy: string | null
    nameservers: string[]
    serviceType: string
    cnames: string[]
    aValues: string[]
    conflicts: { name: string; type: string; value: string }[]
    acceptedChallenges: string[]
    misconfigured: boolean
}
