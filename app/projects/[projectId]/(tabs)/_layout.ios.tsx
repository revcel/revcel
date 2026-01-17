import { COLORS } from '@/theme/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Icon, Label, VectorIcon } from 'expo-router'
import { NativeTabs } from 'expo-router/unstable-native-tabs'

export default function TabsLayout() {
    return (
        <NativeTabs disableTransparentOnScrollEdge={true} tintColor={COLORS.successLight}>
            <NativeTabs.Trigger name="home">
                <Label>Deployments</Label>
                <Icon src={<VectorIcon family={Ionicons} name="rocket" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="logs">
                <Label>Logs</Label>
                <Icon src={<VectorIcon family={Ionicons} name="document-text" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="environment">
                <Label>Environment</Label>
                <Icon src={<VectorIcon family={Ionicons} name="eye" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="domains">
                <Label>Domains</Label>
                <Icon src={<VectorIcon family={Ionicons} name="link" />} />
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
