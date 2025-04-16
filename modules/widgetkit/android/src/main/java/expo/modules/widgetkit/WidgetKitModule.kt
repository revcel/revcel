package expo.modules.widgetkit

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetKitModule : Module() {
    companion object {
        const val groupName = "group.com.revcel.mobile"
    }

    override fun definition() = ModuleDefinition {
        Name("RevcelWidgetKit")
    }
}