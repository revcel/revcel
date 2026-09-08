export interface Webhook {
    id: string
    events: string[]
    url: string
    ownerId: string
    projectIds?: string[]
    alertRuleIds?: string[]
    // only present on the list endpoint
    projectsMetadata?:
        | {
              id: string
              name: string
              framework?: string | null
              latestDeployment?: string
          }[]
        | null
    // only returned once, on creation
    secret?: string
    createdAt: number
    updatedAt: number
    createdFrom?: string
}
