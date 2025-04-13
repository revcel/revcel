import {
    fetchTeamDeploymenBuildFileTree,
    fetchTeamDeployment,
    fetchTeamDeploymentBuildMetadata,
} from '@/api/queries'
import { type DeploymentAsset, FileTreeAsset } from '@/components/DeploymentFileTree'
import { formatDeploymentShortId } from '@/lib/format'
import { COLORS } from '@/theme/colors'
import type { Deployment } from '@/types/deployments'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native'

function updateTreeRecursively(
    items: DeploymentAsset[],
    targetPath: string,
    updates?: {
        children?: DeploymentAsset[]
        isExpanded?: boolean
        hasLoadedChildren?: boolean
    }
): DeploymentAsset[] {
    return items.map((item) => {
        const itemPath = targetPath.split('/').pop()

        // this means if a folder has the same path as another root folder
        // both will open because we only check the last part of the path
        // this is not a key issues (altought that should be worked on)
        if (item.type === 'directory' && item.name === itemPath) {
            return {
                ...item,
                ...updates,
                isExpanded: updates?.isExpanded ?? !item.isExpanded,
            }
        }

        if (item.type === 'directory' && item.children) {
            const updatedChildren = updateTreeRecursively(item.children, targetPath, updates)
            if (updatedChildren !== item.children) {
                return {
                    ...item,
                    children: updatedChildren,
                }
            }
        }
        return item
    })
}

async function getTreeForPath(path: string, deployment: Deployment) {
    const tree = await fetchTeamDeploymenBuildFileTree({
        deploymentUrl: deployment.url,
        base: 'out' + path,
    })
    return tree
}

export default function DeploymentOutput() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()
    const [fileTree, setFileTree] = useState<DeploymentAsset[]>([])

    const deploymentQuery = useQuery({
        queryKey: ['deployment', deploymentId],
        queryFn: () => fetchTeamDeployment({ deploymentId }),
    })

    const deploymentBuildMetadataQuery = useQuery({
        queryKey: ['deployment', deploymentId, 'buildMetadata'],
        queryFn: () => fetchTeamDeploymentBuildMetadata({ deployment: deploymentQuery.data! }),
        enabled: !!deploymentQuery.data,
    })

    const handleFolderPress = useCallback(
        async (path: string, { isToggleOnly = false }: { isToggleOnly?: boolean } = {}) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

            if (!deploymentQuery.data) return

            if (isToggleOnly) {
                setFileTree((currentTree) => updateTreeRecursively(currentTree, path))
                return
            }

            const tree = await getTreeForPath(path, deploymentQuery.data)
            if (!tree) return

            setFileTree((currentTree) =>
                updateTreeRecursively(currentTree, path, {
                    children: tree,
                    hasLoadedChildren: true,
                    isExpanded: true,
                })
            )
        },
        [deploymentQuery.data]
    )

    useEffect(() => {
        if (deploymentBuildMetadataQuery.data?.outputFileTree) {
            setFileTree(deploymentBuildMetadataQuery.data.outputFileTree)
        }
    }, [deploymentBuildMetadataQuery.data?.outputFileTree])

    if (deploymentQuery.isLoading || deploymentBuildMetadataQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.success} />
            </View>
        )
    }

    if (!deploymentQuery.data) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>Missing deployment</Text>
            </View>
        )
    }

    if (!fileTree.length) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000 }}>No output files found</Text>
            </View>
        )
    }

    return (
        <>
            <Stack.Screen
                name="output"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: `Output (${formatDeploymentShortId(deploymentQuery.data)})`,
                }}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        tintColor={COLORS.successLight}
                        refreshing={deploymentBuildMetadataQuery.isRefetching}
                        onRefresh={deploymentBuildMetadataQuery.refetch}
                        // android
                        progressBackgroundColor={COLORS.backgroundSecondary}
                        colors={[COLORS.successLight]}
                    />
                }
            >
                <View style={{ padding: 16 }}>
                    {fileTree.map((item, index) => (
                        <FileTreeAsset
                            key={index + item.name}
                            asset={item}
                            onFolderPress={handleFolderPress}
                            path=""
                        />
                    ))}
                </View>
            </ScrollView>
        </>
    )
}
