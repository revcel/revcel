import type { Deployment } from '@/types/deployments'
import type { Project } from '@/types/projects'

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

export function formatFrameworkName(framework: string) {
    if (!framework) return '—'

    if (framework.includes('next')) return 'Next.js'
    if (framework.includes('react')) return 'React'
    if (framework.includes('svelte')) return 'Svelte'
    if (framework.includes('vue')) return 'Vue'
    if (framework.includes('angular')) return 'Angular'
    if (framework.includes('ember')) return 'Ember'
    if (framework.includes('laravel')) return 'Laravel'
    if (framework.includes('symfony')) return 'Symfony'
    if (framework.includes('rails')) return 'Ruby on Rails'
    if (framework.includes('django')) return 'Django'
    if (framework.includes('flask')) return 'Flask'
    if (framework.includes('express')) return 'Express'
    if (framework.includes('fastify')) return 'Fastify'
    if (framework.includes('nest')) return 'Nest.js'
    if (framework.includes('nestjs')) return 'Nest.js'
    if (framework.includes('sveltekit')) return 'SvelteKit'
    if (framework.includes('astro')) return 'Astro'
    if (framework.includes('nuxt')) return 'Nuxt.js'
    if (framework.includes('gatsby')) return 'Gatsby'

    return framework
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
