import WidgetKit
import SwiftUI
import AppIntents
import Charts

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
      let quikStatsEndTime = roundToGranularity(date: .now, granularity: .fiveMinutes, mode: .down)
      let quikStatsStartTime = roundToGranularity(date: .now.addingTimeInterval(-24 * 60 * 60), granularity: .fiveMinutes, mode: .up)
      
      let analyticsEndTime = roundToGranularity(date: .now, granularity: .oneHour, mode: .up)
      let analyticsStartTime = roundToGranularity(date: .now.addingTimeInterval(-7 * 24 * 60 * 60), granularity: .oneHour, mode: .down)
      
      if analyticsAvailability.isEnabled && analyticsAvailability.hasData {
        visitorsNumber = try? await fetchProjectTotalVisitors(
          connection: project.connection,
          connectionTeam: project.connectionTeam,
          projectId: project.id,
          from: quikStatsStartTime.ISO8601Format(),
          to: quikStatsEndTime.ISO8601Format()
        ).devices
        analyticsData = try? await fetchProjectAnalyticsTimeseries(
          connection: project.connection,
          connectionTeam: project.connectionTeam,
          projectId: project.id,
          from: analyticsStartTime.ISO8601Format(),
          to: analyticsEndTime.ISO8601Format()
        )
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

struct ChartsPlaceHolder: View {
  var body: some View {
    let calendar = Calendar.current
    let today = Date()
    
    VStack(alignment: .leading) {
      Chart {
        ForEach(0...7, id: \.self) { item in
          AreaMark(
            x: .value("Weekday", calendar.date(byAdding: .day, value: -item, to: today) ?? Date()),
            y: .value("Value", Int.random(in: 0...100))
          )
          .foregroundStyle(Color("backgroundSecondary"))
        }
      }
      .chartYAxis(.hidden)
      .chartXAxis(.hidden)
    }
    .padding(.top, 50.0)
  }
}

struct MediumAnalyticsEntryView: View {
  @Environment(\.widgetContentMargins) var widgetMargins
  
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
              .padding(.leading, 15.0)
              .font(.system(size: 16, weight: .bold))
              .foregroundStyle(Color("gray1000"))
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      } else {
        HStack {
          Text("No analytics data available")
            .font(.system(size: 18.0, weight: .bold))
            .foregroundStyle(Color("gray1000"))
            .multilineTextAlignment(.center)
            .lineLimit(1)
            .truncationMode(.tail)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
      }
    }
    .padding(widgetMargins)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(
      VStack {
        if let data = entry.analyticsData {
          let chartData = data.data.map { (item) -> LineChartData in
              .init(date: ISO8601DateFormatter().date(from: item.key) ?? Date(), value: item.devices)
          }
          
          VStack(alignment: .leading) {
            Chart {
              ForEach(chartData, id: \.id) { item in
                AreaMark(
                  x: .value("Weekday", item.date),
                  y: .value("Value", item.value)
                )
                .foregroundStyle(Color("blue100"))
                LineMark(
                  x: .value("Weekday", item.date),
                  y: .value("Value", item.value)
                )
                .foregroundStyle(Color("blue700"))
              }
            }
            .chartYAxis(.hidden)
            .chartXAxis(.hidden)
          }
          .padding(.top, 35.0)
        } else if haveAnalytics {
          ChartsPlaceHolder()
        }
      }
    )
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
    .contentMarginsDisabled()
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
