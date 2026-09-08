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
    SmallShortcutEntry(date: Date(), configuration: SmallShortcutAppIntentConfiguration(), isSubscribed: true, faviconPath: nil)
  }
  
  func snapshot(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> SmallShortcutEntry {
    SmallShortcutEntry(date: Date(), configuration: configuration, isSubscribed: true, faviconPath: nil)
  }
  
  func timeline(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> Timeline<SmallShortcutEntry> {
    let isSubscribed = readIsSubscribed()
    var faviconPath: String? = nil
    
    if let project = configuration.project {
      faviconPath = await fetchProjectFavicon(project: project)
    }
    
    let entry = SmallShortcutEntry(date: Date(), configuration: configuration, isSubscribed: isSubscribed, faviconPath: faviconPath)
    
    // `.never` left a favicon that failed once (offline at placement) broken until the app reloaded widgets
    return Timeline(entries: [entry], policy: refreshPolicy(minutes: 6 * 60))
  }
}

struct SmallShortcutEntry: TimelineEntry {
  let date: Date
  let configuration: SmallShortcutAppIntentConfiguration
  let isSubscribed: Bool
  let faviconPath: String?
}

struct SmallShortcutEntryView: View {
  var entry: SmallShortcutProvider.Entry
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(URL(string: getAppUrl(project: entry.configuration.project)))
    } else {
      VStack(alignment: .center, spacing: 10.0) {
        ProjectFavicon(faviconPath: entry.faviconPath, imageSize: 75.0)
        if let project = entry.configuration.project {
          Text("\(project.projectName)")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Color("gray1000"))
            .multilineTextAlignment(.center)
            .lineLimit(2)
            .truncationMode(.tail)
        } else {
          VStack() {
            RoundedRectangle(cornerRadius: 8.0)
              .fill(Color("backgroundSecondary"))
              .frame(height: 10.0)
            RoundedRectangle(cornerRadius: 8.0)
              .fill(Color("backgroundSecondary"))
              .frame(width: 50.0, height: 10.0)
          }
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .widgetURL(URL(string: getAppUrl(project: entry.configuration.project)))
    }
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
    .configurationDisplayName("Project Shortcut").description("Quickly open your project.")
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
  SmallShortcutEntry(date: .now, configuration: .project, isSubscribed: true, faviconPath: nil)
}
