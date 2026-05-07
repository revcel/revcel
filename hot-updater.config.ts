import { d1Database, r2Storage } from '@hot-updater/cloudflare'
import { expo } from '@hot-updater/expo'
import { withSentry } from '@hot-updater/sentry-plugin'
import { defineConfig } from 'hot-updater'

export default defineConfig({
    build: withSentry(
        expo({
            sourcemap: true,
        }),
        {
            org: process.env.EXPO_PUBLIC_SENTRY_ORG!,
            project: process.env.EXPO_PUBLIC_SENTRY_PROJECT!,
            authToken: process.env.SENTRY_AUTH_TOKEN!,
        }
    ),
    storage: r2Storage({
        bucketName: process.env.HOT_UPDATER_CLOUDFLARE_R2_BUCKET_NAME!,
        accountId: process.env.HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID!,
        cloudflareApiToken: process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN!,
    }),
    database: d1Database({
        databaseId: process.env.HOT_UPDATER_CLOUDFLARE_D1_DATABASE_ID!,
        accountId: process.env.HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID!,
        cloudflareApiToken: process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN!,
    }),
    updateStrategy: 'appVersion',
    signing: { enabled: true, privateKeyPath: './keys/private-key.pem' },
})
