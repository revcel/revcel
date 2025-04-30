import { NativeModule, requireNativeModule } from 'expo'
import { Connection } from './WidgetKit.types'

declare class WidgetKitModule extends NativeModule {
    addConnection(connection: Connection): void
    removeConnection(id: string): void
    setIsSubscribed(isSubscribed: boolean): void
    clearAllConnections(): void
}

export default requireNativeModule<WidgetKitModule>('RevcelWidgetKit')