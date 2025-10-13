import ActivityIndicator from '@/components/base/ActivityIndicator'
import { COLORS } from '@/theme/colors'
import type { DeploymentDirectory, DeploymentFile } from '@/types/deployments'
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useMemo, useState } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { View } from 'react-native'

export type DeploymentAsset =
    | DeploymentFile
    | (DeploymentDirectory & {
          children?: DeploymentAsset[]
          hasLoadedChildren?: boolean
          isExpanded?: boolean
      })

const INDENT_SIZE = 20

export function FileTreeAsset({
    asset,
    level = 0,
    onFolderPress,
    path = '',
}: {
    asset: DeploymentAsset
    level?: number
    onFolderPress: (path: string, options?: { isToggleOnly?: boolean }) => Promise<void>
    path?: string
}) {
    const [isLoading, setIsLoading] = useState(false)

    const fullPath = useMemo(
        () => (path ? `${path}/${asset.name}` : `/${asset.name}`),
        [path, asset.name]
    )

    const handlePress = useCallback(async () => {
        if (asset.type !== 'directory') return

        if (asset.hasLoadedChildren) {
            // if we've already loaded children, just toggle expansion in the tree
            onFolderPress(fullPath, { isToggleOnly: true })
            return
        }

        // only fetch children if we haven't loaded them yet
        setIsLoading(true)
        await onFolderPress(fullPath)
        setIsLoading(false)
    }, [asset, fullPath, onFolderPress])

    // early return for files
    if (asset.type === 'file') {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingLeft: level * INDENT_SIZE,
                }}
            >
                <Ionicons name="document-outline" size={20} color={COLORS.gray900} />
                <Text
                    style={{
                        marginLeft: 8,
                        color: COLORS.gray1000,
                        fontSize: 14,
                        fontFamily: 'Geist',
                    }}
                >
                    {asset.name}
                </Text>
            </View>
        )
    }

    return (
        <View style={{ paddingRight: 2 }}>
            <TouchableOpacity
                onPress={handlePress}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingLeft: level * INDENT_SIZE,
                    gap: 8,
                }}
            >
                {isLoading ? (
                    <ActivityIndicator sm={true} monochrome={true} />
                ) : (
                    <Ionicons
                        name={asset.isExpanded ? 'folder-open-outline' : 'folder-outline'}
                        size={20}
                        color={COLORS.gray900}
                    />
                )}

                <Text
                    style={{
                        color: COLORS.gray1000,
                        fontSize: 14,
                        fontFamily: 'Geist',
                    }}
                >
                    {asset.name}
                </Text>
            </TouchableOpacity>

            {asset.isExpanded && asset.hasLoadedChildren && asset.children && (
                <View>
                    {asset.children.map((item) => (
                        <FileTreeAsset
                            key={fullPath + '/' + item.name}
                            asset={item}
                            level={level + 1}
                            onFolderPress={onFolderPress}
                            path={fullPath}
                        />
                    ))}
                </View>
            )}
        </View>
    )
}
