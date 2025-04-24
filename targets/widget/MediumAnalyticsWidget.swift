import WidgetKit
import SwiftUI
import AppIntents

struct MediumAnalyticsAppIntentConfiguration: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }

    @Parameter(title: "Favorite Emoji Analytics", default: "😃")
    var favoriteEmoji: String
}

struct MediumAnalyticsProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> MediumAnalyticsEntry {
        MediumAnalyticsEntry(date: Date(), configuration: MediumAnalyticsAppIntentConfiguration())
    }

    func snapshot(for configuration: MediumAnalyticsAppIntentConfiguration, in context: Context) async -> MediumAnalyticsEntry {
        MediumAnalyticsEntry(date: Date(), configuration: configuration)
    }
    
    func timeline(for configuration: MediumAnalyticsAppIntentConfiguration, in context: Context) async -> Timeline<MediumAnalyticsEntry> {
        var entries: [MediumAnalyticsEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = MediumAnalyticsEntry(date: entryDate, configuration: configuration)
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }
}

struct MediumAnalyticsEntry: TimelineEntry {
    let date: Date
    let configuration: MediumAnalyticsAppIntentConfiguration
}

struct MediumAnalyticsEntryView : View {
    var entry: MediumAnalyticsProvider.Entry

    var body: some View {
        VStack {
            Text("Medium Analytics Time:")
            Text(entry.date, style: .time)

            Text("Favorite Emoji:")
            Text(entry.configuration.favoriteEmoji)
        }
    }
}

struct MediumAnalyticsWidget: Widget {
    let kind: String = "MeediumAnalyticsWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: MediumAnalyticsAppIntentConfiguration.self, provider: MediumAnalyticsProvider()) { entry in
            MediumAnalyticsEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .supportedFamilies([.systemMedium])
    }
}

extension MediumAnalyticsAppIntentConfiguration {
    fileprivate static var smiley: MediumAnalyticsAppIntentConfiguration {
        let intent = MediumAnalyticsAppIntentConfiguration()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: MediumAnalyticsAppIntentConfiguration {
        let intent = MediumAnalyticsAppIntentConfiguration()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
  MediumAnalyticsWidget()
} timeline: {
  MediumAnalyticsEntry(date: .now, configuration: .smiley)
  MediumAnalyticsEntry(date: .now, configuration: .starEyes)
}
