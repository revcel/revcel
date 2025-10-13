import {
    fetchTeamDeploymenBuildFileTree,
    fetchTeamDeployment,
    fetchTeamDeploymentBuildMetadata,
} from '@/api/queries'
import { type DeploymentAsset, FileTreeAsset } from '@/components/DeploymentFileTree'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import RefreshControl from '@/components/base/RefreshControl'
import { formatDeploymentShortId } from '@/lib/format'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

export default function DeploymentSource() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()
    const [fileTree, setFileTree] = useState<DeploymentAsset[]>([])

    const deploymentQuery = useQuery({
        queryKey: ['deployment', deploymentId],
        queryFn: () => fetchTeamDeployment({ deploymentId }),
        enabled: !!deploymentId,
    })

    const deploymentBuildMetadataQuery = useQuery({
        queryKey: ['deployment', deploymentId, 'buildMetadata'],
        queryFn: () => fetchTeamDeploymentBuildMetadata({ deployment: deploymentQuery.data! }),
        enabled: !!deploymentQuery.data,
    })

    const getTreeForPath = useCallback(
        async (path: string) => {
            if (!deploymentQuery.data) return

            const tree = await fetchTeamDeploymenBuildFileTree({
                deploymentUrl: deploymentQuery.data.url,
                base: 'src' + path,
            })
            return tree
        },
        [deploymentQuery.data]
    )

    const updateTreeRecursively = useCallback(
        (
            items: DeploymentAsset[],
            targetPath: string,
            updates?: {
                children?: DeploymentAsset[]
                isExpanded?: boolean
                hasLoadedChildren?: boolean
            }
        ): DeploymentAsset[] => {
            return items.map((item) => {
                const itemPath = targetPath.split('/').pop()

                if (item.type === 'directory' && item.name === itemPath) {
                    return {
                        ...item,
                        ...updates,
                        isExpanded: updates?.isExpanded ?? !item.isExpanded,
                    }
                }

                if (item.type === 'directory' && item.children) {
                    const updatedChildren = updateTreeRecursively(
                        item.children,
                        targetPath,
                        updates
                    )
                    if (updatedChildren !== item.children) {
                        return {
                            ...item,
                            children: updatedChildren,
                        }
                    }
                }
                return item
            })
        },
        []
    )

    const handleFolderPress = useCallback(
        async (path: string, { isToggleOnly = false }: { isToggleOnly?: boolean } = {}) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

            if (isToggleOnly) {
                setFileTree((currentTree) => updateTreeRecursively(currentTree, path))
                return
            }

            const tree = await getTreeForPath(path)
            if (!tree) return

            setFileTree((currentTree) =>
                updateTreeRecursively(currentTree, path, {
                    children: tree,
                    hasLoadedChildren: true,
                    isExpanded: true,
                })
            )
        },
        [getTreeForPath, updateTreeRecursively]
    )

    useEffect(() => {
        if (deploymentBuildMetadataQuery.data?.sourceFileTree) {
            setFileTree(deploymentBuildMetadataQuery.data.sourceFileTree)
        }
    }, [deploymentBuildMetadataQuery.data?.sourceFileTree])

    if (deploymentQuery.isLoading || deploymentBuildMetadataQuery.isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
            </View>
        )
    }

    if (!deploymentQuery.data) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    Missing deployment
                </Text>
            </View>
        )
    }

    if (!fileTree.length) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: COLORS.gray1000, fontFamily: 'Geist' }}>
                    No source files found
                </Text>
            </View>
        )
    }

    return (
        <>
            <Stack.Screen
                // name="source"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: `Source (${formatDeploymentShortId(deploymentQuery.data)})`,
                }}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl onRefresh={deploymentBuildMetadataQuery.refetch} />}
            >
                <View style={{ padding: 16 }}>
                    {fileTree.map((item, index) => (
                        <FileTreeAsset
                            key={item.name + index}
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
