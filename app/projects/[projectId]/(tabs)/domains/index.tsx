import { removeDomain } from '@/api/mutations'
import { fetchTeamProjectDomainConfig, fetchTeamProjectDomains } from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useBrowser, useFlashlistProps } from '@/lib/hooks'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import type { Domain } from '@/types/domains'
import { Ionicons } from '@expo/vector-icons'
import Clipboard from '@react-native-clipboard/clipboard'
import { FlashList } from '@shopify/flash-list'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, useGlobalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'

export default function Domains() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()
    const navigation = useNavigation()

    const domainsQuery = useQuery({
        queryKey: ['project', projectId, 'domains'],
        queryFn: () => fetchTeamProjectDomains({ projectId }),
        enabled: !!projectId,
    })

    const Placeholder = useMemo(() => {
        const emptyDomains = buildPlaceholder({
            isLoading: domainsQuery.isLoading,
            hasData: !!domainsQuery.data?.domains.length,
            emptyLabel: 'No domains found',
            isError: domainsQuery.isError,
            errorLabel: 'Failed to fetch domains',
        })

        return emptyDomains
    }, [domainsQuery.isLoading, domainsQuery.data?.domains.length, domainsQuery.isError])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <HeaderTouchableOpacity
                    onPress={() => {
                        router.push(`/projects/${projectId}/domains/add`)
                    }}
                >
                    <Ionicons
                        name={isLiquidGlassAvailable() ? 'add-sharp' : 'add-circle-sharp'}
                        size={36}
                        color={isLiquidGlassAvailable() ? COLORS.gray1000 : COLORS.success}
                    />
                </HeaderTouchableOpacity>
            ),
        })
    }, [navigation, projectId])

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            // endFillColor={'blue'}
            refreshControl={<RefreshControl onRefresh={domainsQuery.refetch} />}
            showsVerticalScrollIndicator={false}
            data={domainsQuery.data?.domains}
            overrideProps={overrideProps}
            keyExtractor={(item) => item.name}
            ListEmptyComponent={Placeholder}
            renderItem={({ item: domain, index: domainIndex }) => (
                <DomainRow
                    domain={domain}
                    backgroundColor={domainIndex % 2 === 0 ? COLORS.gray200 : undefined}
                />
            )}
        />
    )
}

function DomainRow({ domain, backgroundColor }: { domain: Domain; backgroundColor?: string }) {
    const openBrowser = useBrowser()

    const domainConfigQuery = useQuery({
        queryKey: ['domain', domain.name, 'config'],
        queryFn: () => fetchTeamProjectDomainConfig(domain.name),
    })

    const removeDomainMutation = useMutation({
        mutationFn: () => removeDomain({ projectId: domain.projectId, domain: domain.name }),
        onMutate: async () => {
            queryClient.cancelQueries({ queryKey: ['project', domain.projectId, 'domains'] })
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ['project', domain.projectId, 'domains'] })
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    return (
        <ContextMenu
            dropdownMenuMode={true}
            actions={[
                {
                    title: 'Visit',
                },
                {
                    title: 'Remove',
                    destructive: true,
                },
            ]}
            onPress={async (e) => {
                if (e.nativeEvent.name === 'Visit') {
                    openBrowser(`https://${domain.name}`)
                } else {
                    await removeDomainMutation.mutateAsync()
                }
            }}
        >
            <View
                key={domain.name}
                style={{
                    backgroundColor: backgroundColor,
                    flexDirection: 'column',
                    padding: 16,
                    gap: 12,
                }}
            >
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Text
                        style={{
                            color:
                                domain.verified && !domainConfigQuery.data?.misconfigured
                                    ? COLORS.gray1000
                                    : COLORS.red600,
                            fontSize: 16,
                            fontWeight: '600',
                            fontFamily: 'Geist',
                        }}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                    >
                        {domain.name}
                    </Text>

                    {domainConfigQuery.isLoading && (
                        <ActivityIndicator sm={true} monochrome={true} />
                    )}
                </View>
                {domain.verified &&
                    !domainConfigQuery.data?.misconfigured &&
                    !domainConfigQuery.isLoading && (
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                            <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                                <Ionicons
                                    name="checkmark-circle"
                                    color={COLORS.success}
                                    size={16}
                                />
                                <Text style={{ color: COLORS.gray900, fontFamily: 'Geist' }}>
                                    Valid Configuration
                                </Text>
                            </View>
                            {domain.redirect && (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 2,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name="checkmark-circle"
                                        color={COLORS.success}
                                        size={16}
                                    />
                                    <Text style={{ color: COLORS.gray900, fontFamily: 'Geist' }}>
                                        Redirects to{' '}
                                        <Text
                                            style={{
                                                color: COLORS.gray1000,
                                                fontFamily: 'Geist',
                                            }}
                                        >
                                            {domain.redirect}
                                        </Text>
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                {domainConfigQuery.data?.misconfigured && (
                    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                        <Ionicons name="alert-circle" color={COLORS.red600} size={16} />
                        <Text style={{ color: COLORS.red600, fontFamily: 'Geist' }}>
                            Invalid configuration
                        </Text>
                    </View>
                )}

                {domain.verification && domain.verification.length > 0 && (
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                        <DomainVerificationRow label="Type" value={domain.verification[0].type} />

                        <DomainVerificationRow
                            label="Name"
                            value={domain.verification[0].domain}
                            copyValue={domain.verification[0].domain}
                        />

                        <DomainVerificationRow
                            label="Value"
                            value={domain.verification[0].value}
                            copyValue={domain.verification[0].value}
                        />
                    </View>
                )}
            </View>
        </ContextMenu>
    )
}

function DomainVerificationRow({
    label,
    value,
    copyValue,
}: { label: string; value: string; copyValue?: string }) {
    const [isCopied, setIsCopied] = useState(false)

    if (!copyValue)
        return (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text style={{ color: COLORS.gray900, width: 50, fontFamily: 'Geist' }}>
                    {label}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{ color: COLORS.gray1000, flex: 1, fontFamily: 'Geist' }}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                    >
                        {value}
                    </Text>
                </View>
            </View>
        )

    return (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={{ color: COLORS.gray900, width: 50, fontFamily: 'Geist' }}>{label}</Text>
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    flex: 1,
                    alignItems: 'center',
                }}
                onPress={() => {
                    Clipboard.setString(copyValue)
                    setIsCopied(true)
                    setTimeout(() => {
                        setIsCopied(false)
                    }, 2000)
                }}
            >
                <Text
                    style={{ color: COLORS.gray1000, flex: 1, fontFamily: 'Geist' }}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                >
                    {value}
                </Text>

                <Ionicons
                    name={isCopied ? 'checkmark-circle' : 'clipboard'}
                    color={COLORS.gray800}
                    size={16}
                />
            </TouchableOpacity>
        </View>
    )
}
