const LINK_TAG_REGEX = /<link\b[^>]*>/gi
const REL_ATTR_REGEX = /\brel=["']([^"']+)["']/i
const HREF_ATTR_REGEX = /\bhref=["']([^"']+)["']/i
const ABSOLUTE_URL_REGEX = /^https?:\/\//i
const TRAILING_SLASHES_REGEX = /\/+$/

// Deployment Protection redirects to vercel.com/sso-api and then to vercel.com/login
const PROTECTION_HOST = 'vercel.com'
const PROTECTION_MARKERS = ['/sso-api', '_vercel_sso']

// same order as the widgets: declared icon first, then the conventional paths
const FALLBACK_ICON_PATHS = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png']

const REQUEST_TIMEOUT_MS = 10_000

function isVercelAppHost(host: string) {
    return host.endsWith('.vercel.app')
}

/**
 * Production hosts for a project, custom domains first, `<name>.vercel.app` last.
 * Works with the reduced project shape returned by `GET /projects`.
 */
export function getProjectProductionHosts(project: {
    name: string
    alias?: { domain: string; deployment?: unknown | null }[]
    targets?: { [key: string]: { alias?: string[] } | undefined }
}) {
    const hosts = new Set<string>()

    // aliases with a deployment are the ones currently serving production traffic
    for (const alias of project.alias ?? []) {
        if (alias.deployment) hosts.add(alias.domain)
    }

    for (const domain of project.targets?.production?.alias ?? []) {
        hosts.add(domain)
    }

    hosts.add(`${project.name}.vercel.app`)

    return [...hosts].sort((a, b) => Number(isVercelAppHost(a)) - Number(isVercelAppHost(b)))
}

async function fetchWithTimeout(url: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        return await fetch(url, { signal: controller.signal, redirect: 'follow' })
    } finally {
        clearTimeout(timer)
    }
}

// RN <Image> cannot render SVG, and a protection page is text/html
function isRenderableImage(response: Response) {
    const contentType = response.headers.get('content-type') ?? ''
    return response.ok && contentType.startsWith('image/') && !contentType.includes('svg')
}

async function isImageUrl(url: string) {
    try {
        const response = await fetchWithTimeout(url)
        return isRenderableImage(response)
    } catch {
        return false
    }
}

function isProtectionPage(response: Response, html: string) {
    let finalHost = ''
    try {
        finalHost = new URL(response.url).hostname
    } catch {
        // keep the marker check only
    }

    return (
        finalHost === PROTECTION_HOST ||
        finalHost.endsWith(`.${PROTECTION_HOST}`) ||
        PROTECTION_MARKERS.some((marker) => html.includes(marker))
    )
}

/** Icon hrefs declared in the page head, SVGs skipped. Touch icons last: they are often 1 MB PNGs. */
export function extractIconHrefs(html: string) {
    const touchIcons: string[] = []
    const icons: string[] = []

    for (const tag of html.match(LINK_TAG_REGEX) ?? []) {
        const rel = REL_ATTR_REGEX.exec(tag)?.[1]?.toLowerCase() ?? ''
        const href = HREF_ATTR_REGEX.exec(tag)?.[1]

        if (!href || !rel.includes('icon') || rel.includes('mask-icon')) continue
        if (href.toLowerCase().split('?')[0].endsWith('.svg')) continue

        if (rel.includes('apple-touch-icon')) touchIcons.push(href)
        else icons.push(href)
    }

    return [...icons, ...touchIcons]
}

function resolveHref(base: string, href: string) {
    if (ABSOLUTE_URL_REGEX.test(href)) return href
    if (href.startsWith('//')) return `https:${href}`
    return href.startsWith('/') ? `${base}${href}` : `${base}/${href}`
}

/** Returns a URL that is known to serve an image, or null. */
export async function resolveWebsiteFaviconUrl(host: string): Promise<string | null> {
    const base = `https://${host}`.replace(TRAILING_SLASHES_REGEX, '')

    // 1. what the site declares in its <head>
    try {
        const homepage = await fetchWithTimeout(base)
        const contentType = homepage.headers.get('content-type') ?? ''

        if (homepage.ok && contentType.includes('text/html')) {
            const html = await homepage.text()

            if (isProtectionPage(homepage, html)) return null

            for (const href of extractIconHrefs(html).slice(0, 3)) {
                const url = resolveHref(base, href)
                if (await isImageUrl(url)) return url
            }
        }
    } catch {
        // fall through to the conventional paths
    }

    // 2. conventional locations
    for (const path of FALLBACK_ICON_PATHS) {
        const url = `${base}${path}`
        if (await isImageUrl(url)) return url
    }

    return null
}

/** First host that yields an icon wins; at most two hosts are tried to bound the requests. */
export async function resolveProjectFaviconUrl(
    project: Parameters<typeof getProjectProductionHosts>[0]
): Promise<string | null> {
    for (const host of getProjectProductionHosts(project).slice(0, 2)) {
        const url = await resolveWebsiteFaviconUrl(host)
        if (url) return url
    }

    return null
}
