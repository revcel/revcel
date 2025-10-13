import { usePersistedStore } from '@/store/persisted'

const API_BASE_URL = 'https://api.vercel.com'

export class VercelError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly invalidToken: boolean
    ) {
        super(message)
    }
}

async function http<T>(path: string, config: RequestInit, connectionId?: string): Promise<T> {
    const currentConnection = connectionId
        ? usePersistedStore.getState().connections.find((c) => c.id === connectionId)
        : usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('Current connection not found')
    }

    if (!currentConnection.apiToken) {
        throw new Error('No access token found')
    }

    const url = `${API_BASE_URL}${path}`

    // console.log('[vercel.http] url', url)

    const request = new Request(url, {
        ...config,
        headers: {
            Authorization: `Bearer ${currentConnection.apiToken}`,
            'Content-Type': 'application/json',
            ...config.headers,
        },
    })
    const response: Response = await fetch(request)

    // console.log('[vercel.http] response', response)

    if (!response.ok) {
        const errJson = (await response.json()) as { error: VercelError }

        console.log('[vercel.http] errJson', errJson)

        if (errJson.error.invalidToken) {
            usePersistedStore.getState().removeConnection(currentConnection.id)
        }

        throw new VercelError(errJson.error.message, errJson.error.code, errJson.error.invalidToken)
    }

    const textResponse = await response.text()
    let parsed = {}

    try {
        parsed =
            config.method === 'DELETE' || path.includes('edge-cache')
                ? null
                : JSON.parse(textResponse)
    } catch (error) {
        console.log('[vercel.http] Error parsing response', error)
        console.log('[vercel.http] textResponse', textResponse)
    }

    return parsed as T
}

async function GET<T>(path: string, config?: RequestInit, connectionId?: string): Promise<T> {
    const init = { method: 'GET', ...config }
    return await http<T>(path, init, connectionId)
}

async function POST<T>(
    path: string,
    body?: any,
    config?: RequestInit,
    isRawBody = false,
    connectionId?: string
): Promise<T> {
    const init = {
        method: 'POST',
        body: body ? (isRawBody ? (body as BodyInit) : JSON.stringify(body)) : undefined,
        ...config,
    }
    return await http<T>(path, init, connectionId)
}

async function PUT<T>(
    path: string,
    body: any,
    config?: RequestInit,
    connectionId?: string
): Promise<T> {
    const init = {
        method: 'PUT',
        body: JSON.stringify(body),
        ...config,
    }
    return await http<T>(path, init, connectionId)
}

async function PATCH<T>(
    path: string,
    body?: any,
    config?: RequestInit,
    isRawBody = false,
    connectionId?: string
): Promise<T> {
    const init = {
        method: 'PATCH',
        body: body ? (isRawBody ? (body as BodyInit) : JSON.stringify(body)) : undefined,
        ...config,
    }
    return await http<T>(path, init, connectionId)
}

async function DELETE<T>(path: string, config?: RequestInit, connectionId?: string): Promise<T> {
    const init = {
        method: 'DELETE',
        ...config,
    }
    return await http<T>(path, init, connectionId)
}

const vercel = {
    get: GET,
    post: POST,
    put: PUT,
    patch: PATCH,
    delete: DELETE,
}

export default vercel
