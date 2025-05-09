import vercel from '@/lib/vercel'
import { usePersistedStore } from '@/store/persisted'
import type {
    CommonApiStatus,
    CommonDeploymentStatus,
    CommonEnvironmentVariable,
    CommonPagination,
} from '@/types/common'
import type {
    Deployment,
    DeploymentBuild,
    DeploymentBuildAsset,
    DeploymentBuildMetadata,
} from '@/types/deployments'
import type { Domain, DomainConfig } from '@/types/domains'
import type { Log } from '@/types/logs'
import type { DeploymentBuildLog } from '@/types/old'
import type { Project } from '@/types/projects'
import type { Team } from '@/types/teams'
import type { User } from '@/types/user'
import type { Webhook } from '@/types/webhooks'
import ms from 'ms'

function roundToGranularity(
    date: Date,
    granularity: '5m' | '1h',
    mode: 'up' | 'down' = 'up'
): Date {
    // if granularity is 5m, we need to round to the nearest 5m
    // if granularity is 1h, we need to round to the nearest hour

    const granularityMs = granularity === '5m' ? 5 * ms('1m') : ms('1h')
    const rounded = Math.floor(date.getTime() / granularityMs) * granularityMs

    if (mode === 'up') {
        return new Date(rounded)
    }
    return new Date(rounded - granularityMs)
}

export async function fetchApiStatus() {
    try {
        const response = await vercel.get<CommonApiStatus[]>('/status')
        return response
    } catch (error) {
        console.log('[Error] Error fetching API status', error)
        throw error
    }
}

export async function fetchUserInfo({ connectionId }: { connectionId?: string } = {}) {
    console.log('fetchUserInfo')

    try {
        const response = await vercel.get<{ user: User }>('/www/user', undefined, connectionId)
        console.log('User info', response)

        return response.user
    } catch (e) {
        const error = e as Error
        console.log('Error fetching user info', error)
        throw error
    }
}

export async function fetchAllTeams({
    flags = false,
    permissions = false,
    connectionId,
}: {
    flags?: boolean
    permissions?: boolean
    connectionId?: string
} = {}) {
    const params = new URLSearchParams()

    if (flags) {
        params.append('flags', flags.toString())
    }
    if (permissions) {
        params.append('permissions', permissions.toString())
    }

    console.log('[fetchAllTeams] params', params.toString())

    try {
        const response = await vercel.get<{ teams: Team[] }>(
            `/teams?${params.toString()}`,
            undefined,
            connectionId
        )
        return response
    } catch (error) {
        console.log('[fetchAllTeams] Error fetching teams', error)
        throw error
    }
}

export async function fetchTeamAvatar({
    connectionId,
    teamId,
}: { connectionId?: string; teamId?: string } = {}) {
    let currentConnection

    if (connectionId) {
        currentConnection = usePersistedStore
            .getState()
            .connections.find((connection) => connection.id === connectionId)
    } else {
        currentConnection = usePersistedStore.getState().currentConnection
    }

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = teamId || currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        const response = await fetch(`https://vercel.com/api/www/avatar?teamId=${currentTeamId}`, {
            headers: {
                Authorization: `Bearer ${currentConnection.apiToken}`,
            },
        })
        const svgText = await response.text()

        // Use btoa for base64 encoding in React Native
        const base64 = btoa(svgText)
        const imageUri = `data:image/svg+xml;base64,${base64}`

        return imageUri
    } catch (error) {
        console.log('[Error] Error fetching user avatar', error)
        throw error
    }
}

export async function fetchTeamProjects(
    {
        from,
        limit,
        latestDeployments, // number of latest deployments to fetch
    }: {
        from?: number
        limit?: number
        latestDeployments: number
    } = {
        latestDeployments: 5,
    }
) {
    console.log('Fetching projects with', { limit, from, latestDeployments })
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
        latestDeployments: latestDeployments.toString(),
    })

    if (limit) {
        params.append('limit', limit.toString())
    }
    if (from) {
        params.append('from', from.toString())
    }

    try {
        const response = await vercel.get<Project[]>(`/projects?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${currentConnection.apiToken}`,
            },
        })
        return response
    } catch (error) {
        console.log('[Error] Error fetching projects', error)
        throw error
    }
}

export async function fetchTeamProjectFavicon({ projectId }: { projectId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }
    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    const readyDeployments = await fetchTeamDeployments({
        projectId,
        state: ['READY'],
        limit: 1,
    })

    //! see VERCEL.md/API
    //! some api endpoints return `id` others `uid`, this one is `uid`
    //! thx G
    // @ts-ignore
    const deploymentId = readyDeployments?.deployments?.[0].uid

    if (!deploymentId) return null

    try {
        const response = await fetch(
            `https://vercel.com/api/v0/deployments/${deploymentId}/favicon?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${currentConnection.apiToken}`,
                },
            }
        )

        if (response.status !== 200) return null

        return response.url
    } catch (error) {
        console.log('[Error] Error fetching deployment favicon', error)
        throw error
    }
}

/* DEPLOYMENTS */
export async function fetchTeamDeployments(
    {
        limit,
        target,
        withGitRepoInfo,
        state,
        projectId,
    }: {
        limit?: number
        target?: 'production' | 'preview'
        withGitRepoInfo?: boolean
        state?: CommonDeploymentStatus[]
        projectId?: string
    } = { withGitRepoInfo: true }
) {
    console.log('fetchTeamDeployments')
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    if (limit) {
        params.append('limit', limit.toString())
    }

    if (target) {
        params.append('target', target)
    }

    if (state) {
        params.append('state', state.join(','))
    }

    if (projectId) {
        params.append('projectId', projectId)
    }

    if (withGitRepoInfo) {
        params.append('withGitRepoInfo', withGitRepoInfo.toString())
    }

    console.log('[fetchTeamDeployments] params', params.toString())

    try {
        const response = await vercel.get<{
            deployments: Deployment[]
            pagination: {
                count: number
                next: string | null
                previous: string | null
            }
        }>(`/v6/deployments?${params.toString()}`)
        return response
    } catch (error) {
        console.log('[fetchTeamDeployments]  Error fetching deployments', error)
        throw error
    }
}

export async function fetchProductionDeployment({ projectId }: { projectId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    try {
        const response = await vercel.get<{
            deployment: Deployment
            deploymentIsStale: boolean
            rollbackDescription: null | any
        }>(`/projects/${projectId}/production-deployment?${params.toString()}`)
        return response
    } catch (error) {
        console.log('[Error] Error fetching production deployment', error)
        throw error
    }
}

export async function fetchTeamDeployment({ deploymentId }: { deploymentId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
        includeDeleted: 'true',
    })

    try {
        const response = await vercel.get<Deployment>(
            // this one *needs* to have the v13 prefix
            // otherwise we get less fields
            `/v13/deployments/${deploymentId}?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[Error] deploymentId', deploymentId)
        console.log('[Error] Error fetching deployment (wtf)', error)
        throw error
    }
}

export async function fetchTeamDeploymentBuildMetadata({
    deployment,
}: { deployment: Deployment | Project['latestDeployments'][number] }) {
    try {
        const deployMetadata =
            deployment.readyState === 'READY'
                ? await fetchTeamDeploymenBuildOutputs({
                      deploymentId: deployment.id,
                  })
                : undefined

        const buildFunctions =
            deployment.readyState === 'READY'
                ? await fetchTeamDeploymentBuildFunctions({
                      deploymentId: deployment.id,
                  })
                : undefined

        const buildLogs = await fetchTeamDeploymenBuildLogs({ deploymentId: deployment.id })

        const sourceFileTree = await fetchTeamDeploymenBuildFileTree({
            deploymentUrl: deployment.url,
            base: 'src',
        })

        const outputFileTree =
            deployment.readyState === 'READY'
                ? await fetchTeamDeploymenBuildFileTree({
                      deploymentUrl: deployment.url,
                      base: 'out',
                  })
                : undefined

        return {
            deployMetadata,
            buildLogs,
            buildFunctions,
            sourceFileTree,
            outputFileTree,
        }
    } catch (error) {
        console.log('[Error] Error fetching deployment build metadata', error)
        throw error
    }
}

async function fetchTeamDeploymenBuildOutputs({ deploymentId }: { deploymentId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    try {
        const response = await vercel.get<DeploymentBuildMetadata>(
            `/deployments/${deploymentId}/files/outputs?${params.toString()}&file=../deploy_metadata.json`
        )

        return response
    } catch (error) {
        console.log('[Error] Error fetching deployment build outputs', error)
        // throw error
    }
}

async function fetchTeamDeploymentBuildFunctions({ deploymentId }: { deploymentId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    try {
        const response = await vercel.get<{ builds: DeploymentBuild[] }>(
            `/deployments/${deploymentId}/builds?${params.toString()}&file=../deploy_metadata.json`
        )

        return response?.builds?.[0]?.output.sort((a, b) => a.path.localeCompare(b.path))
    } catch (error) {
        console.log('[Error] Error fetching deployment build outputs', error)
        throw error
    }
}

async function fetchTeamDeploymenBuildLogs({ deploymentId }: { deploymentId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    try {
        const response = await vercel.get<DeploymentBuildLog[]>(
            // this one *needs* to have the v3 prefix
            // otherwise we get a "infinite loop detected" error
            `/v3/deployments/${deploymentId}/events?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[Error] Error fetching deployment logs', error)
        throw error
    }
}

export async function fetchTeamDeploymenBuildFileTree({
    deploymentUrl,
    base,
    // might not work if you are using a framework that doesn't use "OUT"
}: { deploymentUrl: string; base: 'src' | 'out' | string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
        base: base,
    })

    try {
        const response = await vercel.get<DeploymentBuildAsset[]>(
            `/file-tree/${deploymentUrl}?${params.toString()}`
        )

        return response
    } catch (error) {
        console.log('[Error] Error fetching deployment file tree for base', base, error)
        throw error
    }
}

export async function fetchTeamDeploymentScreenshot({ deploymentId }: { deploymentId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        const response = await fetch(
            `https://vercel.com/api/screenshot?dark=0&deploymentId=${deploymentId}&teamId=${currentTeamId}&withStatus=1`,
            {
                headers: {
                    Authorization: `Bearer ${currentConnection.apiToken}`,
                },
            }
        )

        if (response.status !== 200) {
            throw new Error('Error fetching deployment screenshot')
        }

        return response.url
    } catch (error) {
        console.log('[Error] Error fetching deployment screenshot', error)
        throw error
    }
}

/* FIREWALL */
export async function fetchProjectFirewallRules({ projectId }: { projectId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        projectId,
        teamId: currentTeamId,
    })

    try {
        const response = await vercel.get<{
            active: {
                version: number
                crs: {
                    [key: string]: {
                        active: boolean
                        action: string
                    }
                }
                rules: {
                    name: string
                    active: boolean
                    description: string
                    action: {
                        mitigate: {
                            redirect: string | null
                            action: string
                            rateLimit: string | null
                            actionDuration: string | null
                        }
                    }
                    id: string
                    conditionGroup: {
                        conditions: {
                            type: string
                            op: string
                            value: string
                        }[]
                    }[]
                }[]
                ips: string[]
                firewallEnabled: boolean
                ownerId: string
                changes: any[]
                updatedAt: string
                id: string
                projectKey: string
            } | null
            draft: null | any
            versions: any[]
        }>(`/v1/security/firewall/config?${params.toString()}`)

        return response
    } catch (error) {
        console.log('[Error] Error fetching firewall rules', error)
        throw error
    }
}

export async function fetchProjectFirewallMetrics({
    projectId,
    summaryOnly = false,
}: { projectId: string; summaryOnly?: boolean }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const endTime = roundToGranularity(new Date(), '5m', 'down').toISOString()
    const startTime = roundToGranularity(new Date(Date.now() - ms('24h')), '5m', 'up').toISOString()

    try {
        const response = await vercel.post<{
            data: {
                value: number
                timestamp: string
                wafRuleId: '' | 'sys_dos_mitigation' | string
                wafAction: '' | 'deny' | 'challenge'
            }[]
            statistics: {
                bytesRead: number
                rowsRead: number
                dbTimeSeconds: number
            }
            summary: {
                wafRuleId: '' | 'sys_dos_mitigation' | string
                wafAction: '' | 'allow' | 'deny' | 'challenge'
                value: number
            }[]
        }>(`/observability/metrics?ownerId=${currentTeamId}`, {
            event: 'firewallAction',
            reason: 'firewall_tab',
            rollups: {
                value: {
                    measure: 'count',
                    aggregation: 'sum',
                },
            },
            granularity: {
                minutes: 5,
            },
            groupBy: ['wafRuleId', 'wafAction'],
            limit: 500,
            tailRollup: 'truncate',
            summaryOnly: summaryOnly,
            startTime,
            endTime,
            scope: {
                type: 'project',
                ownerId: currentTeamId,
                projectIds: [projectId],
            },
        })

        return response?.summary || null
    } catch (error) {
        console.log('[Error] Error fetching firewall metrics', error)
        throw error
    }
}

/* OBSERVABILITY */
export async function fetchObservabilityTTFB({
    projectId,
    summaryOnly = false,
}: {
    projectId: string
    summaryOnly?: boolean
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    console.log('projectId', projectId)

    try {
        const response = await vercel.post<{
            data: {
                avgTtfb: number
                p75Ttfb: number
                p95Ttfb: number
                timestamp: string // ISO string
            }
            statistics: {
                bytesRead: number
                rowsRead: number
                dbTimeSeconds: number
            }
            summary: {
                avgTtfb: number
                p75Ttfb: number
                p95Ttfb: number
            }[]
        }>(`/observability/metrics?ownerId=${currentTeamId}`, {
            event: 'serverlessFunctionInvocation',
            rollups: {
                avgTtfb: {
                    measure: 'ttfbMs',
                    aggregation: 'avg',
                },
                p75Ttfb: {
                    measure: 'ttfbMs',
                    aggregation: 'p75',
                },
                p95Ttfb: {
                    measure: 'ttfbMs',
                    aggregation: 'p95',
                },
            },
            tailRollup: 'truncate',
            summaryOnly: summaryOnly,
            scope: {
                type: 'project',
                ownerId: currentTeamId,
                projectIds: [projectId],
            },
            reason: 'observability_chart_free',
            granularity: {
                minutes: 5,
            },
            endTime: roundToGranularity(new Date(), '5m', 'down').toISOString(),
            startTime: roundToGranularity(
                new Date(Date.now() - ms('12h')),
                '5m',
                'up'
            ).toISOString(),
            filter: "environment eq 'production'",
        })

        return response.summary?.[0] || null
    } catch (error) {
        console.log('[Error] Error fetching observability TTFB', error)
        throw error
    }
}

export async function fetchObservabilityCpuThrottle({
    projectId,
    summaryOnly = false,
}: {
    projectId: string
    summaryOnly?: boolean
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        const response = await vercel.post<{
            data: {
                cpuThrottleMsAvg: number
                cpuThrottleMsP75: number
                cpuThrottleMsP95: number
                timestamp: string // ISO string
            }[]
            statistics: {
                bytesRead: number
                rowsRead: number
                dbTimeSeconds: number
            }
            summary: {
                cpuThrottleMsAvg: number
                cpuThrottleMsP75: number
                cpuThrottleMsP95: number
            }[]
        }>(`/observability/metrics?ownerId=${currentTeamId}`, {
            event: 'serverlessFunctionInvocation',
            rollups: {
                cpuThrottleMsAvg: {
                    measure: 'concurrencyThrottleMs',
                    aggregation: 'avg',
                },
                cpuThrottleMsP75: {
                    measure: 'concurrencyThrottleMs',
                    aggregation: 'p75',
                },
                cpuThrottleMsP95: {
                    measure: 'concurrencyThrottleMs',
                    aggregation: 'p95',
                },
            },
            tailRollup: 'truncate',
            summaryOnly: summaryOnly,
            scope: {
                type: 'project',
                ownerId: currentTeamId,
                projectIds: [projectId],
            },
            reason: 'observability_chart_free',
            granularity: {
                minutes: 5,
            },
            endTime: roundToGranularity(new Date(), '5m', 'down').toISOString(),
            startTime: roundToGranularity(
                new Date(Date.now() - ms('12h')),
                '5m',
                'up'
            ).toISOString(),
            filter: "environment eq 'production'",
        })

        return response.summary?.[0] || null
    } catch (error) {
        console.log('[Error] Error fetching observability CPU throttle', error)
        throw error
    }
}

export async function fetchObservabilityMemory({
    projectId,
    summaryOnly = false,
}: {
    projectId: string
    summaryOnly?: boolean
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        const response = await vercel.post<{
            data: {
                maxMemory: number
                provisioned: number
                timestamp: string // ISO string
            }[]
            statistics: {
                bytesRead: number
                rowsRead: number
                dbTimeSeconds: number
            }
            summary: {
                maxMemory: number
                provisioned: number
            }[]
        }>(`/observability/metrics?ownerId=${currentTeamId}`, {
            event: 'serverlessFunctionInvocation',
            rollups: {
                maxMemory: {
                    measure: 'peakMemoryMb',
                    aggregation: 'max',
                },
                provisioned: {
                    measure: 'provisionedMemoryMb',
                    aggregation: 'max',
                },
            },
            tailRollup: 'truncate',
            summaryOnly: summaryOnly,
            scope: {
                type: 'project',
                ownerId: currentTeamId,
                projectIds: [projectId],
            },
            reason: 'observability_chart_free',
            granularity: {
                minutes: 5,
            },
            endTime: roundToGranularity(new Date(), '5m', 'down').toISOString(),
            startTime: roundToGranularity(
                new Date(Date.now() - ms('12h')),
                '5m',
                'up'
            ).toISOString(),
            filter: "environment eq 'production'",
        })

        return response.summary?.[0] || null
    } catch (error) {
        console.log('[Error] Error fetching observability memory', error)
        throw error
    }
}

export async function fetchObservabilityColdStart({
    projectId,
    summaryOnly = false,
}: {
    projectId: string
    summaryOnly?: boolean
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        const response = await vercel.post<{
            data: {
                functionStartType: 'hot' | 'cold'
                total: number
                value: number
                timestamp: string // ISO string
            }[]
            statistics: {
                bytesRead: number
                rowsRead: number
                dbTimeSeconds: number
            }
            summary: {
                functionStartType: 'hot' | 'cold'
                total: number
                value: number
            }[]
        }>(`/observability/metrics?ownerId=${currentTeamId}`, {
            event: 'serverlessFunctionInvocation',
            rollups: {
                total: {
                    measure: 'count',
                    aggregation: 'sum',
                },
                value: {
                    measure: 'count',
                    aggregation: 'percent',
                },
            },
            groupBy: ['functionStartType'],
            scope: {
                type: 'project',
                ownerId: currentTeamId,
                projectIds: [projectId],
            },
            reason: 'observability_chart_free',
            granularity: {
                minutes: 5,
            },
            summaryOnly: summaryOnly,
            endTime: roundToGranularity(new Date(), '5m', 'down').toISOString(),
            startTime: roundToGranularity(
                new Date(Date.now() - ms('12h')),
                '5m',
                'up'
            ).toISOString(),
            filter: "environment eq 'production'",
        })

        return response.summary || null
    } catch (error) {
        console.log('[Error] Error fetching observability cold start', error)
        throw error
    }
}

export async function fetchObservabilityRouteSummary({
    projectId,
    summaryOnly = false,
}: {
    projectId: string
    summaryOnly?: boolean
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        const response = await vercel.post<{
            data: {
                route: string
                invocations: number
                errors: number
                p75DurationMS: number
                sumGbhrs: number
                timestamp: string // ISO string
            }[]
            statistics: {
                bytesRead: number
                rowsRead: number
                dbTimeSeconds: number
            }
            summary: {
                route: string
                invocations: number
                errors: number
                p75DurationMS: number
                sumGbhrs: number
            }[]
        }>(`/observability/metrics?ownerId=${currentTeamId}`, {
            event: 'serverlessFunctionInvocation',
            rollups: {
                invocations: {
                    measure: 'count',
                    aggregation: 'sum',
                },
                errors: {
                    measure: 'count',
                    aggregation: 'sum',
                    filter: "errorCode ne '' or httpStatus ge 500",
                },
                p75DurationMS: {
                    measure: 'functionDurationMs',
                    aggregation: 'p75',
                },
                sumGbhrs: {
                    measure: 'functionDurationGbhr',
                    aggregation: 'sum',
                },
            },
            groupBy: ['route'],
            limit: 500,
            tailRollup: 'truncate',
            summaryOnly: summaryOnly,
            lowGranularity: true,
            scope: {
                type: 'project',
                ownerId: currentTeamId,
                projectIds: [projectId],
            },
            reason: 'observability_chart_free',
            granularity: {
                hours: 1,
            },
            endTime: roundToGranularity(new Date(), '1h', 'down').toISOString(),
            startTime: roundToGranularity(
                new Date(Date.now() - ms('12h')),
                '1h',
                'up'
            ).toISOString(),
            filter: "environment eq 'production'",
        })

        return response.summary || null
    } catch (error) {
        console.log('[Error] Error fetching observability route summary', error)
        throw error
    }
}

/* DOMAINS */
export async function fetchTeamProjectDomains({
    projectId,
    from,
}: {
    projectId: string
    from?: number
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    if (from) {
        params.append('from', from.toString())
    }

    console.log('[fetchTeamProjectDomains] params', params.toString())

    try {
        const response = await vercel.get<{
            pagination: CommonPagination
            domains: Domain[]
        }>(`/projects/${projectId}/domains?${params.toString()}`)
        return response
    } catch (error) {
        console.log('[fetchTeamProjectDomains]  Error fetching domains', error)
        throw error
    }
}

export async function fetchTeamProjectDomainConfig(domain: string) {
    console.log('Fetching domain config', domain)
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
        strict: 'false',
    })

    try {
        const response = await vercel.get<DomainConfig>(
            `/v6/domains/${domain.toLowerCase()}/config?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[Error] Error fetching domain config', error)
        throw error
    }
}

/* ENVIRONMENT */
export async function fetchTeamProjectEnvironment({
    projectId,
    target,
}: {
    projectId: string
    target?: 'preview' | 'production' | 'development'
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    if (target) {
        params.append('target', target)
    }

    console.log('[fetchTeamProjectEnvironments] params', params.toString())

    try {
        const response = await vercel.get<{ envs: CommonEnvironmentVariable[] }>(
            // this one *needs* to have the v9 prefix
            `/v9/projects/${projectId}/env?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[Error] Error fetching environment variables', error)
        throw error
        // return { envs: [] }
    }
}

export async function decryptEnvironmentVariable({
    id,
    projectId,
}: {
    id: string
    projectId: string
}) {
    console.log('Decrypting environment variable', { projectId, id })
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }
    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    try {
        const response = await vercel.get<CommonEnvironmentVariable>(
            `/projects/${projectId}/env/${id}?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[Error] Error decrypting environment variable', error)
        throw error
    }
}

/* LOGS */
export async function fetchProjectLogs({
    projectId,
    deploymentId,
    startDate,
    endDate,
    page,
    attributes,
}: {
    projectId: string
    deploymentId?: string
    startDate: string
    endDate?: string
    page?: number
    attributes?: Record<string, string[]>
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        ownerId: currentTeamId,
        projectId,
        startDate,
    })

    if (deploymentId) {
        params.append('deploymentId', deploymentId)
    }

    if (endDate) {
        params.append('endDate', endDate)
    }

    if (page) {
        params.append('page', page.toString())
    }

    if (attributes) {
        for (const [attribute, values] of Object.entries(attributes)) {
            if (values.length === 0) continue
            params.append(attribute, values.join(','))
        }
    }

    console.log('[fetchRequestLogs] params', params.toString())

    try {
        const response = await vercel.get<{ rows: Log[]; hasMoreRows: boolean }>(
            `/logs/request-logs?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[Error] Error fetching request logs', error)
        throw error
    }
}

export async function fetchProjectLogsFilters({
    projectId,
    attributes,
    startDate,
    endDate,
}: {
    projectId: string
    attributes: string[]
    startDate: string
    endDate?: string
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const baseParams = new URLSearchParams({
        ownerId: currentTeamId,
        projectId,
        startDate,
    })

    if (endDate) {
        baseParams.append('endDate', endDate)
    }

    // Create a function for fetching a single attribute with delay
    const fetchAttributeWithDelay = async (attribute: string, delayMs: number) => {
        // Delay execution by specified milliseconds
        await new Promise((resolve) => setTimeout(resolve, delayMs))

        try {
            const params = new URLSearchParams(baseParams)
            params.append('attributeName', attribute)

            const response = await vercel.get<{
                availableOptions: number
                rows: {
                    attributeValue: string
                    total: number
                }[]
            }>(`/logs/request-logs/filter-values?${params.toString()}`)

            return { attribute, rows: response.rows }
        } catch (error) {
            console.log('[Error] Error fetching filter values for', attribute, error)
            return { attribute, rows: [] }
        }
    }

    // Create an array of promises with staggered delays
    const promises = attributes.map((attribute, index) =>
        fetchAttributeWithDelay(attribute, index * 50)
    )

    const results = await Promise.all(promises)

    // Combine results into the final filterValues object
    const filterValues: Record<string, { attributeValue: string; total: number }[]> = {}
    for (const result of results) {
        filterValues[result.attribute] = result.rows
    }

    return filterValues
}

/* WEBHOOKS */
export async function fetchWebhook({
    connectionId,
    teamId,
    pushToken,
}: { connectionId?: string; teamId?: string; pushToken: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = teamId || currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    console.log('PUSH TOKEN', pushToken)

    try {
        const response = await vercel.get<Webhook[]>(
            `/v1/webhooks?${params.toString()}`,
            undefined,
            connectionId
        )
        return response.find(
            (webhook) =>
                webhook.url.includes(process.env.EXPO_PUBLIC_WEBHOOK_URL!) &&
                webhook.url.includes(`_id=${pushToken.substring(0, 8)}`)
        )
    } catch (error) {
        console.log('[Error] Error fetching webhooks', error)
        throw error
    }
}
