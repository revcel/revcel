import { COLORS } from '@/theme/colors'
import type { CommonDeploymentStatus } from '@/types/common'

export const VERCEL_API_URL = 'https://api.vercel.com'
export const VERCEL_AVATAR_API_URL = 'https://vercel.com/api/www/avatar'

export const COLOR_FOR_BUILD_STATUS: Record<CommonDeploymentStatus, string> = {
    QUEUED: COLORS.gray1000,
    INITIALIZING: COLORS.gray1000,
    BUILDING: COLORS.warning,
    READY: COLORS.green900,
    ERROR: COLORS.error,
    CANCELED: COLORS.error,
} as const

export const COLOR_FOR_REQUEST_STATUS = (status: number) => {
    if (status >= 500) return COLORS.error
    if (status >= 400) return COLORS.warning
    if (status >= 200 && status < 300) return COLORS.green900
    return COLORS.gray900
}
