import WidgetKit
import SwiftUI
import AppIntents

struct MediumFirewallAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Project" }
  static var description: IntentDescription { "Select your project." }
  
  @Parameter(title: "Project")
  var project: ProjectListItem?
}

struct MediumFirewallProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> MediumFirewallEntry {
    MediumFirewallEntry(date: Date(), configuration: MediumFirewallAppIntentConfiguration(), faviconPath: nil, firewallData: .init(allowed: nil, denied: nil, chalanged: nil))
  }
  
  func snapshot(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> MediumFirewallEntry {
    MediumFirewallEntry(date: Date(), configuration: configuration, faviconPath: nil, firewallData: .init(allowed: nil, denied: nil, chalanged: nil))
  }
  
  func timeline(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> Timeline<MediumFirewallEntry> {
    var entries: [MediumFirewallEntry] = []
    var faviconPath: String? = nil
    var latestDeployment: Deployment? = nil
    var firewallData: FirewallWidgetData = .init(allowed: nil, denied: nil, chalanged: nil)
    
    if let project = configuration.project {
      latestDeployment = try? await fetchLatestDeplyment(connection: project.connection, projectId: project.id).deployments.first
    }
    
    if let latestDeployment = latestDeployment, let project = configuration.project{
      if let url = URL(string: "https://vercel.com/api/v0/deployments/\(latestDeployment.uid)/favicon?teamId=\(project.connectionTeam.id)") {
        faviconPath = try? await downloadAndSaveImage(from: url, name: project.id)
      }
    }
    
    // Generate a timeline consisting of five entries an hour apart, starting from the current date.
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      // TODO: Actually ftech data to be displayed
      let entry = MediumFirewallEntry(date: entryDate, configuration: configuration, faviconPath: faviconPath, firewallData: firewallData)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct MediumFirewallEntry: TimelineEntry {
  let date: Date
  let configuration: MediumFirewallAppIntentConfiguration
  let faviconPath: String?
  let firewallData: FirewallWidgetData
}

struct MediumFirewallInfoItemView: View {
  var color: String
  var value: Int?
  
  var body: some View {
    VStack(alignment: .center, spacing: 10.0) {
      Text(value != nil ? "\(String(describing: value)))" : "-")
        .font(.system(size: 22, weight: .bold))
        .foregroundStyle(Color("gray1000"))
      Text("Allowed")
        .font(.system(size: 14, weight: .bold))
        .foregroundStyle(Color(color))
    }
  }
}

struct MediumFirewallEntryView: View {
  var entry: MediumFirewallProvider.Entry
  
  var body: some View {
    VStack(alignment: .leading, spacing: 30.0) {
      HStack(alignment: .center, spacing: 10.0) {
        if let path = entry.faviconPath, let uiImage = UIImage(contentsOfFile: path) {
          Image(uiImage: uiImage)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 30.0, height: 30.0)
            .clipShape(Circle())
        } else {
          Circle()
            .fill(Color("backgroundSecondary"))
            .frame(width: 30.0, height: 30.0)
        }
        if let project = entry.configuration.project {
          Text("\(project.projectName)")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Color("gray1000"))
            .multilineTextAlignment(.center)
            .lineLimit(1)
            .truncationMode(.tail)
        } else {
          VStack {
            RoundedRectangle(cornerRadius: 8.0)
              .fill(Color("backgroundSecondary"))
              .frame(height: 10.0)
          }
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      HStack(alignment: .center, spacing: 30.0) {
        MediumFirewallInfoItemView(color: "success", value: entry.firewallData.allowed)
        MediumFirewallInfoItemView(color: "error", value: entry.firewallData.denied)
        MediumFirewallInfoItemView(color: "warning", value: entry.firewallData.chalanged)
      }
      .frame(maxWidth: .infinity, alignment: .center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(URL(string: entry.configuration.project != nil ? "revcel://projects/\(entry.configuration.project?.id ?? "")/(tabs)/home" : "revcel://"))
  }
}

struct MediumFirewallWidget: Widget {
  let kind: String = "MediumFirewallWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: MediumFirewallAppIntentConfiguration.self, provider: MediumFirewallProvider()) { entry in
      MediumFirewallEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("background")
        }
    }
    .supportedFamilies([.systemMedium])
  }
}

extension MediumFirewallAppIntentConfiguration {
  fileprivate static var project: MediumFirewallAppIntentConfiguration {
    let intent = MediumFirewallAppIntentConfiguration()
    intent.project = .init(id: "1", projectName: "Revcel", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "2"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  MediumFirewallWidget()
} timeline: {
  MediumFirewallEntry(date: .now, configuration: .project, faviconPath: nil, firewallData: .init(allowed: nil, denied: nil, chalanged: nil))
}
