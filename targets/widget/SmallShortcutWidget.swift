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
    SmallShortcutEntry(date: Date(), configuration: SmallShortcutAppIntentConfiguration(), latestDeployment: nil)
  }
  
  func snapshot(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> SmallShortcutEntry {
    SmallShortcutEntry(date: Date(), configuration: configuration, latestDeployment: nil)
  }
  
  func timeline(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> Timeline<SmallShortcutEntry> {
    var entries: [SmallShortcutEntry] = []
    
    
    let latestDeployment: Deployment? = if let project = configuration.project {
      try? await fetchLatestDeplyment(connection: project.connection, projectId: project.id).deployments.first
    } else { nil }
    
    // Generate a timeline consisting of five entries an hour apart, starting from the current date.
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      let entry = SmallShortcutEntry(date: entryDate, configuration: configuration, latestDeployment: latestDeployment)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct SmallShortcutEntry: TimelineEntry {
  let date: Date
  let configuration: SmallShortcutAppIntentConfiguration
  let latestDeployment: Deployment?
}

struct SmallShortcutEntryView: View {
  var entry: SmallShortcutProvider.Entry
  
  var body: some View {
    VStack(alignment: .center, spacing: 10.0) {
//      TODO: Need to first download image
//      Image("")
//        .resizable()
//        .aspectRatio(contentMode: .fit)
//        .clipShape(Circle())
      Text("\(entry.configuration.project?.projectName ?? "")")
        .font(.system(size: 16, weight: .bold))
        .foregroundStyle(Color("gray1000"))
        .multilineTextAlignment(.center)
        .lineLimit(3)
        .truncationMode(.tail)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .widgetURL(URL(string: "revcel://projects/\(entry.configuration.project?.id ?? "")/(tabs)/home"))
  }
}

struct SmallShortcutWidget: Widget {
  let kind: String = "SmallShortcutWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: SmallShortcutAppIntentConfiguration.self, provider: SmallShortcutProvider()) { entry in
      SmallShortcutEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("background")
        }
    }
    .supportedFamilies([.systemSmall])
  }
}

extension SmallShortcutAppIntentConfiguration {
  fileprivate static var project: SmallShortcutAppIntentConfiguration {
    let intent = SmallShortcutAppIntentConfiguration()
    intent.project = .init(id: "1", projectName: "Revcel", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "2"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  SmallShortcutWidget()
} timeline: {
  SmallShortcutEntry(date: .now, configuration: .project, latestDeployment: nil)
}
