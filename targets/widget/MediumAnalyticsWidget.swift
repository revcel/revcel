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
    MediumAnalyticsEntry(date: Date(), configuration: MediumAnalyticsAppIntentConfiguration(), faviconPath: nil, visitors: nil, analyticsAvailability: nil, analyticsData: nil)
  }
  
  func snapshot(for configuration: MediumAnalyticsAppIntentConfiguration, in context: Context) async -> MediumAnalyticsEntry {
    MediumAnalyticsEntry(date: Date(), configuration: configuration, faviconPath: nil, visitors: nil, analyticsAvailability: nil, analyticsData: nil)
  }
  
  func timeline(for configuration: MediumAnalyticsAppIntentConfiguration, in context: Context) async -> Timeline<MediumAnalyticsEntry> {
    var entries: [MediumAnalyticsEntry] = []
    var faviconPath: String? = nil
    var latestDeployment: Deployment? = nil
    var visitorsNumber: Int? = nil
    var analyticsAvailability: AnalyticsEnabledResponse? = nil
    var analyticsData: AnalyticsTimeseriesResponse? = nil
    
    if let project = configuration.project {
      analyticsAvailability = try? await fetchProjectAnalyticsAvailability(connection: project.connection, connectionTeam: project.connectionTeam, projectId: project.id)
      latestDeployment = try? await fetchLatestDeplyment(connection: project.connection, projectId: project.id).deployments.first
    }
    
    if let analyticsAvailability, let project = configuration.project {
      let endTime = roundToGranularity(date: .now, granularity: .fiveMinutes, mode: .down)
      let startTime = roundToGranularity(date: .now.addingTimeInterval(-24 * 60 * 60), granularity: .fiveMinutes, mode: .up)
      
      if analyticsAvailability.isEnabled && analyticsAvailability.hasData {
        visitorsNumber = try? await fetchProjectTotalVisitors(connection: project.connection, connectionTeam: project.connectionTeam, projectId: project.id, from: startTime.ISO8601Format(), to: endTime.ISO8601Format()).total
        analyticsData = try? await fetchProjectAnalyticsTimeseries(connection: project.connection, connectionTeam: project.connectionTeam, projectId: project.id, from: startTime.ISO8601Format(), to: endTime.ISO8601Format())
      }
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
      let entry = MediumAnalyticsEntry(date: entryDate, configuration: configuration, faviconPath: faviconPath, visitors: visitorsNumber, analyticsAvailability: analyticsAvailability, analyticsData: analyticsData)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct MediumAnalyticsEntry: TimelineEntry {
  let date: Date
  let configuration: MediumAnalyticsAppIntentConfiguration
  let faviconPath: String?
  let visitors: Int?
  let analyticsAvailability: AnalyticsEnabledResponse?
  let analyticsData: AnalyticsTimeseriesResponse?
}

struct MediumAnalyticsEntryView : View {
  var entry: MediumAnalyticsProvider.Entry
  var haveAnalytics: Bool {
    if let analyticsAvailability = entry.analyticsAvailability {
      return analyticsAvailability.hasData && analyticsAvailability.isEnabled
    }
    
    return true
  }
  
  var body: some View {
    VStack {
      if haveAnalytics {
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
          if let visitors = entry.visitors {
            Text("\(visitors) Visitors")
              .font(.system(size: 16, weight: .bold))
              .foregroundStyle(Color("gray1000"))
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      } else {
        HStack {
          Text("No analytics data available")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Color("gray1000"))
            .multilineTextAlignment(.center)
            .lineLimit(1)
            .truncationMode(.tail)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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
  MediumAnalyticsEntry(date: .now, configuration: .project, faviconPath: nil, visitors: 0, analyticsAvailability: nil, analyticsData: nil)
}
