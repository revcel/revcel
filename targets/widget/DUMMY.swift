import AppIntents
import SwiftUI
import WidgetKit

private let SUITE_NAME: String = "group.com.anonymous.lifer"

struct DUMMYConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }

    // An example configurable parameter.
    @Parameter(title: "Activity Name", default: "Running")
    var activityName: String
}

struct DUMMYFetcher {
  static func getActivityData(name: String) -> String {
      let _connectionsKey: String = "test"

      guard let sharedDefaults = UserDefaults(suiteName: SUITE_NAME) else {
          return ""
      }

      guard let rawExistingConnections = sharedDefaults.string(forKey: _connectionsKey) else {
          return ""
      }

      return rawExistingConnections
  }
}

struct DUMMYProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DUMMYEntry {
        DUMMYEntry(date: .now, activityName: "Running", activityData: [1, 0, 1])
    }

    func snapshot(for configuration: DUMMYConfigurationIntent, in context: Context) async
        -> DUMMYEntry
    {
        //    DUMMYEntry(date: Date(), configuration: configuration)
        DUMMYEntry(date: .now, activityName: "Running", activityData: [1, 0, 1])
    }

    func timeline(for configuration: DUMMYConfigurationIntent, in context: Context) async -> Timeline<
        DUMMYEntry
    > {
        var entries: [DUMMYEntry] = []

        let data = DUMMYFetcher.getActivityData(name: configuration.activityName)

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0..<5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = DUMMYEntry(date: entryDate, activityName: data, activityData: [1, 0, 1])
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }

}

struct DUMMYEntry: TimelineEntry {
    var date: Date

    // other params, do not pass base config (deconstruct before)
    //    let date: Date
    //    let configuration: DUMMYConfigurationIntent

    let activityName: String
    let activityData: [Int]
}

struct DUMMYView: View {
    var entry: DUMMYProvider.Entry

    var activityName: String { entry.activityName }
    var activityData: [Int] { entry.activityData }

    var body: some View {
        VStack {
            Text(activityName)

            Text("Favorite Emoji:")
            //            Text(entry.configuration.favoriteEmoji)
        }
    }
}

struct DUMMYWidget: Widget {
    let kind: String = "DUMMYWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind, intent: DUMMYConfigurationIntent.self, provider: DUMMYProvider()
        ) { entry in DUMMYView(entry: entry).containerBackground(Color("Red"), for: .widget) }
        .configurationDisplayName("Widgets").description("Displays widgets.").supportedFamilies([.systemSmall])
    }
}

// MARK: - Preview

//let placeholderWidget: DUMMYEntry = DUMMYEntry(
//  activityName: "Running",
//  activityData: DUMMYConfigurationIntent(favoriteEmoji: IntentParameter(title: "a"))
//)

#Preview(as: .systemSmall) { DUMMYWidget() } timeline: {
    DUMMYEntry(date: .now, activityName: "Running", activityData: [1, 0, 1])
    DUMMYEntry(date: .now, activityName: "Running", activityData: [1, 0, 1])
}
