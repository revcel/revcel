import type {
    CommonDeploymentCreator,
    CommonDeploymentReadySubstate,
    CommonDeploymentSource,
    CommonEnvironment,
} from '@/types/common'
import type { Deployment } from '@/types/deployments'
import type { Project } from '@/types/projects'
import { upperFirst } from 'lodash'

export function formatNumber(number: number) {
    if (number < 1000) return number
    if (number < 1000000) return (number / 1000).toFixed(1) + 'K'
    return (number / 1000000).toFixed(1) + 'M'
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export function formatFrameworkName(framework: string | null | undefined) {
    if (!framework) return '—'

    // order matters: more specific names first
    if (framework.includes('sveltekit')) return 'SvelteKit'
    if (framework.includes('svelte')) return 'Svelte'
    if (framework.includes('nest')) return 'Nest.js'
    if (framework.includes('next')) return 'Next.js'
    if (framework.includes('nuxt')) return 'Nuxt.js'
    if (framework.includes('react-router')) return 'React Router'
    if (framework.includes('tanstack-start')) return 'TanStack Start'
    if (framework.includes('solidstart')) return 'SolidStart'
    if (framework.includes('react')) return 'React'
    if (framework.includes('vue')) return 'Vue'
    if (framework.includes('angular')) return 'Angular'
    if (framework.includes('ember')) return 'Ember'
    if (framework.includes('laravel')) return 'Laravel'
    if (framework.includes('symfony')) return 'Symfony'
    if (framework.includes('rails')) return 'Ruby on Rails'
    if (framework.includes('django')) return 'Django'
    if (framework.includes('flask')) return 'Flask'
    if (framework.includes('fastapi')) return 'FastAPI'
    if (framework.includes('express')) return 'Express'
    if (framework.includes('fastify')) return 'Fastify'
    if (framework.includes('astro')) return 'Astro'
    if (framework.includes('gatsby')) return 'Gatsby'
    if (framework.includes('remix')) return 'Remix'
    if (framework.includes('hono')) return 'Hono'
    if (framework.includes('nitro')) return 'Nitro'
    if (framework.includes('vite')) return 'Vite'
    if (framework.includes('bun')) return 'Bun'
    if (framework.includes('container')) return 'Container'

    return framework
}

const LABEL_FOR_DEPLOYMENT_SOURCE: Record<CommonDeploymentSource, string> = {
    'api-trigger-git-deploy': 'API',
    cli: 'CLI',
    'clone/repo': 'Clone',
    drop: 'Drag & drop',
    git: 'Git push',
    'git-deploy-hook': 'Deploy hook',
    import: 'Import',
    'import/repo': 'Import',
    redeploy: 'Redeploy',
    'v0-web': 'v0',
}

export function formatDeploymentSource(source: CommonDeploymentSource | undefined) {
    if (!source) return '—'
    return LABEL_FOR_DEPLOYMENT_SOURCE[source] ?? source
}

export function formatDeploymentCreator(creator: CommonDeploymentCreator | null | undefined) {
    if (!creator) return undefined

    const name = creator.username ?? creator.email ?? creator.uid

    // `user` is the default, only call out bots and integrations
    if (creator.type && creator.type !== 'user') return `${name} · ${creator.type}`

    return name
}

const LABEL_FOR_FUNCTION_MEMORY_TYPE: Record<
    NonNullable<Deployment['config']>['functionMemoryType'],
    string
> = {
    performance: 'Performance',
    performance_xl: 'Performance XL',
    standard: 'Standard',
    standard_legacy: 'Standard (legacy)',
}

export function formatFunctionConfig(config: Deployment['config'] | undefined) {
    if (!config) return undefined

    const parts = [
        config.functionType === 'fluid' ? 'Fluid' : 'Standard',
        LABEL_FOR_FUNCTION_MEMORY_TYPE[config.functionMemoryType] ?? config.functionMemoryType,
    ]

    return parts.join(' · ')
}

export function formatBuildMachine(resourceConfig: Deployment['resourceConfig'] | undefined) {
    const machine = resourceConfig?.buildMachine
    if (!machine) return undefined

    if (machine.cores && machine.memory) {
        return `${machine.cores} vCPU · ${machine.memory} MB`
    }

    return machine.purchaseType ? upperFirst(machine.purchaseType) : undefined
}

const LABEL_FOR_READY_SUBSTATE: Record<CommonDeploymentReadySubstate, string> = {
    PROMOTED: 'Promoted',
    STAGED: 'Staged',
    ROLLING: 'Rolling',
}

export function formatEnvironmentLabel(
    target: CommonEnvironment | string | null | undefined,
    readySubstate?: CommonDeploymentReadySubstate
) {
    const label = upperFirst(target ?? 'preview')

    // `PROMOTED` is the normal state of every live production deployment, only call out the exceptions
    if (!readySubstate || readySubstate === 'PROMOTED') return label

    return `${label} · ${LABEL_FOR_READY_SUBSTATE[readySubstate] ?? upperFirst(readySubstate.toLowerCase())}`
}

export function formatDeploymentShortId(
    deployment: Deployment | Project['latestDeployments'][number] | undefined
) {
    if (!deployment) return 'Deployment'

    // it has come down to searching by the length of the vercel short id
    const shortId = deployment?.url
        ?.split('-')
        ?.filter((_, i) => i > 0)
        ?.find((part) => part.length === 9)

    if (!shortId) return 'Deployment'

    return shortId
}
