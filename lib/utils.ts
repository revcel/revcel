import { VERCEL_AVATAR_API_URL } from '@/lib/constants'
import ms from 'ms'

export const getAvatar = (teamId: string) => {
    const url = `${VERCEL_AVATAR_API_URL}?teamId=${teamId}&rounded=60`
    console.log('Avatar URL', url)

    return url
}

export const getDeploymentFavicon = async ({
    deploymentId,
    projectId,
    teamId,
}: {
    deploymentId: string
    projectId: string
    teamId: string
}) => {
    try {
        const params = new URLSearchParams({
            project: projectId,
            teamId,
        })

        const url = `https://vercel.com/api/v0/deployments/${deploymentId}/favicon?${params.toString()}`

        // const response = await fetch(url);
        // if (!response.headers.get("content-type")?.includes("image/png")) {
        //     console.error("Error fetching deployment favicon", response);
        //     return null;
        // }

        return url
    } catch (error) {
        console.error('Error fetching deployment favicon', error)
        return null
    }
}

export function getGitAuthorAvatar({
    uid,
    username,
    gitHost,
}: {
    uid: string
    username: string
    gitHost?: 'github'
}) {
    // console.log('[getGitAuthorAvatar]  uid', uid)
    // console.log('[getGitAuthorAvatar]  username', username)
    // console.log('[getGitAuthorAvatar]  gitHost', gitHost)

    let url

    switch (gitHost) {
        case 'github':
            url = `https://avatars.githubusercontent.com/${username}?s=48`
            break

        default:
            url = getAvatar(uid)
            break
    }
    return url
}

export const getSubdomain = (name: string, apexName: string) => {
    if (name === apexName) return null
    return name.slice(0, name.length - apexName.length - 1)
}

// a function that returns startDate and endDate in timestamp based on the current time for:
// - the last 1 hour if on the free plan
// - the last 24 hours if on the pro plan
// - the last 3 days if on the enterprise plan
// eg: { startDate: 1737997500000, endDate: 1737999360000 } == trnasaltes to starts date = Mon Jan 27 2025 17:05:00 GMT+0000 (Greenwich Mean Time), end date = Mon Jan 27 2025 17:36:00 GMT+0000 (Greenwich Mean Time)
export function getStartEndDates({
    tier,
    duration = '30m',
}: {
    tier: string
    duration?: '30m' | '1h' | '1d' | '3d'
}) {
    const plan = tier.toLowerCase() as 'free' | 'pro' | 'enterprise'
    const maxDurationMap: Record<typeof plan, number> = {
        free: ms('1h'),
        pro: ms('1d'),
        enterprise: ms('3d'),
    }

    const endDate = Date.now()
    let startDate = endDate - 31 * 60 * 1000

    if (duration === '30m') {
        startDate = endDate - 31 * 60 * 1000
    } else if (duration === '1h') {
        startDate = endDate - 61 * 60 * 1000
    } else {
        startDate = endDate - maxDurationMap.free
    }

    if (startDate < endDate - maxDurationMap[plan]) {
        throw new Error(`Exceeded maximum duration for ${plan} plan`)
    }

    switch (duration) {
        case '1h':
            startDate = endDate - 61 * 60 * 1000
            break
        default:
            break
    }

    return { startDate, endDate }
}

export function toUpperCaseFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
