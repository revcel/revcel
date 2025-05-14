import { fetchTeamProjectFavicon } from '@/api/queries'
import { COLOR_FOR_BUILD_STATUS } from '@/lib/constants'
import { useBrowser } from '@/lib/hooks'
import { useStore } from '@/store/default'
import { COLORS } from '@/theme/colors'
import type { Project } from '@/types/projects'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { SquircleView } from 'expo-squircle-view'
import { useMemo } from 'react'
import { Image, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'

export default function ProjectCard({
    project,
    onPress,
}: { project: Project; onPress?: () => void }) {
    const setLogsSelectedAttributes = useStore((state) => state.setLogsSelectedAttributes)
    const openBrowser = useBrowser()

    const faviconQuery = useQuery({
        queryKey: ['project', project.id, 'favicon'],
        queryFn: () => fetchTeamProjectFavicon({ projectId: project.id }),
    })

    const { width: windowWidth } = useWindowDimensions()

    const primaryDomain = useMemo(() => {
        const primaryAlias = project.alias.find((alias) => Boolean(alias.deployment))
        return primaryAlias?.domain
    }, [project])

    const width = useMemo(() => {
        if (windowWidth < 744) {
            return '47.5%'
        }

        if (windowWidth < 1024) {
            return '31.6%'
        }

        if (windowWidth < 1280) {
            return '23.6%'
        }

        return '18.9%'
    }, [windowWidth])

    const latestDeploymentTime = useMemo(() => {
        if (!project.latestDeployments?.[0]?.createdAt) {
            return "No deployment"
        }
        try {
            return format(new Date(project.latestDeployments?.[0]?.createdAt), 'dd/MM/yyyy')
        } catch (error) {
            console.error('Error formatting latest deployment time', error)
            return "No deployment"
        }
    }, [project.latestDeployments])

    return (
        <SquircleView
            key={project.id}
            borderRadius={12}
            style={{
                width: width,
                height: 180,
                backgroundColor: COLORS.gray200,
                elevation: 3,
                overflow: 'hidden',
            }}
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    padding: 14,
                    paddingTop: 14,
                    paddingBottom: 12,
                    // gap: 0,
                    // backgroundColor: 'red',
                }}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    setLogsSelectedAttributes({ level: [] }) // reset logs filters
                    onPress?.()
                    router.push(`/projects/${project.id}/home`)
                }}
            >
                <View style={{ flexDirection: 'row' }}>
                    {faviconQuery.data && (
                        <Image
                            source={{ uri: faviconQuery.data }}
                            style={{
                                width: 16,
                                height: 16,
                                marginRight: 4,
                                marginTop: 4,
                                borderRadius: 8,
                            }}
                        />
                    )}

                    {/* {DUMMY_FAVICONS[project.name] && (
                        <Image
                            source={{ uri: DUMMY_FAVICONS[project.name] }}
                            style={{
                                width: 16,
                                height: 16,
                                marginRight: 4,
                                marginTop: 4,
                                borderRadius: 8,
                            }}
                        />
                    )} */}

                    <Text
                        numberOfLines={2}
                        style={{
                            flex: 1,
                            color: COLORS.gray1000,
                            fontSize: 16,
                            overflow: 'hidden',
                            height: 47,
                            lineHeight: 20,
                            fontWeight: '500',
                            // backgroundColor: '#ff000005',
                        }}
                        ellipsizeMode="tail"
                    >
                        {project.name}
                    </Text>
                </View>

                <View
                    style={{
                        gap: 12,
                        flex: 1,
                        justifyContent: 'space-between',
                        // backgroundColor: '#ff00ff05',
                    }}
                >
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            paddingRight: 8,
                        }}
                        onPress={() => {
                            openBrowser(`https://${primaryDomain}`)
                        }}
                    >
                        <Ionicons name="link-outline" size={16} color={COLORS.gray900} />
                        <Text
                            style={{
                                color: COLORS.gray900,
                                fontSize: 12,
                                fontWeight: 'bold',
                            }}
                            numberOfLines={1}
                        >
                            {primaryDomain}
                        </Text>
                    </TouchableOpacity>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            // backgroundColor: 'blue',
                            paddingRight: 14,
                        }}
                    >
                        {/* probably better to use project.link for the repo metadata instead of latest deployment */}
                        {project.latestDeployments?.[0]?.meta?.githubRepo && (
                            <Ionicons
                                name={'git-branch-outline'}
                                size={16}
                                color={COLORS.gray900}
                            />
                        )}
                        <Text
                            style={{
                                color: COLORS.gray900,
                                fontSize: 12,
                                lineHeight: 14,
                            }}
                            numberOfLines={2}
                        >
                            {project.latestDeployments[0]?.meta?.githubRepo
                                ? `${project.latestDeployments[0].meta.githubOrg}/${project.latestDeployments[0].meta.githubRepo}`
                                : 'No source control'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: COLORS.gray400 }} />

            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    router.push(`/deployments/${project.latestDeployments[0].id}`)
                    onPress?.()
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    paddingTop: 6,
                    paddingBottom: 10,
                    gap: 2,
                }}
            >
                <View style={{ maxWidth: '80%', flexDirection: 'column', gap: 2 }}>
                    <Text style={{ color: COLORS.gray1000, fontSize: 10 }} numberOfLines={1}>
                        {project.latestDeployments[0]?.meta?.githubCommitMessage || 'Manual deploy'}
                    </Text>
                    <Text style={{ color: COLORS.gray900, fontSize: 10, fontWeight: 'semibold' }}>
                        {latestDeploymentTime}
                    </Text>
                </View>

                {project.latestDeployments?.[0]?.readyState && (
                    <View
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor:
                                COLOR_FOR_BUILD_STATUS[project.latestDeployments[0].readyState],
                        }}
                    />
                )}
            </TouchableOpacity>
        </SquircleView>
    )
}
