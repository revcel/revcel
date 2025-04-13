export interface Webhook {
    id: string
    events: string[]
    url: string
    ownerId: string
    projectIds?: string[]
    createdAt: string
    updatedAt: string
    createdFrom: string | 'account'
}
