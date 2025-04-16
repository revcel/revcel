import { NativeModule, requireNativeModule } from 'expo'

declare class WidgetKitModule extends NativeModule {
    // todo public API
}

export default requireNativeModule<WidgetKitModule>('RevcelWidgetKit')