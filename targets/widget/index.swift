import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
  var body: some Widget {
    SmallShortcutWidget()
    MediumAnalyticsWidget()
    MediumFirewallWidget()
  }
}
