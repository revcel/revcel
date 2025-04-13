import type { CommonBilling } from './common'

export interface User {
    uid: string
    email: string
    name: null | string
    username: string
    avatar: null | string
    softBlock: null | string
    enablePreviewFeedback: null | boolean
    remoteCaching: {
        enabled: boolean
    }
    dataCache: {
        excessBillingEnabled: boolean
    }
    defaultTeamId: string
    version: string
    date: Date
    platformVersion: null
    hasTrialAvailable: boolean
    billing: CommonBilling & { subscriptions: null }
    bio: null
    website: null
    activeDashboardViews: {
        scopeId: string
        recentsViewPreference: string
    }[]
    stagingPrefix: string
    resourceConfig: {
        concurrentBuilds: number
    }
    importFlowGitProvider: string
    importFlowGitNamespaceId: number
    dismissedToasts: UserDismissedToast[]
    featureBlocks: {
        [key: string]: boolean
    }
}

interface UserDismissedToast {
    name: string
    dismissals: {
        scopeId: string
        createdAt: number
    }[]
}
