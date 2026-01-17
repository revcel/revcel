export interface Log {
    requestId: string
    timestamp: Date
    branch: string
    deploymentId: string
    domain: string
    deploymentDomain: string
    environment: string
    requestPath: string
    route: string
    clientUserAgent: string
    clientRegion: string
    requestSearchParams: Record<string, string>
    requestMethod: string
    cache: string
    statusCode: number
    events: LogEvent[]
    logs: LogLine[]
    requestTags: string[]
}

export interface LogEvent {
    source?: string
    route: string
    pathType: string
    timestamp: Date
    httpStatus: number
    region: string
    cache: string
    functionMaxMemoryUsed: number
    functionMemorySize: number
    durationMs: number
}

export interface LogLine {
    source: string
    level: string
    message: string
    timestamp: Date
}
