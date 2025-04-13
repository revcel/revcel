import { fetchTeamProjects } from '@/api/queries'
import ProjectCard from '@/components/ProjectCard'
import { usePersistedStore } from '@/store/persisted'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

export default function ProjectsAllScreen() {
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentTeamId = useMemo(() => currentConnection?.currentTeamId, [currentConnection])

    const teamProjectsQuery = useQuery({
        queryKey: ['team', currentTeamId, 'projects'],
        queryFn: () => fetchTeamProjects(),
        enabled: !!currentTeamId,
    })

    return (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            nestedScrollEnabled={true}
            style={{ flex: 1 }}
            contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 14,
                padding: 16,
                paddingBottom: 32,
            }}
        >
            {teamProjectsQuery.data?.map((project) => (
                <ProjectCard
                    project={project}
                    key={project.id}
                    onPress={() => {
                        router.back()
                    }}
                />
            ))}
        </ScrollView>
    )
}
