import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
  var body: some Widget {
    SmallShortcutWidget()
    if #available(iOS 16.0, *) {
      MediumAnalyticsWidget()
    }
    MediumFirewallWidget()
  }
}
