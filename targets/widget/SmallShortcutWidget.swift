import WidgetKit
import SwiftUI
import AppIntents

struct SmallShortcutAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Project" }
  static var description: IntentDescription { "Select your project." }
  
  @Parameter(title: "Project")
  var project: ProjectListItem?
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
      Text("Small Shortcut Widget")
      Text("\(entry.configuration.project?.projectName ?? "")")
    }
  }
}

struct SmallShortcutWidget: Widget {
  let kind: String = "SmallShortcutWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: SmallShortcutAppIntentConfiguration.self, provider: SmallShortcutProvider()) { entry in
      SmallShortcutEntryView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
    }
    .supportedFamilies([.systemSmall])
  }
}

extension SmallShortcutAppIntentConfiguration {
  fileprivate static var project: SmallShortcutAppIntentConfiguration {
    let intent = SmallShortcutAppIntentConfiguration()
    intent.project = .init(id: "1", projectName: "Revcel")
    return intent
  }
}

#Preview(as: .systemSmall) {
  SmallShortcutWidget()
} timeline: {
  SmallShortcutEntry(date: .now, configuration: .project)
}
