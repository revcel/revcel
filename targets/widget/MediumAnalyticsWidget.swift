import WidgetKit
import SwiftUI
import AppIntents

struct MediumAnalyticsAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Project" }
  static var description: IntentDescription { "Select your project." }
  
  @Parameter(title: "Project")
  var project: ProjectListItem?
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
      Text("Medium Analytics Widget")
      Text("\(entry.configuration.project?.projectName ?? "")")
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .widgetURL(URL(string: entry.configuration.project != nil ? "revcel://projects/\(entry.configuration.project?.id ?? "")/(tabs)/home" : "revcel://"))
  }
}

struct MediumAnalyticsWidget: Widget {
  let kind: String = "MeediumAnalyticsWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: MediumAnalyticsAppIntentConfiguration.self, provider: MediumAnalyticsProvider()) { entry in
      MediumAnalyticsEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("background")
        }
    }
    .supportedFamilies([.systemMedium])
  }
}

extension MediumAnalyticsAppIntentConfiguration {
  fileprivate static var project: MediumAnalyticsAppIntentConfiguration {
    let intent = MediumAnalyticsAppIntentConfiguration()
    intent.project = .init(id: "1", projectName: "Revcel", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "2"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  MediumAnalyticsWidget()
} timeline: {
  MediumAnalyticsEntry(date: .now, configuration: .project)
}
