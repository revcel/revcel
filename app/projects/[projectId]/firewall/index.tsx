import { fetchProjectFirewallRules, fetchTeamProjects } from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import InfoRow from '@/components/base/InfoRow'
import RefreshControl from '@/components/base/RefreshControl'
import { useToggleAttackMode } from '@/lib/hooks'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import type { FirewallConfig, FirewallCrsCategory, FirewallManagedRuleKey } from '@/types/firewall'
import type { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import { upperFirst } from 'lodash'
import { useMemo } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

const LABEL_FOR_MANAGED_RULE: Record<FirewallManagedRuleKey, string> = {
    bot_protection: 'Bot protection',
    ai_bots: 'AI bots',
    owasp: 'OWASP Core Rules',
    vercel_ruleset: 'Vercel ruleset',
    traffic_sources: 'Traffic sources',
}

const LABEL_FOR_CRS_CATEGORY: Record<FirewallCrsCategory, string> = {
    sd: 'Scanner detection',
    ma: 'Metadata / error leakage',
    lfi: 'Local file inclusion',
    rfi: 'Remote file inclusion',
    rce: 'Remote code execution',
    php: 'PHP injection',
    gen: 'Generic attack',
    xss: 'Cross-site scripting',
    sqli: 'SQL injection',
    sf: 'Session fixation',
    java: 'Java attack',
}

interface FirewallInfoRow {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    value: string
}

export default function ProjectFirewallScreen() {
    const { projectId } = useLocalSearchParams<{ projectId: string }>()
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = currentConnection?.currentTeamId

    const configQuery = useQuery({
        queryKey: ['project', projectId, 'firewall', 'config'],
        queryFn: () => fetchProjectFirewallRules({ projectId }),
        enabled: !!projectId,
    })

    // attack mode lives on the project, not on the firewall config
    const teamProjectsQuery = useQuery({
        queryKey: ['team', currentTeamId, 'projects'],
        queryFn: () => fetchTeamProjects(),
        enabled: !!currentTeamId,
    })

    const project = useMemo(
        () => teamProjectsQuery.data?.find((project) => project.id === projectId),
        [teamProjectsQuery.data, projectId]
    )

    const attackModeEnabled = !!project?.security?.attackModeEnabled

    const { toggle: toggleAttackMode, isWorking } = useToggleAttackMode({
        projectId,
        projectName: project?.name,
        attackModeEnabled,
    })

    const sections = useMemo(() => {
        const config = configQuery.data
        if (!config) return []

        return [
            { title: 'Status', rows: buildStatusRows(config, project?.security) },
            { title: 'Managed rules', rows: buildManagedRuleRows(config.active) },
            { title: 'OWASP categories', rows: buildCrsRows(config.active) },
            { title: 'Custom rules', rows: buildCustomRuleRows(config.active) },
            { title: 'IP rules', rows: buildIpRows(config.active) },
        ].filter((section) => section.rows.length > 0)
    }, [configQuery.data, project?.security])

    if (configQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
            </View>
        )
    }

    if (configQuery.isError || !configQuery.data) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 14, color: COLORS.errorLighter, fontFamily: 'Geist' }}>
                    Error fetching firewall config.
                </Text>
            </View>
        )
    }

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
                <RefreshControl
                    onRefresh={async () => {
                        await Promise.all([configQuery.refetch(), teamProjectsQuery.refetch()])
                    }}
                />
            }
        >
            {sections.map((section) => (
                <View key={section.title}>
                    <Text
                        style={{
                            color: COLORS.gray900,
                            fontSize: 12,
                            fontFamily: 'Geist',
                            textTransform: 'uppercase',
                            paddingHorizontal: 16,
                            paddingTop: 20,
                            paddingBottom: 8,
                        }}
                    >
                        {section.title}
                    </Text>
                    {section.rows.map((row, index) => (
                        <InfoRow
                            key={`${section.title}-${row.label}-${index}`}
                            label={row.label}
                            icon={row.icon}
                            value={row.value}
                            isLight={index % 2 === 0}
                            borderTop={index !== 0}
                        />
                    ))}
                </View>
            ))}

            <TouchableOpacity
                style={{
                    marginTop: 24,
                    marginHorizontal: 16,
                    borderRadius: 10,
                    paddingVertical: 16,
                    backgroundColor: attackModeEnabled ? COLORS.gray1000 : COLORS.error,
                    opacity: isWorking ? 0.6 : 1,
                }}
                disabled={isWorking || !project}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    toggleAttackMode()
                }}
            >
                <Text
                    style={{
                        color: COLORS.background,
                        textAlign: 'center',
                        fontSize: 16,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontFamily: 'Geist',
                    }}
                >
                    {isWorking
                        ? 'Working...'
                        : attackModeEnabled
                          ? 'Disable Attack Mode'
                          : 'Enable Attack Mode'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

function buildStatusRows(
    config: { active: FirewallConfig; draft: FirewallConfig | null },
    security: { attackModeEnabled?: boolean; attackModeEnabledAt?: number } | undefined
): FirewallInfoRow[] {
    const { active, draft } = config

    const rows: FirewallInfoRow[] = [
        {
            label: 'Firewall',
            icon: 'shield-outline',
            value: active.firewallEnabled ? 'Enabled' : 'Disabled',
        },
        {
            label: 'Attack mode',
            icon: 'flash-outline',
            value: security?.attackModeEnabled
                ? security.attackModeEnabledAt
                    ? `On since ${formatDistanceToNow(security.attackModeEnabledAt, { addSuffix: true })}`
                    : 'On'
                : 'Off',
        },
    ]

    if (active.botIdEnabled !== undefined) {
        rows.push({
            label: 'Bot ID',
            icon: 'finger-print-outline',
            value: active.botIdEnabled ? 'Enabled' : 'Disabled',
        })
    }

    rows.push({
        label: 'Config version',
        icon: 'git-commit-outline',
        value: `v${active.version} · ${formatDistanceToNow(new Date(active.updatedAt), { addSuffix: true })}`,
    })

    if (draft) {
        rows.push({
            label: 'Draft',
            icon: 'document-text-outline',
            value: `v${draft.version} unpublished`,
        })
    }

    return rows
}

function buildManagedRuleRows(active: FirewallConfig): FirewallInfoRow[] {
    if (!active.managedRules) return []

    return (Object.keys(LABEL_FOR_MANAGED_RULE) as FirewallManagedRuleKey[])
        .filter((key) => active.managedRules?.[key])
        .map((key) => {
            const rule = active.managedRules?.[key]
            return {
                label: LABEL_FOR_MANAGED_RULE[key],
                icon: 'shield-checkmark-outline',
                value: rule?.active ? upperFirst(rule.action ?? 'log') : 'Off',
            }
        })
}

function buildCrsRows(active: FirewallConfig): FirewallInfoRow[] {
    if (!active.crs) return []

    return (Object.keys(LABEL_FOR_CRS_CATEGORY) as FirewallCrsCategory[])
        .filter((key) => active.crs?.[key])
        .map((key) => {
            const category = active.crs?.[key]
            return {
                label: LABEL_FOR_CRS_CATEGORY[key],
                icon: 'bug-outline',
                value: category?.active ? upperFirst(category.action) : 'Off',
            }
        })
}

function buildCustomRuleRows(active: FirewallConfig): FirewallInfoRow[] {
    if (active.rules.length === 0) {
        return [{ label: 'Custom rules', icon: 'code-slash-outline', value: 'None' }]
    }

    return active.rules.map((rule) => {
        const action = rule.action.mitigate?.action
        const label = action ? upperFirst(action.replace('_', ' ')) : '—'

        return {
            label: rule.name,
            icon: 'code-slash-outline',
            value: rule.active ? label : `Off · ${label}`,
        }
    })
}

function buildIpRows(active: FirewallConfig): FirewallInfoRow[] {
    if (active.ips.length === 0) {
        return [{ label: 'IP rules', icon: 'globe-outline', value: 'None' }]
    }

    return active.ips.map((ip) => ({
        label: ip.hostname,
        icon: 'globe-outline',
        value: `${ip.ip} · ${upperFirst(ip.action)}`,
    }))
}
