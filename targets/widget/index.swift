import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
  var body: some Widget {
    SmallShortcutWidget()
    // Swift Charts requires min ios 16.0
    if #available(iOS 16.0, *) {
      MediumAnalyticsWidget()
    }
    MediumFirewallWidget()
  }
}
