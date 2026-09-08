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
    MediumFirewallEntry(date: Date(), configuration: MediumFirewallAppIntentConfiguration(), isSubscribed: true, faviconPath: nil, firewallData: .init(allowed: nil, denied: nil, challenged: nil))
  }
  
  func snapshot(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> MediumFirewallEntry {
    MediumFirewallEntry(date: Date(), configuration: configuration, isSubscribed: true, faviconPath: nil, firewallData: .init(allowed: nil, denied: nil, challenged: nil))
  }
  
  func timeline(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> Timeline<MediumFirewallEntry> {
    let isSubscribed = readIsSubscribed()
    var faviconPath: String? = nil
    var firewallData = FirewallWidgetData(allowed: nil, denied: nil, challenged: nil)
    
    if let project = configuration.project {
      // independent requests, run together
      async let favicon = fetchProjectFavicon(project: project)
      async let metrics = fetchFirewallData(project: project)
      
      faviconPath = await favicon
      firewallData = await metrics
    }
    
    let entry = MediumFirewallEntry(date: Date(), configuration: configuration, isSubscribed: isSubscribed, faviconPath: faviconPath, firewallData: firewallData)
    
    return Timeline(entries: [entry], policy: refreshPolicy(minutes: 15))
  }
  
  private func fetchFirewallData(project: ProjectListItem) async -> FirewallWidgetData {
    let endTime = roundToGranularity(date: .now, granularity: .fiveMinutes, mode: .down)
    let startTime = roundToGranularity(date: .now.addingTimeInterval(-24 * 60 * 60), granularity: .fiveMinutes, mode: .up)
    
    let request = FirewallMetricsRequest(
      event: "firewallAction",
      reason: "firewall_tab",
      rollups: FirewallMetricsRollups(
        value: FirewallMetricsValue(
          measure: "count",
          aggregation: "sum"
        )
      ),
      granularity: FirewallMetricsGranularity(
        minutes: 5
      ),
      groupBy: [
        "wafRuleId",
        "wafAction"
      ],
      limit: 500,
      tailRollup: "truncate",
      // only the summary is read; the full 24h timeseries was ~80 KB per reload
      summaryOnly: true,
      startTime: startTime.ISO8601Format(),
      endTime: endTime.ISO8601Format(),
      scope: FirewallMetricsScope(
        type: "project",
        ownerId: project.connectionTeam.id,
        projectIds: [project.id]
      )
    )
    
    guard let response = try? await fetchProjectFirewallMetrics(connection: project.connection, connectionTeam: project.connectionTeam, firewallMetricsRequestData: request) else {
      return FirewallWidgetData(allowed: nil, denied: nil, challenged: nil)
    }
    
    // groupBy ["wafRuleId", "wafAction"] returns one row per (rule, action), so sum per action
    func total(for action: String) -> Int? {
      let rows = response.summary.filter { $0.wafAction == action }
      return rows.isEmpty ? nil : rows.reduce(0) { $0 + $1.value }
    }
    
    return FirewallWidgetData(allowed: total(for: "allow"), denied: total(for: "deny"), challenged: total(for: "challenge"))
  }
}

struct MediumFirewallEntry: TimelineEntry {
  let date: Date
  let configuration: MediumFirewallAppIntentConfiguration
  let isSubscribed: Bool
  let faviconPath: String?
  let firewallData: FirewallWidgetData
}

struct MediumFirewallInfoItemView: View {
  var color: String
  var label: String
  var value: Int?
  
  var body: some View {
    VStack(alignment: .center, spacing: 10.0) {
      Text(value != nil ? "\(formatNumber(value ?? 0))" : "-")
        .font(.system(size: 24, weight: .bold))
        .foregroundStyle(Color("gray1000"))
      Text(label)
        .font(.system(size: 14, weight: .bold))
        .foregroundStyle(Color(color))
    }
  }
}

struct MediumFirewallEntryView: View {
  var entry: MediumFirewallProvider.Entry
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(URL(string: getAppUrl(project: entry.configuration.project)))
    } else {
      VStack(alignment: .leading, spacing: 30.0) {
        HStack(alignment: .center, spacing: 10.0) {
          ProjectFavicon(faviconPath: entry.faviconPath, imageSize: 30.0)
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
          MediumFirewallInfoItemView(color: "success", label: "Allowed", value: entry.firewallData.allowed)
          MediumFirewallInfoItemView(color: "error", label: "Denied", value: entry.firewallData.denied)
          MediumFirewallInfoItemView(color: "warning", label: "Challenged", value: entry.firewallData.challenged)
        }
        .frame(maxWidth: .infinity, alignment: .center)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .widgetURL(URL(string: getAppUrl(project: entry.configuration.project)))
    }
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
    .configurationDisplayName("Firewall").description("See the firewall metrics for your project.")
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
  MediumFirewallEntry(date: .now, configuration: .project, isSubscribed: true, faviconPath: nil, firewallData: .init(allowed: nil, denied: nil, challenged: nil))
}
