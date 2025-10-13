import vercel from '@/lib/vercel'
import { usePersistedStore } from '@/store/persisted'
import type { CommonEnvironmentVariable } from '@/types/common'
import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'
import { fetchWebhook } from './queries'

export async function updateEnvironmentVariable({
    projectId,
    id,
    data,
}: {
    projectId: string
    id: string
    data: {
        target?: ('production' | 'preview' | 'development')[]
        customEnvironmentIds?: string[] // ignore, Vercel Pro only
        gitBranch?: string // ignore, Vercel Pro only
    } & (
        | {
              key?: string
              value?: string
              comment?: string
              type?: 'encrypted'
          }
        | {
              type: 'sensitive'
              comment?: string
          }
    )
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    if (data.type === 'sensitive' && data.target?.includes('development')) {
        throw new Error(
            'Sensitive environment variables cannot be created in the Development environment'
        )
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    console.log('[updateEnvironmentVariable] params', params.toString())

    try {
        const response = await vercel.patch<CommonEnvironmentVariable>(
            // this has to be v9 or higher
            // otherwise we get a variable not found response
            `/v9/projects/${projectId}/env/${id}`,
            data
        )
        console.log('[updateEnvironmentVariable] response', JSON.stringify(response, null, 2))
        return response
    } catch (error) {
        console.log('[updateEnvironmentVariable] Error updating environment variable', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function deleteEnvironmentVariable({
    projectId,
    id,
}: { projectId: string; id: string }) {
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

    console.log('[deleteEnvironmentVariable] params', params.toString())

    try {
        await vercel.delete(`/v7/projects/${projectId}/env/${id}?${params.toString()}`)
    } catch (error) {
        console.log('[deleteEnvironmentVariable] Error deleting environment variable', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function addEnvironmentVariable({
    projectId,
    data,
}: {
    projectId: string
    data: {
        key: string
        value: string
        comment?: string
        target: ('production' | 'preview' | 'development')[]
        type: 'sensitive' | 'encrypted'
        customEnvironmentIds?: string[] // ignore, Vercel Pro only
        gitBranch?: string // ignore, Vercel Pro only
    }
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    if (data.type === 'sensitive' && data.target?.includes('development')) {
        throw new Error(
            'Sensitive environment variables cannot be created in the Development environment'
        )
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    const envVar = {
        ...data,
        customEnvironmentIds: data.customEnvironmentIds || [],
        target: data.target,
        comment: data.comment || '',
    }

    console.log('[addEnvironmentVariable] params', params.toString())

    try {
        const response = await vercel.post<CommonEnvironmentVariable>(
            `/v10/projects/${projectId}/env?${params.toString()}`,
            [envVar]
        )
        console.log('[addEnvironmentVariable] response', JSON.stringify(response, null, 2))
        return response
    } catch (error) {
        console.log('[addEnvironmentVariable] Error adding environment variable', error)
        Sentry.captureException(error)
        throw error
    }
}

/* FIREWALL */
export async function toggleFirewall({
    projectId,
    attackModeEnabled,
}: { projectId: string; attackModeEnabled: boolean }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    try {
        await vercel.post(
            `/v1/security/attack-mode?teamId=${currentTeamId}`,
            {
                projectId,
                attackModeEnabled,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.log('[toggleFirewall] Error toggling firewall', error)
        Sentry.captureException(error)
        throw error
    }
}

/* DEPLOYMENTS */
export async function deleteDeployment(deploymentId: string) {
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

    console.log('[deleteDeployment] params', params.toString())

    try {
        await vercel.delete(`/v13/deployments/${deploymentId}?${params.toString()}`)
    } catch (error) {
        console.log('[deleteDeployment] Error deleting deployment', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function promoteDeployment({
    id,
    projectId,
}: {
    id: string
    projectId: string
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

    console.log('[promoteDeployment] params', params.toString())

    try {
        const response = await vercel.post(
            `/v10/projects/${projectId}/promote/${id}?${params.toString()}`,
            undefined,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        return response
    } catch (error) {
        console.log('[promoteDeployment] Error promoting deployment', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function rollbackDeployment({
    id,
    projectId,
}: {
    id: string
    projectId: string
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

    console.log('[rollbackDeployment] params', params.toString())

    try {
        const response = await vercel.post(
            `/v9/projects/${projectId}/rollback/${id}?${params.toString()}`,
            undefined,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        return response
    } catch (error) {
        console.log('[rollbackDeployment] Error rolling back deployment', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function cancelDeployment(deploymentId: string) {
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

    console.log('[cancelDeployment] params', params.toString())

    try {
        const response = await vercel.patch(
            `/v12/deployments/${deploymentId}/cancel?${params.toString()}`
        )
        return response
    } catch (error) {
        console.log('[cancelDeployment] Error canceling deployment', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function redeployDeployment({
    id,
    target = 'production',
    projectName,
}: {
    id: string
    target?: 'production' | 'preview'
    projectName: string
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
        forceNew: '1',
    })

    console.log('projectName', projectName)

    try {
        const response = await vercel.post(`/v13/deployments?${params.toString()}`, {
            deploymentId: id,
            meta: {
                action: 'redeploy',
            },
            target,
            name: projectName,
        })
        return response
    } catch (error) {
        console.log('[redeployDeployment] Error redeploying deployment', error)
        Sentry.captureException(error)
        throw error
    }
}

/* DOMAINS */
export async function addDomain({
    projectId,
    data,
}: {
    projectId: string
    data: {
        name: string
        gitBranch?: string | null
        redirect?: string | null
        redirectStatusCode?: 307 | 301 | 302 | 308 | null
    }
}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const currentTeamId = currentConnection.currentTeamId

    if (!currentTeamId) {
        throw new Error('Current team not found')
    }

    if (data.redirect && data.gitBranch) {
        throw new Error('Cannot set both redirect and gitBranch')
    }

    if (data.redirect && !data.redirectStatusCode) {
        data.redirectStatusCode = 307 // Default vercel redirect status code
    }

    const params = new URLSearchParams({
        teamId: currentTeamId,
    })

    console.log('[addDomain] params', params.toString())

    try {
        const response = await vercel.post(
            `/v10/projects/${projectId}/domains?${params.toString()}`,
            data
        )
        console.log('[addDomain] response', JSON.stringify(response, null, 2))
        return response
    } catch (error) {
        console.log('[addDomain] Error adding domain', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function removeDomain({
    projectId,
    domain,
}: {
    projectId: string
    domain: string
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

    console.log('[removeDomain] params', params.toString())

    try {
        await vercel.delete(`/v9/projects/${projectId}/domains/${domain}?${params.toString()}`)
    } catch (error) {
        console.log('[removeDomain] Error removing domain', error)
        Sentry.captureException(error)
        throw error
    }
}

/* MISC */
export async function purgeCache({ projectId }: { projectId: string }) {
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
        projectIdOrName: projectId,
    })

    console.log('[purgeCache] params', params.toString())

    try {
        await vercel.delete(`/v1/data-cache/purge-all?${params.toString()}`)
    } catch (error) {
        console.log('[purgeCache] Error purging cache', error)
        throw error
    }
}

export async function registerWebhook({
    events,
    pushToken,
    connectionId,
    teamId,
    isSubscribed,
}: {
    events: string[]
    pushToken: string
    connectionId: string
    teamId: string
    isSubscribed: boolean
}) {
    if (!isSubscribed) {
        throw new Error('Push Notifications require an active subscription')
    }

    let shouldRevert = false
    let webhookId: string | null = null

    try {
        const webhook = await fetchWebhook({
            connectionId,
            teamId,
            pushToken,
        })

        if (webhook) {
            // remove existing webhook
            try {
                await deleteWebhook({
                    webhookId: webhook.id,
                    connectionId,
                    teamId,
                })
            } catch (error) {
                console.log('[registerWebhook] Error unregistering webhook', error)
                Sentry.captureException(error)
                throw error
            }
        }

        console.log('[registerWebhook] body', JSON.stringify(events, null, 2))

        if (events.length === 0) return

        const response = await createWebhook({
            events,
            connectionId,
            teamId,
            pushToken,
        })

        webhookId = response.id

        if (!response.secret) {
            throw new Error('Failed to register webhook')
        }

        const url =
            Platform.OS === 'android'
                ? process.env.EXPO_PUBLIC_WEBHOOK_URL + '/google/notifications'
                : process.env.EXPO_PUBLIC_WEBHOOK_URL + '/apple/notifications'

        shouldRevert = true

        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                userId: connectionId,
                teamId: teamId,
                token: pushToken,
                verification: response.secret,
            }),
        })

        if (!res.ok) {
            throw new Error('Failed to register webhook')
        }

        return response
    } catch (error) {
        if (shouldRevert && webhookId) {
            await deleteWebhook({
                webhookId,
                connectionId,
                teamId,
            }).catch((error) => {
                console.log('[registerWebhook] Error unregistering webhook', error)
            })
        }
        console.log('[registerWebhook] Error registering webhook', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function createWebhook({
    events,
    connectionId,
    teamId,
    pushToken,
}: {
    events: string[]
    connectionId: string
    teamId: string
    pushToken: string
}) {
    try {
        const params = new URLSearchParams({
            teamId: teamId,
        })

        console.log('[registerWebhook] params', params.toString())

        const response = (await vercel.post(
            `/v1/webhooks?${params.toString()}`,
            {
                url:
                    process.env.EXPO_PUBLIC_WEBHOOK_URL +
                    '/webhook?_id=' +
                    pushToken.substring(0, 8),
                events: events,
            },
            undefined,
            undefined,
            connectionId
        )) as { secret: string; id: string }

        return response
    } catch (error) {
        console.log('[createWebhook] Error creating webhook', error)
        Sentry.captureException(error)
        throw error
    }
}

export async function deleteWebhook({
    webhookId,
    connectionId,
    teamId,
}: {
    webhookId: string
    connectionId: string
    teamId: string
}) {
    const currentConnection = usePersistedStore
        .getState()
        .connections.find((connection) => connection.id === connectionId)

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    const params = new URLSearchParams({
        teamId: teamId,
    })

    console.log('[unregisterWebhook] params', params.toString())

    try {
        const response = await vercel.delete(`/v1/webhooks/${webhookId}?${params.toString()}`)
        return response
    } catch (error) {
        console.log('[unregisterWebhook] Error unregistering webhook', error)
        Sentry.captureException(error)
        throw error
    }
}
