import { fetchTeamProjectEnvironment } from '@/api/queries'
import EmptyListComponent from '@/components/EmptyListComponent'
import { HeaderTouchableOpacity } from '@/components/HeaderTouchableOpacity'
import { COLORS } from '@/theme/colors'
import type { CommonEnvironment, CommonEnvironmentVariable } from '@/types/common'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useGlobalSearchParams, useNavigation } from 'expo-router'
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'

const ENVIRONMENTS: { key: CommonEnvironment; name: string }[] = [
    { key: 'development', name: 'Development' },
    { key: 'preview', name: 'Preview' },
    { key: 'production', name: 'Production' },
]

export default function Environment() {
    const { projectId } = useGlobalSearchParams<{ projectId: string }>()
    const navigation = useNavigation()

    const [searchString, setSearchString] = useState('')
    const [selectedEnvironments, setSelectedEnvironments] = useState<CommonEnvironment[]>([])

    const environmentVariablesQuery = useQuery({
        queryKey: ['project', projectId, 'environmentVariables'],
        queryFn: async () => await fetchTeamProjectEnvironment({ projectId }),
    })

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <HeaderTouchableOpacity
                    style={{
                        height: 32,
                        width: 32,
                    }}
                    onPress={() => {
                        // stops working on android
                        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
                        //     (error) => {
                        //         console.error(error)
                        //     }
                        // )
                        // setEditableEnvironmentVariable({
                        //     id: '',
                        //     key: '',
                        //     value: '',
                        //     target: ['preview', 'production'],
                        //     type: 'encrypted',
                        //     comment: '',
                        //     configurationId: null,
                        //     createdAt: Date.now(),
                        //     updatedAt: Date.now(),
                        //     createdBy: '',
                        //     updatedBy: '',
                        // })
                        router.push(`/projects/${projectId}/environment/add`)
                    }}
                >
                    <Ionicons name="add-circle-sharp" size={32} color={COLORS.success} />
                </HeaderTouchableOpacity>
            ),
            headerSearchBarOptions: {
                placeholder: 'Search',
                hideWhenScrolling: true,
                barTintColor: COLORS.background,
                textColor: COLORS.gray1000,
                placeholderTextColor: COLORS.gray900,
                onChangeText: (event: any) => setSearchString(event.nativeEvent.text),
                // autoFocus: false,
            },
        })
    }, [navigation, projectId])

    const showEditSheet = useCallback(
        async (env: CommonEnvironmentVariable) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            router.push(`/projects/${projectId}/environment/${env.id}`)
        },
        [projectId]
    )

    const filteredVariables = useMemo(
        () =>
            environmentVariablesQuery.data?.envs
                .filter((env) => env.key.toLowerCase().includes(searchString.toLowerCase()))
                .filter((env) =>
                    selectedEnvironments.length === 0
                        ? true
                        : selectedEnvironments.every((target) => env.target.includes(target))
                ) || [],
        [environmentVariablesQuery.data, searchString, selectedEnvironments]
    )

    const emptyListComponent = useMemo(() => {
        const emptyEnvironmentVariables = EmptyListComponent({
            isLoading: environmentVariablesQuery.isLoading,
            hasValue: filteredVariables.length > 0,
            emptyLabel: 'No environment variables found',
            error: environmentVariablesQuery.error,
            errorLabel: 'Failed to fetch environment variables',
        })

        return emptyEnvironmentVariables
    }, [
        environmentVariablesQuery.isLoading,
        filteredVariables.length,
        environmentVariablesQuery.error,
    ])

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={
                <RefreshControl
                    tintColor={COLORS.successLight}
                    refreshing={environmentVariablesQuery.isRefetching}
                    onRefresh={environmentVariablesQuery.refetch}
                    // android
                    progressBackgroundColor={COLORS.backgroundSecondary}
                    colors={[COLORS.successLight]}
                />
            }
            showsVerticalScrollIndicator={false}
            data={filteredVariables}
            ListHeaderComponent={
                <FlatList
                    contentContainerStyle={{
                        paddingLeft: 16,
                        paddingBottom: 12,
                        gap: 12,
                    }}
                    showsHorizontalScrollIndicator={false}
                    horizontal={true}
                    data={ENVIRONMENTS}
                    extraData={selectedEnvironments}
                    renderItem={({ item: target }) => {
                        const isSelected = selectedEnvironments.includes(target.key)
                        return (
                            <TouchableOpacity
                                key={target.key}
                                style={{
                                    backgroundColor: isSelected
                                        ? COLORS.gray300
                                        : COLORS.backgroundSecondary,
                                    padding: 8,
                                    paddingHorizontal: 16,
                                    borderRadius: 10,
                                }}
                                onPress={() => {
                                    if (isSelected) {
                                        setSelectedEnvironments(
                                            selectedEnvironments.filter((key) => key !== target.key)
                                        )
                                    } else {
                                        setSelectedEnvironments([
                                            ...selectedEnvironments,
                                            target.key,
                                        ])
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: isSelected ? COLORS.gray1000 : COLORS.gray900,
                                        textAlign: 'center',
                                    }}
                                >
                                    {target.name}
                                </Text>
                            </TouchableOpacity>
                        )
                    }}
                />
            }
            overrideProps={
                emptyListComponent && {
                    contentContainerStyle: {
                        flex: 1,
                    },
                }
            }
            ListEmptyComponent={emptyListComponent}
            // extraData={workingKeyId}
            renderItem={({ item: env, index: envIndex }) => (
                <View
                    style={{
                        backgroundColor: envIndex % 2 === 0 ? COLORS.gray200 : undefined,
                        padding: 16,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ flexDirection: 'column', gap: 4 }}>
                        <Text
                            // replace `maxWidth`
                            style={{ color: COLORS.gray1000, maxWidth: 280 }}
                            numberOfLines={1}
                        >
                            {env.key}
                        </Text>
                        <Text style={{ color: COLORS.gray900 }}>
                            {env.target.length === 3
                                ? 'All Environments'
                                : ENVIRONMENTS.filter((e) => env.target.includes(e.key))
                                      .map((e) => e.name)
                                      .join(', ')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => showEditSheet(env)} hitSlop={20}>
                        <Ionicons name="pencil" size={16} color={COLORS.gray1000} />
                    </TouchableOpacity>
                </View>
            )}
        />
    )
}
