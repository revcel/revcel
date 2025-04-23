import WidgetKit
import SwiftUI
import AppIntents

struct SmallShortcutAppIntentConfiguration: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }

    @Parameter(title: "Favorite Emoji", default: "😃")
    var favoriteEmoji: String
}

struct SmallShortcutProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SmallShortcutEntry {
        SmallShortcutEntry(date: Date(), configuration: SmallShortcutAppIntentConfiguration())
    }

    func snapshot(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> SmallShortcutEntry {
        SmallShortcutEntry(date: Date(), configuration: configuration)
    }
    
    func timeline(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> Timeline<SmallShortcutEntry> {
        var entries: [SmallShortcutEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SmallShortcutEntry(date: entryDate, configuration: configuration)
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }
}

struct SmallShortcutEntry: TimelineEntry {
    let date: Date
    let configuration: SmallShortcutAppIntentConfiguration
}

struct SmallShortcutEntryView : View {
    var entry: SmallShortcutProvider.Entry

    var body: some View {
        VStack {
            Text("Time:")
            Text(entry.date, style: .time)

            Text("Favorite Emoji:")
            Text(entry.configuration.favoriteEmoji)
        }
    }
}

struct SmallShortcutWidget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SmallShortcutAppIntentConfiguration.self, provider: SmallShortcutProvider()) { entry in
            SmallShortcutEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension SmallShortcutAppIntentConfiguration {
    fileprivate static var smiley: SmallShortcutAppIntentConfiguration {
        let intent = SmallShortcutAppIntentConfiguration()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: SmallShortcutAppIntentConfiguration {
        let intent = SmallShortcutAppIntentConfiguration()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
  SmallShortcutWidget()
} timeline: {
  SmallShortcutEntry(date: .now, configuration: .smiley)
  SmallShortcutEntry(date: .now, configuration: .starEyes)
}
