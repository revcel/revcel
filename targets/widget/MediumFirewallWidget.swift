import WidgetKit
import SwiftUI
import AppIntents

struct MediumFirewallAppIntentConfiguration: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }

    @Parameter(title: "Favorite Emoji", default: "😃")
    var favoriteEmoji: String
}

struct MediumFirewallProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> MediumFirewallEntry {
        MediumFirewallEntry(date: Date(), configuration: MediumFirewallAppIntentConfiguration())
    }

    func snapshot(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> MediumFirewallEntry {
        MediumFirewallEntry(date: Date(), configuration: configuration)
    }
    
    func timeline(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> Timeline<MediumFirewallEntry> {
        var entries: [MediumFirewallEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = MediumFirewallEntry(date: entryDate, configuration: configuration)
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }
}

struct MediumFirewallEntry: TimelineEntry {
    let date: Date
    let configuration: MediumFirewallAppIntentConfiguration
}

struct MediumFirewallEntryView : View {
    var entry: MediumFirewallProvider.Entry

    var body: some View {
        VStack {
            Text("Time:")
            Text(entry.date, style: .time)

            Text("Favorite Emoji:")
            Text(entry.configuration.favoriteEmoji)
        }
    }
}

struct MediumFirewallWidget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: MediumFirewallAppIntentConfiguration.self, provider: MediumFirewallProvider()) { entry in
            MediumFirewallEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension MediumFirewallAppIntentConfiguration {
    fileprivate static var smiley: MediumFirewallAppIntentConfiguration {
        let intent = MediumFirewallAppIntentConfiguration()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: MediumFirewallAppIntentConfiguration {
        let intent = MediumFirewallAppIntentConfiguration()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
  MediumFirewallWidget()
} timeline: {
  MediumFirewallEntry(date: .now, configuration: .smiley)
  MediumFirewallEntry(date: .now, configuration: .starEyes)
}
