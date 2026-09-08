import { fetchProductionDeployment } from '@/api/queries'
import { COLOR_FOR_BUILD_STATUS } from '@/lib/constants'
import { formatEnvironmentLabel } from '@/lib/format'
import { getGitAuthorAvatar } from '@/lib/utils'
import { COLORS } from '@/theme/colors'
import type { Deployment } from '@/types/deployments'
import type { LatestDeployment } from '@/types/projects'
import Octicons from '@expo/vector-icons/Octicons'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useGlobalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

export default function DeploymentCard({
    deployment,
    onPress,
    children,
    disableActiveBorder = false,
}: {
    deployment: Deployment | LatestDeployment
    onPress: () => void
    children?: React.ReactNode
    disableActiveBorder?: boolean
}) {
    const { projectId } = useGlobalSearchParams<{ projectId?: string }>()

    const productionDeploymentQuery = useQuery({
        queryKey: ['project', projectId, 'productionDeployment'],
        queryFn: () => fetchProductionDeployment({ projectId: projectId! }),
        enabled: !!projectId,
    })

    const activeStyle = useMemo(() => {
        if (disableActiveBorder)
            return {
                backgroundColor: COLORS.gray200,
                borderRadius: 16,
            }
        return {
            backgroundColor:
                productionDeploymentQuery.data?.deployment.id === deployment.id
                    ? COLORS.blue100
                    : COLORS.gray200,
            borderRadius: 16,
            borderColor:
                productionDeploymentQuery.data?.deployment.id === deployment.id
                    ? COLORS.successLight
                    : undefined,
            borderWidth: 1, // so the layout doesn't shift when the border is added
        }
    }, [disableActiveBorder, deployment.id, productionDeploymentQuery.data])

    const authorName =
        deployment.meta?.githubCommitAuthorName ?? deployment.creator?.username ?? 'Unknown'

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                gap: 10,
                padding: 16,
                ...activeStyle,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Octicons
                        name="dot-fill"
                        size={24}
                        color={COLOR_FOR_BUILD_STATUS[deployment.readyState]}
                    />
                    <Text
                        style={{
                            color: COLORS.gray1000,
                            fontSize: 15,
                            fontFamily: 'Geist',
                        }}
                        numberOfLines={1}
                    >
                        {formatEnvironmentLabel(deployment.target, deployment.readySubstate)}
                    </Text>
                </View>

                {/* shrinks and truncates in the middle so the date survives a long author name */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        flexShrink: 1,
                    }}
                >
                    {/* `creator` is null for some integration-created deployments */}
                    {(deployment.creator?.uid || deployment.meta?.githubCommitAuthorName) && (
                        <Image
                            source={{
                                uri: getGitAuthorAvatar({
                                    uid: deployment.creator?.uid ?? '',
                                    username: authorName,
                                    gitHost: deployment.meta?.githubCommitAuthorName
                                        ? 'github'
                                        : undefined,
                                }),
                            }}
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                            }}
                        />
                    )}
                    <Text
                        style={{
                            color: COLORS.gray1000,
                            fontSize: 12,
                            fontWeight: '500',
                            fontFamily: 'Geist',
                            flexShrink: 1,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                    >
                        {authorName} ({format(new Date(deployment.createdAt), 'dd/MM/yyyy')})
                    </Text>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.alphaGray400 }} />

            <View
                style={{
                    gap: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Octicons
                    name="git-branch"
                    size={20}
                    color={COLORS.gray900}
                    style={
                        {
                            // needed to align with the text
                            // marginTop: 5,
                        }
                    }
                />
                <View
                    style={{
                        gap: 2,
                        justifyContent: 'space-between',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text
                            style={{
                                color: COLORS.gray1000,
                                fontSize: 14,
                                fontFamily: 'Geist',
                            }}
                        >
                            {deployment.meta?.githubCommitRef ?? 'No branch set'}
                        </Text>
                        <Text
                            style={{
                                color: COLORS.gray900,
                                fontSize: 12,
                                fontFamily: 'Geist',
                            }}
                        >
                            (#{deployment.meta?.githubCommitSha?.substring(0, 7)})
                        </Text>
                    </View>
                    <Text
                        style={{
                            color: COLORS.gray900,
                            fontSize: 12,
                            paddingRight: 20,
                            fontFamily: 'Geist',
                        }}
                        numberOfLines={1}
                    >
                        {deployment.meta?.githubCommitMessage
                            ? deployment.meta.githubCommitMessage
                            : 'No commit message'}
                    </Text>
                </View>
            </View>

            {children}
        </TouchableOpacity>
    )
}
