import { fetchProjectLogs } from '@/api/queries'
import { COLORS } from '@/theme/colors'
import Ionicons from '@expo/vector-icons/build/Ionicons'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useLocalSearchParams } from 'expo-router'
import { upperFirst } from 'lodash'
import ms from 'ms'
import { useMemo } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'

export default function LogDetailsScreen() {
    const params = useLocalSearchParams()

    const logId = params.logId as string
    const projectId = params.projectId as string

    const reguestLogsQuery = useQuery({
        queryKey: ['project', projectId, 'requestLogs'],
        queryFn: () =>
            fetchProjectLogs({
                projectId,
                startDate: '1',
                attributes: {
                    level: [],
                },
            }),
        staleTime: ms('1m'),
        gcTime: ms('1m'),
        enabled: !!projectId,
    })

    const log = useMemo(() => {
        return reguestLogsQuery.data?.rows.find((log) => log.requestId === logId)
    }, [reguestLogsQuery.data, logId])

    if (!log) return null

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 0, flexDirection: 'column' }}
        >
            <InfoRow
                label="Timestamp"
                icon="time-outline"
                value={format(log.timestamp, 'HH:mm:ss')}
                backgroundColor={COLORS.gray100}
            />
            <InfoRow label="Method" icon="code-outline" value={log.requestMethod} />
            <InfoRow
                label="Status"
                icon="stats-chart-outline"
                value={log.statusCode.toString()}
                backgroundColor={COLORS.gray100}
            />
            <InfoRow label="Domain" icon="globe-outline" value={log.domain} />
            <InfoRow
                label="Path"
                icon="trail-sign-outline"
                value={log.requestPath}
                backgroundColor={COLORS.gray100}
            />
            <InfoRow label="Route" icon="navigate-outline" value={log.route} />
            <InfoRow
                label="Cache"
                icon="save-outline"
                value={log.cache}
                backgroundColor={COLORS.gray100}
            />
            <InfoRow label="Agent" icon="person-outline" value={log.clientUserAgent} />
            {log.events[0].source !== 'static' && (
                <InfoRow
                    label="Memory"
                    icon="hardware-chip-outline"
                    value={`${log.events[0].functionMaxMemoryUsed} MB`}
                    backgroundColor={COLORS.gray100}
                />
            )}
            {log.events[0].source !== 'static' && (
                <InfoRow
                    label="Duration"
                    icon="stopwatch-outline"
                    value={`${log.events[0].durationMs / 1000}s`}
                />
            )}
            <InfoRow
                label="Type"
                icon="information-circle-outline"
                value={upperFirst(log.events[0].source)}
                backgroundColor={COLORS.gray100}
            />
            <InfoRow
                label="Region"
                icon="map-outline"
                value={LABEL_FOR_REGION[log.events[0].region as keyof typeof LABEL_FOR_REGION]}
            />

            <View style={{ flexDirection: 'column' }}>
                {log.logs.map((logLine, logLineIndex) => (
                    <View
                        key={logLineIndex}
                        style={{
                            flexDirection: 'column',
                            paddingVertical: 10,
                            paddingLeft: 16,
                            // gap: 10,
                            backgroundColor:
                                logLineIndex % 2 === 0 ? COLORS.gray100 : 'transparent',
                        }}
                    >
                        <Text style={{ fontSize: 12, color: COLORS.gray900 }}>
                            {format(logLine.timestamp, 'HH:mm:ss')}
                        </Text>
                        <TextInput
                            style={{
                                fontSize: 12,
                                flex: 1,
                                color:
                                    logLine.level === 'error' ? COLORS.errorLight : COLORS.gray1000,
                            }}
                            multiline={true}
                            value={logLine.message}
                            scrollEnabled={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect={false}
                            autoFocus={true}
                            importantForAutofill="no"
                        />
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}

function InfoRow({
    label,
    icon,
    value,
    backgroundColor,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    value: string
    backgroundColor?: string
}) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                width: '100%',
                backgroundColor: backgroundColor,
            }}
        >
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon} size={20} color="#666" />
                <Text style={{ color: '#666', fontSize: 14 }}>{label}</Text>
            </View>
            <View style={{ flex: 3, alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text
                    style={{
                        color: COLORS.gray1000,
                        fontSize: 14,
                        textAlign: 'right',
                    }}
                    numberOfLines={2}
                >
                    {value}
                </Text>
            </View>
        </View>
    )
}

const LABEL_FOR_REGION = {
    arn1: 'Stockholm, Sweden',
    bom1: 'Mumbai, India',
    cdg1: 'Paris, France',
    cle1: 'Cleveland, USA',
    cpt1: 'Cape Town, South Africa',
    dub1: 'Dublin, Ireland',
    fra1: 'Frankfurt, Germany',
    gru1: 'São Paulo, Brazil',
    hkg1: 'Hong Kong',
    hnd1: 'Tokyo, Japan',
    iad1: 'Washington, D.C., USA',
    icn1: 'Seoul, South Korea',
    kix1: 'Osaka, Japan',
    lhr1: 'London, United Kingdom',
    pdx1: 'Portland, USA',
    sfo1: 'San Francisco, USA',
    sin1: 'Singapore',
    syd1: 'Sydney, Australia',
} as const
